const express = require('express');
const path = require('path');
const { connectToMongo } = require('./mongo_db');
const { initialize, getConnection } = require('./oracle_db');
const { ObjectId } = require('mongodb');

const app = express();

// Variable compartida para la colección de MongoDB
let recipesCol;

// 1. Middleware para servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '..')));

// 2. Middleware para parsear JSON
app.use(express.json());

// 3. Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password, avatar } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `INSERT INTO usuarios VALUES (
        Usuario_Typ(
          usuarios_seq.NEXTVAL,
          :1, :2, :3, :4, :5, :6,
          '{"recetas": []}'
        )
      ) RETURNING idUsuario INTO :7`,
      [firstName, lastName, username, email, password, avatar, 
       { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }]
    );
    res.status(201).json({ id: result.outBinds[0][0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Endpoint de LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT u.idUsuario, u.first_name, u.last_name, u.username, u.email, u.avatar 
       FROM usuarios u WHERE TRIM(u.email) = :email AND u.password = :password`,
      { email: email.trim(), password }
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user[0],
      firstName: user[1],
      lastName: user[2], 
      username: user[3],
      email: user[4],
      avatar: user[5]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// 5. Ruta para obtener un usuario
// En server.js agrega:
app.post('/users/:userId/recipes', async (req, res) => {
  const { userId } = req.params;
  const { recipeId } = req.body;
  
  // 1. Agregar receta a MongoDB (tu lógica actual)
  // 2. Actualizar array en Oracle:
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      `UPDATE users 
       SET recipes = JSON_ARRAY_APPEND(recipes, '$', :1) 
       WHERE id = :2`,
      [recipeId, userId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// 6. Ruta para obtener todos los usuarios
app.get('/users/:id/with-recipes', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    // Datos de Oracle
    connection = await getConnection();
    const user = await connection.execute(
      'SELECT * FROM users WHERE id = :id', 
      { id }
    );
    
    // Recetas de MongoDB usando la colección compartida
    const recipes = await recipesCol.find({ 
      _id: { $in: user.rows[0].RECIPES } 
    }).toArray();
    
    res.json({
      ...user.rows[0],
      recipes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// 7. Ruta para crear recetas
// Ruta para crear recetas (MongoDB)
app.post('/recipes', async (req, res) => {
    try {
        const recipeData = {
            ...req.body,
            createdAt: new Date().toISOString(),
            rating: 0,
            ratingCount: 0,
            comments: []
        };
        const result = await recipesCol.insertOne(recipeData);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Ruta para obtener todas las recetas
// Ruta para obtener recetas con autor de Oracle
app.get('/recipes/:id', async (req, res) => {
    try {
        const recipe = await recipesCol.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        
        // Obtener info del autor desde Oracle
        let connection;
        try {
            connection = await getConnection();
            const author = await connection.execute(
                'SELECT first_name, last_name FROM users WHERE id = :id',
                { id: recipe.authorId }
            );
            
            res.json({
                ...recipe,
                author: `${author.rows[0][0]} ${author.rows[0][1]}`
            });
        } finally {
            if (connection) await connection.close();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agrega en server.js
app.post('/recipes/:id/comments', async (req, res) => {
    try {
        const { userId, content, rating } = req.body;
        
        // Obtener info del usuario desde Oracle
        let connection;
        let user;
        try {
            connection = await getConnection();
            user = await connection.execute(
                'SELECT first_name, last_name FROM users WHERE id = :id',
                { id: userId }
            );
        } finally {
            if (connection) await connection.close();
        }
        
        const newComment = {
            id: new Date().getTime(),
            userId,
            author: `${user.rows[0][0]} ${user.rows[0][1]}`,
            rating,
            content,
            createdAt: new Date().toISOString()
        };
        
        const result = await recipesCol.updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $push: { comments: newComment },
                $inc: { ratingCount: 1 },
                $set: { 
                    rating: await calculateNewRating(req.params.id, rating) 
                }
            }
        );
        
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function calculateNewRating(recipeId, newRating) {
    const recipe = await recipesCol.findOne({ _id: new ObjectId(recipeId) });
    return ((recipe.rating * recipe.ratingCount) + newRating) / (recipe.ratingCount + 1);
}

// Inicialización de las bases de datos y servidor
(async () => {
  try {
    await initialize();                         // Inicializar pool Oracle
    ({ collection: recipesCol } = await connectToMongo());  // Única conexión Mongo
    
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log('Servidor listo');
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`Endpoints disponibles:`);
        console.log(`- POST /register      Registrar usuario`);
        console.log(`- GET  /users         Obtener todos los usuarios`);
        console.log(`- GET  /users/:id     Obtener usuario específico`);
        console.log(`- POST /recipes       Crear nueva receta`);
        console.log(`- GET  /recipes       Obtener todas las recetas`);
    });
  } catch (error) {
    console.error('Error al inicializar las bases de datos:', error);
    process.exit(1);
  }
})();
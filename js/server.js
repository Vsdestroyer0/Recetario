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

// ✅ ENDPOINT DE REGISTRO
app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password, avatar } = req.body;
  let connection;
  try {
    connection = await getConnection();
    
    // Obtener el siguiente ID de la secuencia
    const seqResult = await connection.execute('SELECT usuarios_seq.NEXTVAL FROM DUAL');
    const nextId = seqResult.rows[0][0];
    
    // Insertar usando el ID obtenido
    await connection.execute(
      `INSERT INTO usuarios VALUES (
        Usuario_Typ(:1, :2, :3, :4, :5, :6, :7, :8)
      )`,
      [nextId, firstName, lastName, username, email, password, avatar, '{"recetas": []}']
    );
    
    await connection.commit();
    res.status(201).json({ id: nextId });
    
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ ENDPOINT DE LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Intento de login:', { email, password: '***' });
  
  let connection;
  try {
    connection = await getConnection();
    
    // Consulta para buscar usuario por email
    const result = await connection.execute(
      `SELECT u.idUsuario, u.first_name, u.last_name, u.username, u.email, u.avatar, u.password
       FROM usuarios u 
       WHERE UPPER(TRIM(u.email)) = UPPER(TRIM(:email))`,
      { email: email.trim() }
    );

    console.log('👥 Usuarios encontrados:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado con email:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const storedPassword = user[6]; // password está en posición 6
    
    console.log('🔑 Verificando contraseña...');
    
    // Verificar contraseña
    if (password.trim() !== storedPassword.trim()) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // ✅ Login exitoso
    console.log('✅ Login exitoso para:', user[3]);
    res.json({
      id: user[0],
      firstName: user[1],
      lastName: user[2], 
      username: user[3],
      email: user[4],
      avatar: user[5]
    });
    
  } catch (err) {
    console.error('💥 Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ ENDPOINT PARA DEBUG - VER USUARIOS (SOLO UNA VEZ)
app.get('/debug/users', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT u.idUsuario, u.first_name, u.last_name, u.username, u.email, 
              u.password, u.avatar
       FROM usuarios u`
    );

    res.json({
      total: result.rows.length,
      usuarios: result.rows.map(row => ({
        id: row[0],
        firstName: row[1],
        lastName: row[2],
        username: row[3],
        email: row[4],
        password: row[5], // Mostrar para debug
        avatar: row[6]
      }))
    });
    
  } catch (err) {
    console.error('Error en debug:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ OBTENER USUARIO CON RECETAS
app.get('/users/:id/with-recipes', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    const userResult = await connection.execute(
      'SELECT * FROM usuarios WHERE idUsuario = :id',
      { id }
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Obtener recetas de MongoDB
    const recipeIds = JSON.parse(user[7] || '{"recetas": []}').recetas;
    const recipes = await recipesCol.find({
      _id: { $in: recipeIds.map(id => new ObjectId(id)) }
    }).toArray();

    res.json({
      id: user[0],
      firstName: user[1],
      lastName: user[2],
      username: user[3], 
      email: user[4],
      avatar: user[6],
      recipes
    });
    
  } catch (err) {
    console.error('Error obteniendo usuario:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ CREAR RECETA
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

// ✅ OBTENER RECETA POR ID
app.get('/recipes/:id', async (req, res) => {
    try {
        const recipe = await recipesCol.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        
        // Obtener info del autor desde Oracle
        let connection;
        try {
            connection = await getConnection();
            const author = await connection.execute(
                'SELECT first_name, last_name FROM usuarios WHERE idUsuario = :id',
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

// Inicialización de las bases de datos y servidor
(async () => {
  try {
    await initialize();                         // Inicializar pool Oracle
    ({ collection: recipesCol } = await connectToMongo());  // Única conexión Mongo
    
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log('Endpoints disponibles:');
      console.log('- POST /register      Registrar usuario');
      console.log('- POST /login         Iniciar sesión');
      console.log('- GET  /debug/users   Ver usuarios (debug)');
      console.log('- GET  /users/:id/with-recipes   Usuario con recetas');
      console.log('- POST /recipes       Crear nueva receta');
      console.log('- GET  /recipes/:id   Obtener receta específica');
    });
  } catch (error) {
    console.error('Error al inicializar las bases de datos:', error);
    process.exit(1);
  }
})();

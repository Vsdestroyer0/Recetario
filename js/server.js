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
    
    // Verificar si el usuario ya existe
    const existingUser = await connection.execute(
      `SELECT COUNT(*) FROM usuarios WHERE UPPER(TRIM(email)) = UPPER(TRIM(:email)) OR UPPER(TRIM(username)) = UPPER(TRIM(:username))`,
      { email: email.trim(), username: username.trim() }
    );
    
    if (existingUser.rows[0][0] > 0) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }
    
    // Obtener el siguiente ID de la secuencia
    const seqResult = await connection.execute('SELECT usuarios_seq.NEXTVAL FROM DUAL');
    const nextId = seqResult.rows[0][0];
    
    // Insertar nuevo usuario
    await connection.execute(
      `INSERT INTO usuarios (idUsuario, first_name, last_name, username, email, password, avatar, recipes) 
       VALUES (:id, :firstName, :lastName, :username, :email, :password, :avatar, :recipes)`,
      {
        id: nextId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random`,
        recipes: '{"recetas": []}'
      }
    );
    
    await connection.commit();
    console.log('✅ Usuario registrado exitosamente:', username);
    res.status(201).json({ 
      id: nextId,
      message: 'Usuario registrado exitosamente'
    });
    
  } catch (err) {
    console.error('💥 Error en registro:', err);
    if (connection) {
      await connection.rollback();
    }
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

// ✅ CREAR RECETA (actualizado)
app.post('/recipes', async (req, res) => {
    try {
        const { title, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, category, tags, authorId, image } = req.body;
        
        // Validación básica
        if (!title || !description || !ingredients || !instructions || !authorId) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: title, description, ingredients, instructions, authorId' });
        }
        
        // Verificar que el autor existe
        let connection;
        try {
            connection = await getConnection();
            const authorResult = await connection.execute(
                'SELECT idUsuario, first_name, last_name FROM usuarios WHERE idUsuario = :id',
                { id: authorId }
            );
            
            if (authorResult.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario autor no encontrado' });
            }
        } finally {
            if (connection) await connection.close();
        }
        
        const recipeData = {
            title: title.trim(),
            description: description.trim(),
            ingredients: Array.isArray(ingredients) ? ingredients : [],
            instructions: Array.isArray(instructions) ? instructions : [],
            prepTime: parseInt(prepTime) || 0,
            cookTime: parseInt(cookTime) || 0,
            servings: parseInt(servings) || 1,
            difficulty: difficulty || 'medium',
            category: category || 'general',
            tags: Array.isArray(tags) ? tags : [],
            authorId: parseInt(authorId),
            image: image || `https://picsum.photos/400/300?random=${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rating: 0,
            ratingCount: 0,
            totalRating: 0, // ✅ Agregar para cálculo de promedio
            comments: [],
            views: 0,
            likes: 0,
            isActive: true
        };
        
        console.log('📝 Creando nueva receta:', recipeData.title);
        
        const result = await recipesCol.insertOne(recipeData);
        
        // Agregar la receta al usuario en Oracle
        try {
            connection = await getConnection();
            
            // Obtener recetas actuales del usuario
            const userResult = await connection.execute(
                'SELECT recipes FROM usuarios WHERE idUsuario = :id',
                { id: authorId }
            );
            
            if (userResult.rows.length > 0) {
                const currentRecipes = JSON.parse(userResult.rows[0][0] || '{"recetas": []}');
                currentRecipes.recetas.push(result.insertedId.toString());
                
                // Actualizar usuario con nueva receta
                await connection.execute(
                    'UPDATE usuarios SET recipes = :recipes WHERE idUsuario = :id',
                    { 
                        recipes: JSON.stringify(currentRecipes),
                        id: authorId 
                    }
                );
                
                await connection.commit();
                console.log('🔗 Receta vinculada al usuario exitosamente');
            }
        } catch (err) {
            console.error('⚠️ Error vinculando receta al usuario:', err);
            // No fallar la creación de receta por este error
        } finally {
            if (connection) await connection.close();
        }
        
        res.status(201).json({
            success: true,
            message: 'Receta creada exitosamente',
            recipeId: result.insertedId,
            recipe: {
                _id: result.insertedId,
                ...recipeData
            }
        });
        
    } catch (err) {
        console.error('💥 Error creando receta:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ OBTENER RECETA ESPECÍFICA
app.get('/recipes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📖 Obteniendo receta:', id);
        
        // Validar ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de receta inválido' });
        }
        
        const recipe = await recipesCol.findOne({ _id: new ObjectId(id) });
        
        if (!recipe) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }
        
        // Incrementar contador de vistas
        await recipesCol.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { views: 1 } }
        );
        
        // Obtener info del autor desde Oracle
        let connection;
        try {
            connection = await getConnection();
            const authorResult = await connection.execute(
                'SELECT first_name, last_name, avatar FROM usuarios WHERE idUsuario = :id',
                { id: recipe.authorId }
            );
            
            if (authorResult.rows.length > 0) {
                const [firstName, lastName, avatar] = authorResult.rows[0];
                recipe.author = `${firstName} ${lastName}`;
                recipe.authorAvatar = avatar;
            } else {
                recipe.author = 'Usuario desconocido';
                recipe.authorAvatar = 'https://ui-avatars.com/api/?name=Usuario&background=random';
            }
        } catch (err) {
            console.error('Error obteniendo autor:', err);
            recipe.author = 'Usuario desconocido';
            recipe.authorAvatar = 'https://ui-avatars.com/api/?name=Usuario&background=random';
        } finally {
            if (connection) await connection.close();
        }
        
        res.json(recipe);
        
    } catch (err) {
        console.error('💥 Error obteniendo receta:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ OBTENER TODAS LAS RECETAS
app.get('/recipes', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    console.log('📖 Obteniendo recetas con filtros:', { page, limit, category, difficulty, search, sortBy, sortOrder });
    
    // Construir filtros
    const filters = { isActive: { $ne: false } };
    
    if (category && category !== 'all') {
      filters.category = category;
    }
    
    if (difficulty && difficulty !== 'all') {
      filters.difficulty = difficulty;
    }
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Construir ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Obtener recetas con paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recipes = await recipesCol
      .find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const totalRecipes = await recipesCol.countDocuments(filters);
    
    console.log(`📊 Encontradas ${recipes.length} recetas de ${totalRecipes} total`);
    
    // Para cada receta, obtener info del autor desde Oracle
    const recipesWithAuthors = await Promise.all(
      recipes.map(async (recipe) => {
        let connection;
        try {
          connection = await getConnection();
          const authorResult = await connection.execute(
            'SELECT first_name, last_name, avatar FROM usuarios WHERE idUsuario = :id',
            { id: recipe.authorId }
          );
          
          if (authorResult.rows.length > 0) {
            const [firstName, lastName, avatar] = authorResult.rows[0];
            return {
              ...recipe,
              author: `${firstName} ${lastName}`,
              authorAvatar: avatar
            };
          } else {
            return {
              ...recipe,
              author: 'Usuario desconocido',
              authorAvatar: 'https://ui-avatars.com/api/?name=Usuario&background=random'
            };
          }
        } catch (err) {
          console.error('Error obteniendo autor:', err);
          return {
            ...recipe,
            author: 'Usuario desconocido',
            authorAvatar: 'https://ui-avatars.com/api/?name=Usuario&background=random'
          };
        } finally {
          if (connection) await connection.close();
        }
      })
    );
    
    res.json({
      recipes: recipesWithAuthors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecipes / parseInt(limit)),
        totalRecipes,
        hasNext: skip + parseInt(limit) < totalRecipes,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (err) {
    console.error('💥 Error obteniendo recetas:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ OBTENER COMENTARIOS DE UNA RECETA
app.get('/recipes/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('💬 Obteniendo comentarios para receta:', id);
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de receta inválido' });
    }
    
    // Buscar la receta en MongoDB
    const recipe = await recipesCol.findOne({ _id: new ObjectId(id) });
    
    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    
    // Obtener comentarios con info de usuarios
    const comments = recipe.comments || [];
    
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        let connection;
        try {
          connection = await getConnection();
          const authorResult = await connection.execute(
            'SELECT first_name, last_name, avatar FROM usuarios WHERE idUsuario = :id',
            { id: comment.userId }
          );
          
          if (authorResult.rows.length > 0) {
            const [firstName, lastName, avatar] = authorResult.rows[0];
            return {
              ...comment,
              author: `${firstName} ${lastName}`,
              authorAvatar: avatar
            };
          } else {
            return {
              ...comment,
              author: 'Usuario desconocido',
              authorAvatar: 'https://ui-avatars.com/api/?name=Usuario&background=random'
            };
          }
        } catch (err) {
          console.error('Error obteniendo autor del comentario:', err);
          return {
            ...comment,
            author: 'Usuario desconocido',
            authorAvatar: 'https://ui-avatars.com/api/?name=Usuario&background=random'
          };
        } finally {
          if (connection) await connection.close();
        }
      })
    );
    
    res.json({
      comments: commentsWithAuthors,
      totalComments: commentsWithAuthors.length
    });
    
  } catch (err) {
    console.error('💥 Error obteniendo comentarios:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ AGREGAR COMENTARIO A UNA RECETA
app.post('/recipes/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, rating } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de receta inválido' });
    }
    
    if (!userId || !content || !rating) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: userId, content, rating' });
    }
    
    console.log('💬 Agregando comentario a receta:', id);
    
    // Verificar que el usuario existe
    let connection;
    try {
      connection = await getConnection();
      const userResult = await connection.execute(
        'SELECT idUsuario FROM usuarios WHERE idUsuario = :id',
        { id: userId }
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    } finally {
      if (connection) await connection.close();
    }
    
    const newComment = {
      id: new ObjectId().toString(),
      userId: parseInt(userId),
      content: content.trim(),
      rating: Math.max(1, Math.min(5, parseInt(rating))), // Asegurar que esté entre 1-5
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Agregar comentario a la receta
    const result = await recipesCol.updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { comments: newComment },
        $inc: { 
          ratingCount: 1,
          totalRating: parseInt(rating)
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    
    // Recalcular rating promedio
    const recipe = await recipesCol.findOne({ _id: new ObjectId(id) });
    const newAverageRating = recipe.totalRating / recipe.ratingCount;
    
    await recipesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { rating: Math.round(newAverageRating * 10) / 10 } } // Redondear a 1 decimal
    );
    
    res.status(201).json({ 
      success: true,
      message: 'Comentario agregado exitosamente',
      comment: newComment
    });
    
  } catch (err) {
    console.error('💥 Error agregando comentario:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ AGREGAR RECETA A USUARIO (para vincular recetas con usuarios)
app.post('/users/:id/recipes', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipeId } = req.body;
    
    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: 'ID de receta inválido' });
    }
    
    console.log('🔗 Vinculando receta', recipeId, 'con usuario', id);
    
    let connection;
    try {
      connection = await getConnection();
      
      // Verificar que el usuario existe
      const userExists = await connection.execute(
        'SELECT idUsuario FROM usuarios WHERE idUsuario = :id',
        { id }
      );
      
      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Verificar que la receta existe
      const recipeExists = await recipesCol.findOne({ _id: new ObjectId(recipeId) });
      if (!recipeExists) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }
      
      // Obtener recetas actuales del usuario
      const userResult = await connection.execute(
        'SELECT recipes FROM usuarios WHERE idUsuario = :id',
        { id }
      );
      
      const currentRecipes = JSON.parse(userResult.rows[0][0] || '{"recetas": []}');
      
      // Verificar si la receta ya está vinculada
      if (currentRecipes.recetas.includes(recipeId)) {
        return res.status(409).json({ error: 'La receta ya está vinculada a este usuario' });
      }
      
      currentRecipes.recetas.push(recipeId);
      
      // Actualizar usuario con nueva receta
      await connection.execute(
        'UPDATE usuarios SET recipes = :recipes WHERE idUsuario = :id',
        { 
          recipes: JSON.stringify(currentRecipes),
          id 
        }
      );
      
      await connection.commit();
      res.json({ 
        success: true,
        message: 'Receta vinculada exitosamente',
        totalRecipes: currentRecipes.recetas.length
      });
      
    } finally {
      if (connection) await connection.close();
    }
    
  } catch (err) {
    console.error('💥 Error vinculando receta:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ OBTENER RECETAS DE UN USUARIO
app.get('/users/:id/recipes', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 Obteniendo recetas del usuario:', id);
    
    let connection;
    try {
      connection = await getConnection();
      
      // Obtener usuario y sus recetas
      const userResult = await connection.execute(
        'SELECT first_name, last_name, recipes FROM usuarios WHERE idUsuario = :id',
        { id }
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const [firstName, lastName, recipesJson] = userResult.rows[0];
      const userRecipes = JSON.parse(recipesJson || '{"recetas": []}');
      
      if (userRecipes.recetas.length === 0) {
        return res.json({
          user: `${firstName} ${lastName}`,
          recipes: [],
          totalRecipes: 0
        });
      }
      
      // Obtener detalles de las recetas desde MongoDB
      const recipeIds = userRecipes.recetas
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
      
      const recipes = await recipesCol.find({
        _id: { $in: recipeIds }
      }).toArray();
      
      res.json({
        user: `${firstName} ${lastName}`,
        recipes,
        totalRecipes: recipes.length
      });
      
    } finally {
      if (connection) await connection.close();
    }
    
  } catch (err) {
    console.error('💥 Error obteniendo recetas del usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ENDPOINT PARA DEBUG - VER USUARIOS (SOLO PARA DESARROLLO)
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

// ✅ ENDPOINT DE SALUD DEL SERVIDOR
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión Oracle
    let oracleStatus = 'disconnected';
    let connection;
    try {
      connection = await getConnection();
      await connection.execute('SELECT 1 FROM DUAL');
      oracleStatus = 'connected';
    } catch (err) {
      console.error('Oracle health check failed:', err);
    } finally {
      if (connection) await connection.close();
    }
    
    // Verificar conexión MongoDB
    let mongoStatus = 'disconnected';
    try {
      await recipesCol.findOne({});
      mongoStatus = 'connected';
    } catch (err) {
      console.error('MongoDB health check failed:', err);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: {
        oracle: oracleStatus,
        mongodb: mongoStatus
      }
    });
    
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialización de las bases de datos y servidor
(async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Inicializar Oracle
    console.log('📊 Conectando a Oracle...');
    await initialize();
    console.log('✅ Oracle conectado');
    
    // Inicializar MongoDB
    console.log('🍃 Conectando a MongoDB...');
    ({ collection: recipesCol } = await connectToMongo());
    console.log('✅ MongoDB conectado');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🎉 Servidor corriendo en http://localhost:${PORT}`);
      console.log('\n📋 Endpoints disponibles:');
      console.log('👥 Usuarios:');
      console.log('  - POST /register              Registrar usuario');
      console.log('  - POST /login                 Iniciar sesión');
      console.log('  - GET  /users/:id/recipes     Obtener recetas de usuario');
      console.log('  - POST /users/:id/recipes     Vincular receta a usuario');
      console.log('\n🍳 Recetas:');
      console.log('  - POST /recipes               Crear nueva receta');
      console.log('  - GET  /recipes               Obtener todas las recetas');
      console.log('  - GET  /recipes/:id           Obtener receta específica');
      console.log('  - GET  /recipes/:id/comments  Obtener comentarios de receta');
      console.log('  - POST /recipes/:id/comments  Agregar comentario a receta');
      console.log('\n🔧 Utilidades:');
      console.log('  - GET  /health                Estado del servidor');
      console.log('  - GET  /debug/users           Ver usuarios (solo desarrollo)');
      console.log('\n✅ Servidor listo para recibir peticiones');
    });
  } catch (error) {
    console.error('💥 Error al inicializar el servidor:', error);
    process.exit(1);
  }
})();

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');

async function migrate() {
    // Configurar SQLite
    const sqliteDb = new sqlite3.Database('js/users.db');
    
    // Crear tabla (si no existe)
    await new Promise(resolve => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (...)`, resolve);
    });

    // Migrar usuarios
    const users = JSON.parse(fs.readFileSync('data/users.json'));
    for (const user of users) {
        await new Promise(resolve => {
            sqliteDb.run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [user.username, user.email, user.password],
                resolve
            );
        });
    }

    // Configurar MongoDB
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('recetario');
    const collection = db.collection('recetas');

    // Migrar recetas
    const recipes = JSON.parse(fs.readFileSync('data/recipes.json'));
    await collection.insertMany(recipes);

    console.log('Migración completada!');
    client.close();
    sqliteDb.close();
}

migrate();
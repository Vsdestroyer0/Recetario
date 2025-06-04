const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');

async function checkData() {
    try {
        // Verificar SQLite
        const sqliteDb = new sqlite3.Database('js/users.db');
        const userCount = await new Promise((resolve, reject) => {
            sqliteDb.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        console.log(`Usuarios en SQLite: ${userCount}`);
        
        // Verificar MongoDB
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        const recipeCount = await client.db('recetario')
                                    .collection('recetas')
                                    .countDocuments();
        console.log(`Recetas en MongoDB: ${recipeCount}`);
        
        client.close();
        sqliteDb.close();
    } catch (err) {
        console.error('Error verificando datos:', err);
        process.exit(1);
    }
}

checkData();
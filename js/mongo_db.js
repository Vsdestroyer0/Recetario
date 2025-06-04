const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recetario?directConnection=true';

async function connectToMongo() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB via Compass');
        const db = client.db('recetario');
        
        // Verificar si la colección existe, si no, crearla
        await db.command({ collStats: 'recetas' }).catch(async () => {
            await db.createCollection('recetas');
            console.log('Collection "recetas" created');
        });
        
        return { 
            collection: db.collection('recetas'),
            db,
            client
        };
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

module.exports = { connectToMongo };
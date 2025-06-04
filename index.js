require('./js/server');
const oracledb = require('./js/oracle_db');
const { connectToMongo } = require('./js/mongo_db'); // Agrega esta línea

oracledb.initOracle = async () => {
  await oracledb.initialize();
  return oracledb;
};

(async () => {
    try {
        const { db } = await connectToMongo();
        console.log('MongoDB ready. Collections:', await db.listCollections().toArray());
    } catch (err) {
        console.error('MongoDB initialization failed:', err);
    }
})();

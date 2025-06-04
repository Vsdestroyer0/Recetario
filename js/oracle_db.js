const oracledb = require('oracledb');

// Config para SYSDBA
const sysConfig = {
  user: 'sys',
  password: 'slayer185',
  connectString: 'localhost:1521/XEPDB1',
  privilege: oracledb.SYSDBA
};

// Config para la app (demouser)
const appConfig = { user: 'demouser', password: 'demouser', connectString: sysConfig.connectString };

async function initialize() {
  try {
    // First connect as SYS to verify connection
    const sysConn = await oracledb.getConnection(sysConfig);
    console.log('Connected to Oracle as SYS');
    
    // Verify demouser exists and has privileges
    const result = await sysConn.execute(
      `SELECT username FROM all_users WHERE username = 'DEMOUSER'`
    );
    
    if (result.rows.length === 0) {
      console.log('DEMOUSER does not exist, creating...');
      await sysConn.execute(
        `CREATE USER demouser IDENTIFIED BY demouser`
      );
      await sysConn.execute(
        `GRANT CONNECT, RESOURCE, CREATE SESSION, CREATE TABLE TO demouser`
      );
      console.log('DEMOUSER created with basic privileges');
    }
    
    await sysConn.close();
    
    // Now create pool with application credentials
    await oracledb.createPool(appConfig);
    console.log('Application pool created with DEMOUSER');
    await createUsersTable();
  } catch (err) {
    console.error('Error initializing Oracle:', err);
  }
}

async function createUsersTable() {
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(`
      CREATE TABLE users (
        id NUMBER GENERATED ALWAYS AS IDENTITY,
        first_name VARCHAR2(50),
        last_name VARCHAR2(50),
        username VARCHAR2(50) UNIQUE NOT NULL,
        email VARCHAR2(100) UNIQUE NOT NULL,
        password VARCHAR2(100) NOT NULL,
        avatar VARCHAR2(255),
        recipes CLOB CHECK (recipes IS JSON),
        favorites CLOB CHECK (favorites IS JSON),
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists');
  } catch (err) {
    if (err.errorNum !== 955) { // ORA-00955: name is already used by an existing object
      console.error('Error creating users table:', err);
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

async function getConnection() { return oracledb.getConnection(); }

module.exports = { initialize, getConnection };
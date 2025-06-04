const oracledb = require('oracledb');

// Config para SYSDBA
const sysConfig = {
  user: 'sys',
  password: 'slayer185',
  connectString: 'localhost:1521/XEPDB1',
  privilege: oracledb.SYSDBA
};

// Config para la app (demouser)
const appConfig = { 
  user: 'demouser', 
  password: 'demouser', 
  connectString: sysConfig.connectString 
};

async function initialize() {
  try {
    // Conectar como SYS para verificar usuario
    const sysConn = await oracledb.getConnection(sysConfig);
    console.log('Connected to Oracle as SYS');
    
    // Verificar que demouser existe
    const result = await sysConn.execute(
      `SELECT username FROM all_users WHERE username = 'DEMOUSER'`
    );
    
    if (result.rows.length === 0) {
      console.log('DEMOUSER does not exist, creating...');
      await sysConn.execute(`CREATE USER demouser IDENTIFIED BY demouser`);
      await sysConn.execute(`GRANT CONNECT, RESOURCE, CREATE SESSION, CREATE TABLE, CREATE TYPE, CREATE SEQUENCE TO demouser`);
      console.log('DEMOUSER created with object privileges');
    }
    
    await sysConn.close();
    
    // Crear pool con credenciales de aplicación
    await oracledb.createPool(appConfig);
    console.log('Application pool created with DEMOUSER');
    
    await createObjectTables(); // ✅ Cambiar nombre de función
    
  } catch (err) {
    console.error('Error initializing Oracle:', err);
  }
}

async function createObjectTables() { // ✅ Nueva función para objetos
  let connection;
  try {
    connection = await oracledb.getConnection();
    
    // 1. Crear el tipo Usuario_Typ
    try {
      await connection.execute(`
        CREATE OR REPLACE TYPE Usuario_Typ AS OBJECT (
          idUsuario NUMBER,
          first_name VARCHAR2(100),
          last_name VARCHAR2(100),
          username VARCHAR2(50),
          email VARCHAR2(150),
          password VARCHAR2(255),
          avatar VARCHAR2(500),
          recipes CLOB
        )
      `);
      console.log('Tipo Usuario_Typ creado');
    } catch (err) {
      console.log('Tipo Usuario_Typ ya existe o error:', err.message);
    }
    
    // 2. Crear secuencia
    try {
      await connection.execute(`
        CREATE SEQUENCE usuarios_seq 
        START WITH 1 
        INCREMENT BY 1 
        NOCACHE
      `);
      console.log('Secuencia usuarios_seq creada');
    } catch (err) {
      if (err.errorNum !== 955) console.log('Secuencia ya existe');
    }
    
    // 3. Crear tabla de objetos
    try {
      await connection.execute(`
        CREATE TABLE usuarios OF Usuario_Typ (
          idUsuario PRIMARY KEY,
          username UNIQUE NOT NULL,
          email UNIQUE NOT NULL,
          first_name NOT NULL,
          last_name NOT NULL,
          password NOT NULL
        )
      `);
      console.log('Tabla de objetos usuarios creada');
    } catch (err) {
      if (err.errorNum !== 955) {
        console.error('Error creando tabla usuarios:', err);
      } else {
        console.log('Tabla usuarios ya existe');
      }
    }
    
    await connection.commit();
    
  } catch (err) {
    console.error('Error en createObjectTables:', err);
  } finally {
    if (connection) await connection.close();
  }
}

async function getConnection() { 
  return oracledb.getConnection(); 
}

module.exports = { initialize, getConnection };

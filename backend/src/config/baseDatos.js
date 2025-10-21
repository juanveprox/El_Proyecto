const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.BD_HOST,
    user: process.env.BD_USER,
    password: process.env.BD_PASSWORD,
    database: process.env.BD_NAME,
    port: process.env.BD_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



const probarConexion = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a MySQL');
        connection.release();
        return true
    } catch (error) {
        onsole.error('Error conectando a MySQL:', error.message);
        return false;
    }
}



module.exports = { pool, probarConexion }
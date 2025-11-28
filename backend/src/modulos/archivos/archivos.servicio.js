const { pool } = require("../../config/baseDatos")

class archivosServicio {
    async subirArchivo(archivo) {
        let conexion;
        try {
            conexion = await pool.getConnection();
        } catch (error) {

        }
    }
}

module.exports = archivosServicio;
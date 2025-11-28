class archivosModel {
    async subirArchivo(archivo, conexion) {
        const [resultado] = await conexion.query(
            `INSERT INTO archivos_subidos 
             (nombre_original, nombre_guardado, path, size, mime_type, description) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                archivo.nombre_original,
                archivo.nombre_guardado,
                archivo.path,
                archivo.size,
                archivo.mime_type,
                archivo.description
            ]
        );
        return resultado;
    }

    async obtenerArchivoPorId(id, conexion) {
        const [rows] = await conexion.query(
            'SELECT * FROM archivos_subidos WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}


module.exports = new archivosModel();
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

    // async obtenerArchivoPorId(id, conexion) {
    //     const [rows] = await conexion.query(
    //         'SELECT * FROM archivos_subidos WHERE id = ?',
    //         [id]
    //     );
    //     return rows.length > 0 ? rows[0] : null;
    // }

    async obtenerArchivoPorId(id, conexion) {
        const [rows] = await conexion.query(
            `SELECT 
                id, 
                nombre_original, 
                nombre_guardado,
                path,
                size, 
                mime_type, 
                description,
                created_at,
                CONCAT('/uploads/', nombre_guardado) as download_url
            FROM archivos_subidos 
            WHERE id = ?`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }


    async obtenerTodoPagina(limit, offset, conexion) {
        const [archivos] = await conexion.query(
            `SELECT 
                id, 
                nombre_original, 
                nombre_guardado, 
                size, 
                mime_type, 
                description,
                created_at,
                CONCAT('/uploads/', nombre_guardado) as download_url
            FROM archivos_subidos 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return archivos;
    }

    async contarTodos(conexion) {
        const [[total]] = await conexion.query(
            'SELECT COUNT(*) as total FROM archivos_subidos'
        );
        return total.total;
    }

    async eliminarArchivoPorId(id, conexion) {
        const [resultado] = await conexion.query(
            'DELETE FROM archivos_subidos WHERE id = ?',
            [id]
        );
        return resultado;
    }

}


module.exports = new archivosModel();
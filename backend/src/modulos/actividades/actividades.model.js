class actividadesModel {
    async crearActividad(titulo, descripcion, conexion) {
        const [resultado] = await conexion.execute(
            `INSERT INTO actividades (titulo, descripcion) VALUES (?, ?)`,
            [titulo, descripcion]
        );
        return resultado.insertId;
    }

    async crearImagenActividad(actividadId, imagenUrl, conexion) {
        await conexion.execute(
            `INSERT INTO actividad_imagenes (actividad_id, imagen_url) VALUES (?, ?)`,
            [actividadId, imagenUrl]
        );
        return imagenUrl;
    }

    async obtenerTodasActividades(conexion) {
        const [actividades] = await conexion.query(
            `SELECT id, titulo, descripcion, 
             DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion
             FROM actividades ORDER BY fecha_creacion DESC`
        );
        return actividades;
    }

    async obtenerImagenesPorActividad(actividadId, conexion) {
        const [imagenes] = await conexion.query(
            `SELECT id, imagen_url 
             FROM actividad_imagenes 
             WHERE actividad_id = ?`,
            [actividadId]
        );
        return imagenes;
    }

    async obtenerImagenesPorActividadId(actividadId, conexion) {
        const [imagenes] = await conexion.query(
            'SELECT imagen_url FROM actividad_imagenes WHERE actividad_id = ?',
            [actividadId]
        );
        return imagenes;
    }

    async eliminarImagenesActividad(actividadId, conexion) {
        await conexion.query(
            'DELETE FROM actividad_imagenes WHERE actividad_id = ?',
            [actividadId]
        );
    }

    async eliminarActividad(actividadId, conexion) {
        const [result] = await conexion.query(
            'DELETE FROM actividades WHERE id = ?',
            [actividadId]
        );
        return result.affectedRows;
    }

}

module.exports = new actividadesModel();
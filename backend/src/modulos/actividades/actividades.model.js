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

    async eliminarImagenesActividadPorId(actividadId, conexion) {
        await conexion.query(
            'DELETE FROM actividad_imagenes WHERE actividad_id = ?',
            [actividadId]
        );
    }

    async eliminarImagenesActividad(imagenesIds, conexion) {
        if (!imagenesIds || imagenesIds.length === 0) return;

        const placeholders = imagenesIds.map(() => '?').join(',');
        await conexion.query(
            `DELETE FROM actividad_imagenes WHERE id IN (${placeholders})`,
            imagenesIds
        );
    }

    async eliminarActividad(actividadId, conexion) {
        const [result] = await conexion.query(
            'DELETE FROM actividades WHERE id = ?',
            [actividadId]
        );
        return result.affectedRows;
    }

    async obtenerActividadPorId(actividadId, conexion) {
        const [actividades] = await conexion.query(
            `SELECT id, titulo, descripcion, 
             DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion
             FROM actividades WHERE id = ?`,
            [actividadId]
        );
        return actividades[0] || null;
    }

    async actualizarActividad(actividadId, titulo, descripcion, conexion) {
        const [result] = await conexion.execute(
            `UPDATE actividades SET titulo = ?, descripcion = ?, fecha_actualizacion = NOW() 
             WHERE id = ?`,
            [titulo, descripcion, actividadId]
        );
        return result.affectedRows;
    }

    async obtenerImagenesPorActividadId(actividadId, conexion) {
        const [imagenes] = await conexion.query(
            'SELECT id, imagen_url FROM actividad_imagenes WHERE actividad_id = ?',
            [actividadId]
        );
        return imagenes;
    }

}

module.exports = new actividadesModel();
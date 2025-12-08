const { pool } = require("../../config/baseDatos");

class seccionesModel {
    // GRADOS
    async crearGrado(data) {
        const query = 'INSERT INTO grados SET ?';
        const [resultado] = await pool.query(query, data);
        return resultado.insertId;
    }

    async obtenerGrados() {
        const query = `
            SELECT g.*, 
                   COUNT(DISTINCT s.id) as total_secciones,
                   COUNT(DISTINCT ps.profesor_id) as total_profesores,
                   COUNT(DISTINCT es.estudiante_id) as total_estudiantes
            FROM grados g
            LEFT JOIN secciones s ON g.id = s.grado_id
            LEFT JOIN profesor_seccion ps ON s.id = ps.seccion_id
            LEFT JOIN estudiante_seccion es ON s.id = es.seccion_id AND es.estado = 'activo'
            GROUP BY g.id
            ORDER BY g.nivel, g.nombre`;
        const [rows] = await pool.query(query);
        return rows;
    }

    async obtenerGradoPorId(id) {
        const query = 'SELECT * FROM grados WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    async actualizarGrado(id, data) {
        const query = 'UPDATE grados SET ? WHERE id = ?';
        const [result] = await pool.query(query, [data, id]);
        return result.affectedRows;
    }

    async eliminarGrado(id) {
        const query = 'DELETE FROM grados WHERE id = ?';
        const [resultado] = await pool.query(query, [id]);
        return resultado.affectedRows;
    }

    //*Secciones

    async crearSeccion(data) {
        const query = 'INSERT INTO secciones SET ?';
        const [resultado] = await pool.query(query, data);
        return resultado.insertId;
    }

    async obtenerSeccionesPorGrado(gradoId) {
        const query = `
            SELECT s.*, 
                   g.nombre as grado_nombre,
                   COUNT(DISTINCT ps.profesor_id) as total_profesores,
                   COUNT(DISTINCT es.estudiante_id) as total_estudiantes
            FROM secciones s
            JOIN grados g ON s.grado_id = g.id
            LEFT JOIN profesor_seccion ps ON s.id = ps.seccion_id
            LEFT JOIN estudiante_seccion es ON s.id = es.seccion_id AND es.estado = 'activo'
            WHERE s.grado_id = ?
            GROUP BY s.id
            ORDER BY s.nombre`;
        const [rows] = await pool.query(query, [gradoId]);
        return rows;
    }

    async obtenerSeccionPorId(id) {
        const query = 'SELECT * FROM secciones WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    async actualizarSeccion(id, data) {
        const query = 'UPDATE secciones SET ? WHERE id = ?';
        const [resultado] = await pool.query(query, [data, id]);
        return resultado.affectedRows;
    }

    async eliminarSeccion(id) {
        const query = 'DELETE FROM secciones WHERE id = ?';
        const [resultado] = await pool.query(query, [id]);
        return resultado.affectedRows;
    }

    //*Asignar profesor

    async asignarProfesorASeccion(data) {
        const query = 'INSERT INTO profesor_seccion SET ?';
        const [resultado] = await pool.query(query, data);
        return resultado.insertId;
    }

    async obtenerProfesoresPorSeccion(seccionId) {
        const query = `
                SELECT ps.*,
                p.id as profesor_id,
                p.primer_nombre as nombre,
                p.primer_apellido as apellido,
                p.correo as email,
                p.telefono
    FROM profesor_seccion ps
    JOIN personal p ON ps.profesor_id = p.id
    WHERE ps.seccion_id = ?
                AND p.tipo = 'docente'
    ORDER BY ps.es_tutor DESC, p.primer_apellido`
            ;
        const [rows] = await pool.query(query, [seccionId]);
        return rows;
    }

    async verificarProfesorEnSeccion(profesorId, seccionId) {
        const query = 'SELECT id FROM profesor_seccion WHERE profesor_id = ? AND seccion_id = ?';
        const [rows] = await pool.query(query, [profesorId, seccionId]);
        return rows.length > 0;
    }

    async eliminarProfesorDeSeccion(asignacionId) {
        const query = 'DELETE FROM profesor_seccion WHERE id = ?';
        const [resultado] = await pool.query(query, [asignacionId]);
        return resultado.affectedRows;
    }


    //* Verificar
    async verificarGradoExiste(id) {
        const query = 'SELECT id FROM grados WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows.length > 0;
    }

    async verificarSeccionExiste(id) {
        const query = 'SELECT id FROM secciones WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows.length > 0;
    }

    async verificarDocenteExiste(id, tipo) {
        const query = 'SELECT id FROM personal WHERE id = ? AND tipo = ?';
        const [rows] = await pool.query(query, [id, tipo]);
        return rows.length > 0;
    }

    async verificarEstudianteExite(id) {
        const query = 'SELECT id FROM estudiantes WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows.length > 0;
    }

    async verificarCapacidadSeccion(seccionId) {
        const query = `
            SELECT s.capacidad_maxima, 
                   COUNT(es.id) as estudiantes_actuales
            FROM secciones s
            LEFT JOIN estudiante_seccion es ON s.id = es.seccion_id AND es.estado = 'activo'
            WHERE s.id = ?
            GROUP BY s.id`;
        const [rows] = await pool.query(query, [seccionId]);
        return rows[0] || null;
    }


    //*Asignar Estudiante
    async asignarEstudianteASeccion(data) {
        const query = 'INSERT INTO estudiante_seccion SET ?';
        const [resultado] = await pool.query(query, data);
        return resultado.insertId;
    }

    async obtenerEstudiantesPorSeccion(seccionId) {
        const query = `
                    SELECT es.*, 
            e.id as estudiante_id,
            e.nombres as nombre, 
            e.apellidos as apellido,
            e.cedula_escolar,
            e.fecha_nacimiento
        FROM estudiante_seccion es
        JOIN estudiantes e ON es.estudiante_id = e.id
        WHERE es.seccion_id = ? AND es.estado = 'activo'
        ORDER BY e.apellidos, e.nombres`;
        const [rows] = await pool.query(query, [seccionId]);
        return rows;
    }

    async verificarEstudianteEnSeccion(estudianteId, seccionId, añoEscolar) {
        const query = 'SELECT id FROM estudiante_seccion WHERE estudiante_id = ? AND seccion_id = ? AND año_escolar = ?';
        const [rows] = await pool.query(query, [estudianteId, seccionId, añoEscolar]);
        return rows.length > 0;
    }

    async actualizarEstadoEstudiante(asignacionId, estado) {
        const query = 'UPDATE estudiante_seccion SET estado = ? WHERE id = ?';
        const [resultado] = await pool.query(query, [estado, asignacionId]);
        return resultado.affectedRows;
    }

    async eliminarEstudianteDeSeccion(asignacionId) {
        const query = 'DELETE FROM estudiante_seccion WHERE id = ?';
        const [resultado] = await pool.query(query, [asignacionId]);
        return resultado.affectedRows;
    }

}

module.exports = new seccionesModel();
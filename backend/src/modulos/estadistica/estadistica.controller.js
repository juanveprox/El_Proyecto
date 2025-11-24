const { pool, probarConexion } = require('../../config/baseDatos');

class estadisticaController {

    async obtenerResumenEstadisticas(req, res) {
        try {
            const [
                [estudiantes],
                [docentes],
                [administrativos],
                [obreros],
                [secciones]
            ] = await Promise.all([
                pool.execute('SELECT COUNT(*) as count FROM estudiantes'),
                pool.execute('SELECT COUNT(*) as count FROM personal WHERE tipo = "docente"'),
                pool.execute('SELECT COUNT(*) as count FROM personal WHERE tipo = "administrativo"'),
                pool.execute('SELECT COUNT(*) as count FROM personal WHERE tipo = "obrero"'),
                pool.execute('SELECT COUNT(*) as count FROM grados')
            ]);

            res.json({
                success: true,
                data: {
                    estudiantes: estudiantes[0].count,
                    docentes: docentes[0].count,
                    administrativos: administrativos[0].count,
                    obreros: obreros[0].count,
                    secciones: secciones[0].count
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las estadísticas' });
        }
    }

}

module.exports = new estadisticaController();
const actividadesServicio = require('./actividades.servicio');

class actividadesController {
    async crearActividad(req, res) {
        const { titulo, descripcion } = req.body;
        const imagenes = req.files;
        try {

            const actividadCreada = await actividadesServicio.crearActividad(titulo, descripcion, imagenes);

            res.status(201).json({
                success: true,
                message: "Actividad creada exitosamente",
                datos: actividadCreada
            })

        } catch (error) {

            const statusCode = error.message.includes('requeridos') ||
                error.message.includes('al menos una imagen') ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                mensaje: "Error al crear la actividad",
                error: error.message
            });
        }
    }
    async obtenerTodasActividades(req, res) {
        try {
            const actividades = await actividadesServicio.obtenerTodasActividades();

            res.status(200).json({
                success: true,
                message: "Actividades obtenidas exitosamente",
                data: actividades
            });

        } catch (error) {
            console.error('Error al obtener actividades:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las actividades',
                error: error.message
            });
        }
    }

    async eliminarActividad(req, res) {
        const { id } = req.params;

        try {
            // Validar que el ID es un número válido
            const actividadId = parseInt(id);
            if (isNaN(actividadId) || actividadId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de actividad inválido'
                });
            }

            const resultado = await actividadesServicio.eliminarActividad(actividadId);

            res.status(200).json({
                success: true,
                message: 'Actividad eliminada correctamente',
                data: resultado
            });

        } catch (error) {
            let statusCode = 500;
            let message = 'Error al eliminar la actividad';

            if (error.message === 'Actividad no encontrada') {
                statusCode = 404;
                message = error.message;
            } else if (error.message.includes('inválido')) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    };

}

module.exports = new actividadesController();
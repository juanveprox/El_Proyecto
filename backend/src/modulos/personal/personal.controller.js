const personalServicio = require("./personal.servicio")

class personalController {

    async registrarPersonal(req, res) {

        const archivos = req.files || [];
        const datos = req.body;
        try {
            if (!datos.tipo || !datos.cedula) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos incompletos: tipo y cédula son requeridos'
                });
            }

            const resultado = await personalServicio.registrarPersonal(datos, archivos)

            res.status(201).json({
                success: true,
                message: `${resultado.tipo} registrado correctamente`,
                data: {
                    id: resultado.id,
                    archivosProcesados: resultado.archivosProcesados
                }
            });
        } catch (error) {
            // Eliminar archivos subidos en caso de error
            personalServicio.eliminarArchivosTemporales(archivos);

            const mensajeError = personalController.obtenerMensajeError(error.message);

            res.status(personalController.obtenerCodigoError(error.message)).json({
                success: false,
                message: mensajeError,
                error: error.message
            });
        }
    }

    async obtenerPersonalPorTipo(req, res) {

        try {
            const { tipo } = req.query;
            const resultado = await personalServicio.obtenerPersonalPorTipo(tipo);

            res.status(200).json({
                success: true,
                data: resultado.personal == 0 ? " No hay personal registrado" : resultado.personal,
                meta: {
                    total: resultado.total,
                    filtro: resultado.filtro
                }
            });
        } catch (error) {
            const mensajeError = personalController.obtenerMensajeError(error.message);
            const codigoError = personalController.obtenerCodigoError(error.message);
            res.status(codigoError).json({
                success: false,
                message: mensajeError
            });
        }
    }

    async obtenerPersonalPorId(req, res) {
        const { id } = req.params;
        try {

            const resultado = await personalServicio.obtenerPersonalPorId(id);

            res.status(200).json({
                success: true,
                data: resultado
            });
        } catch (error) {
            const mensajeError = personalController.obtenerMensajeError(error.message);
            const codigoError = personalController.obtenerCodigoError(error.message);
            res.status(codigoError).json({
                success: false,
                message: mensajeError
            });
        }
    }

    async actualizarPersonal(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;
            const archivos = req.files || [];

            const resultado = await personalServicio.actualizarPersonal(id, datos, archivos);

            res.json({
                success: true,
                message: 'Personal actualizado correctamente',
                data: {
                    id: resultado.id,
                    archivosProcesados: resultado.archivosProcesados
                }
            });

        } catch (error) {
            const mensajeError = personalController.obtenerMensajeError(error.message);
            const codigoError = personalController.obtenerCodigoError(error.message);
            res.status(codigoError).json({
                success: false,
                message: mensajeError
            });
        }
    }

    async eliminarPersonal(req, res) {
        try {
            const { id } = req.params;

            const resultado = await personalServicio.eliminarPersonal(id);

            res.json({
                success: true,
                message: 'Personal eliminado correctamente',
                data: {
                    id: resultado.id,
                    archivosEliminados: resultado.archivosEliminados
                }
            });
        } catch (error) {
            const mensajeError = personalController.obtenerMensajeError(error.message);
            const codigoError = personalController.obtenerCodigoError(error.message);
            res.status(codigoError).json({
                success: false,
                message: mensajeError
            });
        }
    }
    async eliminarArchivo(req, res) {
        try {
            const { id, archivoId } = req.params;

            const resultado = await personalServicio.eliminarArchivo(id, archivoId);
            res.status(200).json({
                success: true,
                message: 'Archivo eliminado correctamente',
                data: resultado
            });
        } catch (error) {
            const mensajeError = personalController.obtenerMensajeError(error.message);
            const codigoError = personalController.obtenerCodigoError(error.message);
            res.status(codigoError).json({
                success: false,
                message: mensajeError
            });
        }
    }

    static obtenerMensajeError(mensaje) {
        const mensajesError = {
            'Tipo de personal no válido': 'Tipo de personal no válido',
            'La cédula ya está registrada': 'La cédula ya está registrada',
            'La cédula ya está registrada por otro personal': 'La cédula ya está registrada por otro personal',
            'Error al obtener el personal': 'Error al obtener el personal',
            'Error al registrar el personal': 'Error al registrar el personal',
            'Error al actualizar el personal': 'Error al actualizar el personal',
            'Error al eliminar el personal': 'Error al eliminar el personal',
            'Personal no encontrado': 'Personal no encontrado',
            'ID de personal no válido': 'ID de personal no válido'
        };


        return mensajesError[mensaje] || 'Error al procesar la solicitud';
    }

    static obtenerCodigoError(mensaje) {
        const codigosError = {
            'Tipo de personal no válido': 400,
            'La cédula ya está registrada': 400,
            'La cédula ya está registrada por otro personal': 400,
            'Error al obtener el personal': 500,
            'Error al registrar el personal': 500,
            'Error al actualizar el personal': 500,
            'Error al eliminar el personal': 500,
            'Personal no encontrado': 404,
            'ID de personal no válido': 400
        };

        return codigosError[mensaje] || 500;
    }
}

module.exports = new personalController();
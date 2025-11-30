const archivosServicio = require("./archivos.servicio")

class archivosController {

    async subirArchivo(req, res) {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se seleccionó ningún archivo válido'
            });
        }

        const descripcion = req.body.descripcion || '';

        try {
            const archivoSubido = await archivosServicio.subirArchivo(req.file, descripcion)

            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Archivo subido correctamente',
                file: archivoSubido
            });

        } catch (error) {
            console.error('Error al subir archivo:', error);

            let statusCode = 500;
            let message = 'Error al guardar la información del archivo en la base de datos';

            if (error.message.includes('No se seleccionó') || error.message.includes('descripción')) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    }

    async obtenerTodosArchivos(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const resultado = await archivosServicio.obtenerTodosArchivos(page, limit);

            res.status(200).json({
                success: true,
                data: resultado.data,
                paginacion: resultado.paginacion
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: 'Error al obtener los archivos',
                error: error.message
            });
        }
    }

    async obtenerArchivoPorId(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new Error("id invalida")
            }

            const archivo = await archivosServicio.obtenerArchivoPorId(id);

            res.status(200).json({
                success: true,
                data: archivo
            });

        } catch (error) {

            const statusCode = error.message === 'Archivo no encontrado' ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    //* Se tiene que pasar el parametro por (Query Params)
    async buscarArchivo(req, res) {
        try {
            const { q: searchTerm } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }

            const resultado = await archivosServicio.buscarArchivo(searchTerm, page, limit);

            res.json({
                success: true,
                data: resultado.data,
                pagination: resultado.paginacion
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al buscar archivos',
                error: error.message
            });
        }
    }

    async eliminarArchivo(req, res) {
        try {
            const { id } = req.params

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de archivo inválido'
                });
            }

            const resultado = await archivosServicio.eliminarArchivo(id)

            res.status(200).json({
                success: true,
                message: resultado.message,
                data: {
                    id: resultado.id,
                    nombreArchivo: resultado.nombreArchivo
                }
            });

        } catch (error) {
            let statusCode = 500;
            let message = 'Error al eliminar el archivo';

            if (error.message === 'Archivo no encontrado') {
                statusCode = 404;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    }

}




module.exports = new archivosController();
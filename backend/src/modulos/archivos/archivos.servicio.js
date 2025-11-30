const fs = require("fs");
const { pool } = require("../../config/baseDatos")
const archivoModel = require("./archivos.model")

class archivosServicio {
    async subirArchivo(archivo, descripcion) {
        let conexion;
        try {
            conexion = await pool.getConnection();

            const resultado = await archivoModel.subirArchivo({
                nombre_original: archivo.originalname,
                nombre_guardado: archivo.filename,
                path: archivo.path,
                size: archivo.size,
                mime_type: archivo.mimetype,
                description: descripcion ? descripcion.trim() : null
            }, conexion);

            const archivoSubido = await archivoModel.obtenerArchivoPorId(resultado.insertId, conexion)

            if (!archivoSubido) {
                throw new Error('No se pudo recuperar el archivo subido');
            }

            return {
                id: archivoSubido.id,
                nombre: archivoSubido.nombre_original,
                nombreAlmacenado: archivoSubido.nombre_guardado,
                size: archivoSubido.size,
                type: archivoSubido.mime_type,
                descripcion: archivoSubido.description,
                fechaCreacion: archivoSubido.created_at,
                urlDescarga: `/carpeta-archivo/${archivoSubido.nombre_guardado}`
            }

        } catch (error) {
            if (archivo) {
                fs.unlink(archivo.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error eliminando archivo:', unlinkErr);
                });
            }
            throw error;
        }
    }

    async obtenerTodosArchivos(page = 1, limit = 10) {
        let conexion
        conexion = await pool.getConnection();
        // Validar parámetros de paginación
        const validPage = Math.max(1, parseInt(page));
        const validLimit = Math.max(1, Math.min(parseInt(limit), 100)); // Máximo 100 por página
        const offset = (validPage - 1) * validLimit;

        // Obtener archivos y total
        const [archivo, total] = await Promise.all([
            archivoModel.obtenerTodoPagina(validLimit, offset, conexion),
            archivoModel.contarTodos(conexion)
        ]);

        return {
            data: archivo,
            paginacion: {
                total: total,
                pagina: validPage,
                limite: validLimit,
                totalPagina: Math.ceil(total / validLimit),
                hasNext: validPage < Math.ceil(total / validLimit),
                hasPrev: validPage > 1
            }
        };
    }

    async obtenerArchivoPorId(id) {
        let conexion;
        conexion = await pool.getConnection();

        const archivo = await archivoModel.obtenerArchivoPorId(id, conexion)
        if (!archivo) {
            throw new Error("Archivo no encontrado")
        }

        return archivo
    }

    async buscarArchivo(searchTerm, page = 1, limit = 10) {
        let conexion;
        conexion = await pool.getConnection()

        // Método adicional para búsqueda (opcional)
        const validPage = Math.max(1, parseInt(page));
        const validLimit = Math.max(1, Math.min(parseInt(limit), 100));
        const offset = (validPage - 1) * validLimit;

        // Implementar búsqueda según tus necesidades
        // Esto es un ejemplo
        const [files] = await conexion.query(
            `SELECT * FROM archivos_subidos 
             WHERE nombre_original LIKE ? OR description LIKE ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [`%${searchTerm}%`, `%${searchTerm}%`, validLimit, offset]
        );

        const [[total]] = await conexion.query(
            'SELECT COUNT(*) as total FROM archivos_subidos WHERE nombre_original LIKE ? OR description LIKE ?',
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
            data: files,
            paginacion: {
                total: total.total,
                pagina: validPage,
                limite: validLimit,
                paginasTotales: Math.ceil(total.total / validLimit)
            }
        };
    }

    async eliminarArchivo(id) {
        let conexion
        try {
            conexion = await pool.getConnection();
            // Obtener información del archivo
            const archivo = await archivoModel.obtenerArchivoPorId(id, conexion);

            if (!archivo) {
                throw new Error('Archivo no encontrado');
            }

            // Eliminar de la base de datos
            const archivoEliminado = await archivoModel.eliminarArchivoPorId(id, conexion);

            if (!archivoEliminado) {
                throw new Error('No se pudo eliminar el archivo de la base de datos');
            }

            await fs.promises.unlink(archivo.path);

            await conexion.commit()

            return {
                id: parseInt(id),
                nombreArchivo: archivo.nombre_original,
                message: 'Archivo eliminado correctamente'
            };

        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            if (conexion) conexion.release();
        }
    }
}


module.exports = new archivosServicio();
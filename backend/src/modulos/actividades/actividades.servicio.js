const actividadesModel = require("./actividades.model")
const fs = require('fs');
const path = require('path');
const { pool } = require("../../config/baseDatos")

class actividadesServicio {
    async crearActividad(titulo, descripcion, imagenes) {
        let conexion;
        try {
            conexion = await pool.getConnection();
            await conexion.beginTransaction();


            actividadesServicio.validarDatosActividad(titulo, descripcion, imagenes);

            const actividadId = await actividadesModel.crearActividad(titulo, descripcion, conexion)

            const imagenesGuardadas = await actividadesServicio.procesarImagenes(actividadId, imagenes, conexion);
            await conexion.commit();

            return {
                id: actividadId,
                titulo,
                descripcion,
                imagenes: imagenesGuardadas
            };
        } catch (error) {
            if (conexion) await conexion.rollback();
            actividadesServicio.eliminarArchivosSubidos(imagenes);
            throw error;

        } finally {
            if (conexion) conexion.release();
        }
    }

    async obtenerTodasActividades() {
        let conexion;
        try {
            conexion = await pool.getConnection();;

            // Obtener actividades
            const actividades = await actividadesModel.obtenerTodasActividades(conexion);

            if (!actividades || actividades.length === 0) {
                throw new Error('No se encontraron actividades');
            }

            // Obtener imágenes para cada actividad
            const actividadesConImagenes = await actividadesServicio.obtenerImagenesParaActividades(actividades, conexion);

            return actividadesConImagenes;

        } catch (error) {
            throw new Error('Error al obtener las actividades');
        } finally {
            if (conexion) conexion.release();
        }
    }

    async eliminarActividad(actividadId) {
        let conexion;
        try {
            conexion = await pool.getConnection()
            await conexion.beginTransaction();

            // Validar que la actividad existe
            await actividadesServicio.validarActividadExiste(actividadId, conexion);

            // 1. Obtener las imágenes asociadas
            const imagenes = await actividadesModel.obtenerImagenesPorActividadId(actividadId, conexion);

            // 2. Eliminar registros de imágenes de la base de datos
            await actividadesModel.eliminarImagenesActividadPorId(actividadId, conexion);

            // 3. Eliminar la actividad
            const affectedRows = await actividadesModel.eliminarActividad(actividadId, conexion);

            if (affectedRows === 0) {
                throw new Error('Actividad no encontrada');
            }

            // 4. Eliminar archivos físicos
            await actividadesServicio.eliminarArchivosFisicos(imagenes);

            await conexion.commit();

            return {
                actividadId: actividadId,
                imagenesEliminadas: imagenes.length
            };

        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            if (conexion) {
                conexion.release();
            }
        }
    }

    async editarActividad(actividadId, titulo, descripcion, nuevasImagenes = [], imagenesAEliminar = []) {
        let conexion;
        try {
            conexion = await pool.getConnection();
            await conexion.beginTransaction();

            // Validar que la actividad existe
            const actividadExistente = await actividadesModel.obtenerActividadPorId(actividadId, conexion);
            if (!actividadExistente) {
                throw new Error('Actividad no encontrada');
            }
            let tipoValidacion = 'edicion';
            // Validar datos
            actividadesServicio.validarDatosActividad(titulo, descripcion, { length: nuevasImagenes.length }, tipoValidacion);

            // 1. Actualizar actividad
            const affectedRows = await actividadesModel.actualizarActividad(actividadId, titulo, descripcion, conexion);

            if (affectedRows === 0) {
                throw new Error('No se pudo actualizar la actividad');
            }

            const cambios = {
                tituloCambiado: actividadExistente.titulo !== titulo,
                descripcionCambiada: actividadExistente.descripcion !== descripcion,
                imagenesEliminadas: [],
                nuevasImagenes: []
            };

            // 2. Eliminar imágenes especificadas
            if (imagenesAEliminar && imagenesAEliminar.length > 0) {
                cambios.imagenesEliminadas = await actividadesServicio.eliminarImagenesSeleccionadas(actividadId, imagenesAEliminar, conexion);
            }

            // 3. Agregar nuevas imágenes
            if (nuevasImagenes && nuevasImagenes.length > 0) {
                cambios.nuevasImagenes = await actividadesServicio.procesarNuevasImagenes(actividadId, nuevasImagenes, conexion);
            }

            // 4. Obtener imágenes actualizadas
            const imagenesActuales = await actividadesModel.obtenerImagenesPorActividadId(actividadId, conexion);

            await conexion.commit();
            return {
                actividadId,
                titulo,
                descripcion,
                imagenes: imagenesActuales,
                cambios: cambios
            };

        } catch (error) {

            if (conexion) {
                await conexion.rollback();
            }
            // Eliminar archivos subidos en caso de error
            if (nuevasImagenes && nuevasImagenes.length > 0) {
                actividadesServicio.eliminarArchivosSubidos(nuevasImagenes);
            }

            throw error;
        } finally {
            if (conexion) {
                conexion.release();
            }
        }
    }

    static validarDatosActividad(titulo, descripcion, imagenes, tipoValidacion = 'creacion') {
        if (!titulo || !descripcion) {
            throw new Error('El título y la descripción son requeridos');
        }

        if (titulo.length > 255) {
            throw new Error('El título no puede exceder los 255 caracteres');
        }

        if (descripcion.length > 1000) {
            throw new Error('La descripción no puede exceder los 1000 caracteres');
        }

        if (tipoValidacion === 'creacion') {
            if (!imagenes || imagenes.length === 0) {
                throw new Error('Debes subir al menos una imagen');
            }
        } else if (tipoValidacion === 'edicion') {
            if (imagenes.length > 5) {
                throw new Error('No se pueden subir más de 5 imágenes');
            }
        }


    }

    static async procesarImagenes(actividadId, imagenes, conexion) {
        const imagenesGuardadas = [];

        for (const imagen of imagenes) {
            const imagenPath = `./capeta-actividades/${imagen.filename}`;
            console.log("Guardando imagen en DB:", imagenPath);
            await actividadesModel.crearImagenActividad(actividadId, imagenPath, conexion);
            imagenesGuardadas.push(imagenPath);
        }

        return imagenesGuardadas;
    }

    static eliminarArchivosSubidos(imagenes) {
        if (!imagenes) return;

        imagenes.forEach(imagen => {
            const filePath = path.join(__dirname, '../capeta-actividades', imagen.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    }

    // static async obtenerImagenesParaActividades(actividades, conexion) {
    //     // Crear un array de promesas para obtener imágenes en paralelo
    //     const actividadesConImagenes = await Promise.all(
    //         actividades.map(async (actividad) => {
    //             const imagenes = await actividadesModel.obtenerImagenesPorActividad(actividad.id, conexion);
    //             return {
    //                 ...actividad,
    //                 imagenes: imagenes
    //             };
    //         })
    //     );

    //     return actividadesConImagenes;
    // }

    static async obtenerImagenesParaActividades(actividades, conexion) {
        try {

            // Crear un array de promesas para obtener imágenes en paralelo
            const actividadesConImagenesPromises = actividades.map(async (actividad, index) => {
                try {
                    const imagenes = await actividadesModel.obtenerImagenesPorActividad(actividad.id, conexion);

                    return {
                        ...actividad,
                        imagenes: imagenes
                    };

                } catch (imagenError) {

                    // Retornar la actividad sin imágenes en caso de error
                    return {
                        ...actividad,
                        imagenes: [],
                        errorImagenes: `Error al cargar imágenes: ${imagenError.message}`
                    };
                }
            });

            const actividadesConImagenes = await Promise.all(actividadesConImagenesPromises);

            return actividadesConImagenes;

        } catch (error) {
            // En caso de error crítico, retornar actividades sin imágenes
            return actividades.map(actividad => ({
                ...actividad,
                imagenes: [],
                errorImagenes: 'Error temporal al cargar imágenes'
            }));
        }
    }

    static async validarActividadExiste(actividadId, conexion) {
        try {
            // Verificar si la actividad existe
            const [actividades] = await conexion.query(
                'SELECT id FROM actividades WHERE id = ?',
                [actividadId]
            );

            if (actividades.length === 0) {
                throw new Error('Actividad no encontrada');
            }

        } catch (error) {
            throw error;
        }
    }

    static async eliminarArchivosFisicos(imagenes) {
        if (!imagenes || imagenes.length === 0) {
            console.log('No hay archivos físicos para eliminar');
            return;
        }

        let eliminadosExitosos = 0;
        let erroresEliminacion = 0;

        for (const imagen of imagenes) {
            try {
                const projectRoot = path.join(path.dirname(__dirname), 'actividades');
                const filePath = path.join(projectRoot, imagen.imagen_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    eliminadosExitosos++;
                }
            } catch (error) {
                erroresEliminacion++;
                console.error(`Error eliminando archivo ${imagen.imagen_url}:`, error);
                // No lanzamos error para continuar con los demás archivos
            }
        }

    }

    static async eliminarImagenesSeleccionadas(actividadId, imagenesAEliminar, conexion) {
        const imagenesEliminadas = [];

        // Obtener información de las imágenes a eliminar
        const imagenesExistentes = await actividadesModel.obtenerImagenesPorActividadId(actividadId, conexion);

        const imagenesParaEliminar = imagenesExistentes.filter(imagen =>
            imagenesAEliminar.includes(imagen.id)
        );

        if (imagenesParaEliminar.length === 0) {
            return [];
        }

        // Eliminar de la base de datos
        const imagenesIds = imagenesParaEliminar.map(imagen => imagen.id);
        await actividadesModel.eliminarImagenesActividad(imagenesIds, conexion);

        // Eliminar archivos físicos
        for (const imagen of imagenesParaEliminar) {
            try {
                const projectRoot = path.join(path.dirname(__dirname), 'actividades');
                const filePath = path.join(projectRoot, imagen.imagen_url);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    imagenesEliminadas.push({
                        id: imagen.id,
                        imagen_url: imagen.imagen_url,
                        eliminado: true
                    });
                } else {
                    imagenesEliminadas.push({
                        id: imagen.id,
                        imagen_url: imagen.imagen_url,
                        eliminado: false,
                        error: 'Archivo no encontrado'
                    });
                }
            } catch (error) {
                imagenesEliminadas.push({
                    id: imagen.id,
                    imagen_url: imagen.imagen_url,
                    eliminado: false,
                    error: error.message
                });
            }
        }

        return imagenesEliminadas;
    }

    static async procesarNuevasImagenes(actividadId, nuevasImagenes, conexion) {
        const imagenesGuardadas = [];

        for (const [index, imagen] of nuevasImagenes.entries()) {
            try {

                const imagenPath = `./capeta-actividades/${imagen.filename}`;
                await actividadesModel.crearImagenActividad(actividadId, imagenPath, conexion);
                imagenesGuardadas.push(imagenPath);

            } catch (imagenError) {
                throw new Error(`Error al guardar la nueva imagen ${imagen.originalname}: ${imagenError.message}`);
            }
        }

        return imagenesGuardadas;
    }

    static validarDatosActividad(titulo, descripcion, imagenes = { length: 0 }) {
        if (!titulo || !descripcion) {
            throw new Error('El título y la descripción son requeridos');
        }

        // Validación adicional de longitud
        if (titulo.length > 255) {
            throw new Error('El título no puede exceder los 255 caracteres');
        }

        if (descripcion.length > 1000) {
            throw new Error('La descripción no puede exceder los 1000 caracteres');
        }

        // Para edición, las imágenes no son obligatorias
        // Solo validamos si se están subiendo nuevas
        if (imagenes.length > 5) {
            throw new Error('No se pueden subir más de 5 imágenes');
        }
    }

}


module.exports = new actividadesServicio();
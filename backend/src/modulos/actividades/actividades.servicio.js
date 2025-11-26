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
            await actividadesModel.eliminarImagenesActividad(actividadId, conexion);

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
            if (conexion) {
                try {
                    await conexion.rollback();
                } catch (rollbackError) {
                    console.error('❌ Error al hacer rollback:', rollbackError);
                }
            }
            throw error;
        } finally {
            if (conexion) {
                conexion.release();
            }
        }
    }

    static validarDatosActividad(titulo, descripcion, imagenes) {
        if (!titulo || !descripcion) {
            throw new Error('El título y la descripción son requeridos');
        }
        if (!imagenes || imagenes.length === 0) {
            throw new Error('Debes subir al menos una imagen');
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
                console.log(projectRoot);
                const filePath = path.join(projectRoot, imagen.imagen_url);
                console.log("Eliminando archivo:", filePath);
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


}


module.exports = new actividadesServicio();
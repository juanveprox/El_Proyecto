const personalModel = require("./personal.model")
const fs = require("fs")

class personalServicio {

    async registrarPersonal(datos, archivos) {
        let conexion;
        try {
            conexion = await personalModel.obtenerConexion();
            await conexion.beginTransaction();
            // Validar tipo de personal
            if (!this.validarTipoPersonal(datos.tipo)) {
                throw new Error('Tipo de personal no válido');
            }

            // Validar cédula única
            const cedulaExiste = await this.validarCedulaUnica(datos.cedula, conexion);
            if (cedulaExiste) {
                throw new Error('La cédula ya está registrada');
            }

            // Formatear datos
            const personalData = this.formatearFechas(datos);


            // Crear registro principal

            const personalId = await personalModel.crearPersonal(personalData, conexion);
            if (!personalId) {
                throw new Error('Error al crear el registro de personal');
            }

            // Procesar archivos adjuntos
            if (archivos && archivos.length > 0) {
                for (const archivo of archivos) {
                    await personalModel.agregarArchivo(personalId, {
                        nombreArchivo: archivo.filename,
                        rutaArchivo: archivo.path,
                        tipoArchivo: this.determinarTipoArchivo(archivo.mimetype)
                    }, conexion);
                    if (!archivo) {
                        throw new Error('Error al asociar archivo al personal');
                    }
                }
            }
            conexion.commit();
            return {
                id: personalId,
                tipo: datos.tipo,
                archivosProcesados: archivos ? archivos.length : 0
            };
        } catch (error) {
            conexion.rollback();
            throw error;
        } finally {
            if (conexion) {
                await conexion.release();
            }
        }
    }

    async obtenerPersonalPorTipo(tipo) {
        let conexion;
        try {
            conexion = await personalModel.obtenerConexion();

            if (!this.validarTipoPersonal(tipo)) {
                throw new Error('Tipo de personal no válido');
            }
            const personal = await personalModel.obtenerPersonalPorTipo(tipo, conexion);

            return {
                personal,
                total: personal.length,
                filtro: tipo
            };

        } catch (error) {
            throw error;
        } finally {
            if (conexion) {
                await conexion.release();
            }
        }
    }

    async obtenerPersonalPorId(id) {
        let conexion;
        try {
            conexion = await personalModel.obtenerConexion();
            if (!id || isNaN(parseInt(id))) {
                throw new Error('ID de personal no válido');
            }

            const personal = await personalModel.obtenerPersonalPorId(id, conexion);

            return personal;

        } catch (error) {

            if (error.message === 'ID de personal no válido' ||
                error.message === 'Personal no encontrado') {
                throw error;
            }
            throw new Error('Error al obtener el personal');
        }
    }

    async actualizarPersonal(id, datos, archivos = []) {
        let conexion;
        try {
            if (!id || isNaN(parseInt(id))) {
                throw new Error('ID de personal no válido');
            }

            conexion = await personalModel.obtenerConexion()

            // Validar cédula única (excluyendo el actual)
            if (datos.cedula) {
                const cedulaExiste = await personalModel.existeCedula(datos.cedula, conexion, id);
                if (cedulaExiste) {
                    throw new Error('La cédula ya está registrada por otro personal');
                }
            }

            // Preparar datos para actualización
            const datosActualizados = this.validarDatosActualizacion({
                ...datos,
                fecha_nacimiento: datos.fecha_nacimiento
                    ? this.formatearFechaParaBD(datos.fecha_nacimiento)
                    : undefined,
                fecha_ingreso_mppe: datos.fecha_ingreso_mppe
                    ? this.formatearFechaParaBD(datos.fecha_ingreso_mppe)
                    : undefined
            });

            conexion.beginTransaction()
            // Actualizar datos principales
            const actualizado = await personalModel.actualizarPersonal(id, datosActualizados, conexion);

            if (!actualizado) {
                throw new Error('Personal no encontrado');
            }

            // Procesar archivos adjuntos
            const archivosProcesados = [];
            if (archivos.length > 0) {
                for (const archivo of archivos) {
                    await personalModel.agregarArchivo(id, {
                        nombreArchivo: archivo.filename,
                        rutaArchivo: archivo.path,
                        tipoArchivo: this.determinarTipoArchivo(archivo.mimetype)
                    }, conexion);
                    archivosProcesados.push(archivo.filename);
                }
            }
            conexion.commit()
            return {
                id: parseInt(id),
                archivosProcesados: archivosProcesados.length,
                nombresArchivos: archivosProcesados
            };
        } catch (error) {
            await conexion.rollback()
            // Re-lanzar errores de validación
            if (error.message === 'ID de personal no válido' ||
                error.message === 'La cédula ya está registrada por otro personal' ||
                error.message === 'Personal no encontrado') {
                throw error;
            }
            throw new Error('Error al actualizar el personal');
        } finally {
            if (conexion) {
                await conexion.release();
            }
        }
    }

    async eliminarPersonal(id) {
        const conexion = await personalModel.obtenerConexion();
        try {
            await conexion.beginTransaction()

            if (!id || isNaN(parseInt(id))) {
                throw new Error('ID de personal no válido');
            }
            const archivos = await personalModel.obtenerArchivosPersonalPorId(id, conexion)

            const archivosEliminados = await personalModel.eliminarArchivosPorPersonalId(id, conexion);
            const resultado = await personalModel.eliminarPersonal(id, conexion);

            if (!resultado) {
                throw new Error('Personal no encontrado');
            }

            const archivosEliminadosCount = await personalModel.eliminarArchivosFisicos(archivos);

            await conexion.commit();
            return {

                id: parseInt(id),
                archivosEliminados: archivosEliminadosCount
            };
        } catch (error) {
            if (conexion) await conexion.rollback();

            if (error.message === 'ID de personal no válido' ||
                error.message === 'Personal no encontrado') {
                throw error;
            }
            throw new Error('Error al eliminar el personal');
        } finally {
            if (conexion) {
                await conexion.release();
            }
        }
    }

    async eliminarArchivo(personalId, archivoId) {
        const conexion = await personalModel.obtenerConexion();
        try {

            if (!personalId || isNaN(parseInt(personalId))) {
                throw new Error('ID de personal no válido');
            }

            if (!archivoId || isNaN(parseInt(archivoId))) {
                throw new Error('ID de archivo no válido');
            }

            const personal = await personalModel.obtenerDatosPersonalPorId(personalId, conexion);
            if (!personal) {
                throw new Error('Personal no encontrado');
            }

            const archivo = await personalModel.obtenerArchivosPersonalPorId(personalId, conexion, archivoId);
            if (!archivo) {
                throw new Error('Archivo no encontrado');
            }

            const eliminado = await personalModel.eliminarArchivoPorId(archivoId, conexion);
            if (!eliminado) {
                throw new Error('Error al eliminar archivo de la base de datos');
            }
            //!Ya se recibe el archivo , solo falta eliminar  y ya
            const archivoEliminado = await personalModel.eliminarArchivosFisicos(archivo);
            return {
                success: true,
                archivo: {
                    id: parseInt(archivoId),
                    nombre: archivo.nombre_archivo,
                    tipo: archivo.tipo_archivo
                },
                archivoEliminado
            };
        } catch (error) {
            if (conexion) await conexion.rollback();

            if (error.message === 'ID de personal no válido' ||
                error.message === 'Personal no encontrado') {
                throw error;
            }
            throw new Error('Error al eliminar el personal');
        } finally {
            if (conexion) {
                await conexion.release();
            }
        }
    }

    validarTipoPersonal(tipo) {
        const tiposValidos = ['docente', 'administrativo', 'obrero'];
        return tiposValidos.includes(tipo);
    }

    validarDatosActualizacion(datos) {
        const camposPermitidos = [
            'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
            'cedula', 'telefono', 'correo', 'fecha_nacimiento', 'sexo', 'cargo_voucher',
            'codigo_cargo', 'dependencia', 'codigo_dependencia', 'carga_horaria',
            'fecha_ingreso_mppe', 'titulos_profesionales', 'tipo_titulo', 'talla_franela',
            'talla_pantalon', 'talla_zapato'
        ];

        // Filtrar solo campos permitidos
        return Object.keys(datos)
            .filter(key => camposPermitidos.includes(key))
            .reduce((obj, key) => {
                obj[key] = datos[key];
                return obj;
            }, {});
    }

    formatearFechas(datos) {
        return {
            ...datos,
            fechaNacimiento: new Date(datos.fechaNacimiento).toISOString().split('T')[0],
            fechaIngresoMPPE: new Date(datos.fechaIngresoMPPE).toISOString().split('T')[0]
        };
    }

    formatearFechaParaBD(dateString) {
        if (!dateString) return null;

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;

        // Formato YYYY-MM-DD compatible con MySQL
        return date.toISOString().split('T')[0];
    }

    determinarTipoArchivo(mimetype) {
        return mimetype.startsWith('image/') ? 'imagen' : 'pdf';
    }

    async validarCedulaUnica(cedula, conexion) {
        return await personalModel.existeCedula(cedula, conexion);
    }

    eliminarArchivosTemporales(archivos) {
        if (archivos && archivos.length > 0) {
            archivos.forEach(archivo => {
                if (fs.existsSync(archivo.path)) {
                    fs.unlinkSync(archivo.path);
                }
            });
        }
    }
}

module.exports = new personalServicio();
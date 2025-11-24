const estudiantesValidar = require("./estudiantes.validar")
const { pool } = require("../../config/baseDatos")
const estudiantesModel = require("./estudiantes.model")

class estudianteServicio {
    async crearEstudianteBD(estudiante, representante) {
        let conexion;

        try {

            const estudianteError = estudiantesValidar.validarDataEstudiante(estudiante)
            const representanteError = estudiantesValidar.validarDataRepresentante(representante)

            if (estudianteError.length > 0 || representanteError.length > 0) {
                throw {
                    code: 'VALIDATION_ERROR',
                    message: 'Datos de entrada inválidos',
                    errors: {
                        estudiante: estudianteError,
                        representante: representanteError
                    }
                };
            }


            conexion = await pool.getConnection();
            await conexion.beginTransaction()
            const { representanteID, estaRegistrado } = await estudiantesModel.verificarRepresentante(conexion, representante);

            const estudianteExiste = await estudiantesModel.encontrarEstudiantePorCedula(estudiante)

            estudiantesModel.verificarDuplicadoEstudiante(estudianteExiste, estudiante)

            const nuevoEstudiante = await estudiantesModel.registrarEstudiante(conexion, estudiante, representanteID);

            await conexion.commit();

            return {
                success: true,
                message: 'Estudiante registrado exitosamente',
                estudianteId: nuevoEstudiante.insertId,
                representanteId: representanteID,
                representanteExistente: estaRegistrado
            };

        } catch (error) {
            if (conexion) {
                await conexion.rollback();
            }

            return Promise.reject(error);
        } finally {
            if (conexion) {
                conexion.release();
            }
        }


    }
    async eliminarEstudianteBD(id) {
        let conexion;
        try {
            conexion = await pool.getConnection();
            await conexion.beginTransaction();

            const representanteId = await estudiantesModel.obtenerIdRepresentante(conexion, id);
            if (!representanteId) {
                throw {
                    code: 'ESTUDIANTE_NO_ENCONTRADO',
                    message: 'Estudiante no encontrado'
                };
            }

            const estudianteEliminado = await estudiantesModel.eliminarEstudiante(conexion, id);

            if (estudianteEliminado.affectedRows == 0) {
                throw {
                    code: 'ESTUDIANTE_NO_ELIMINADO',
                    message: 'El estudiante no se pudo eliminar'
                };


            }

            await estudiantesModel.eliminarRepresentanteSiNoTieneEstudiantes(conexion, representanteId);

            await conexion.commit();

            return {
                success: true,
                message: 'Estudiante eliminado exitosamente',
                estudianteId: id,
                representanteId: representanteId
            };

        } catch (error) {

            await conexion.rollback();
            throw error;
        } finally {

            conexion.release();
        }
    }

    async editarEstudianteBD(estudianteId, estudiante, representante) {
        let conexion;
        try {
            conexion = await pool.getConnection();
            await conexion.beginTransaction();

            const representanteId = await estudiantesModel.obtenerIdRepresentante(conexion, estudianteId);
            if (!representanteId) {
                throw {
                    code: 'ESTUDIANTE_NO_ENCONTRADO',
                    message: 'Estudiante no encontrado'
                };
            }

            const resultadoRepresentante = await estudiantesModel.actualizarDatosRepresentante(conexion, representanteId, representante);
            if (resultadoRepresentante.affectedRows == 0) {
                throw {
                    code: 'REPRESENTANTE_NO_ACTUALIZADO',
                    message: 'El representante no se pudo actualizar'
                };
            }

            const resultadoEstudiante = await estudiantesModel.actualizarDatosEstudiante(conexion, estudianteId, estudiante);

            if (resultadoEstudiante.affectedRows == 0) {
                throw {
                    code: 'ESTUDIANTE_NO_ACTUALIZADO',
                    message: 'El estudiante no se pudo actualizar'
                };
            }
            await conexion.commit();

            return {
                success: true,
                message: 'Estudiante y representante actualizados exitosamente',
                estudianteId: estudianteId,
                representanteId: representanteId
            }

        } catch (error) {
            console.log(error)
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }

    static separarYFormatearObjetos(data) {
        // Función para formatear fecha a dd/mm/aaaa
        const formatearFecha = (fecha) => {
            if (!fecha) return null;
            const date = new Date(fecha);
            const dia = date.getDate().toString().padStart(2, '0');
            const mes = (date.getMonth() + 1).toString().padStart(2, '0');
            const año = date.getFullYear();
            return `${dia}/${mes}/${año}`;
        };

        // Separar el objeto en estudiante y representante
        const estudiante = {
            id: data.id,
            nombres: data.nombres,
            apellidos: data.apellidos,
            fecha_nacimiento: formatearFecha(data.fecha_nacimiento),
            genero: data.genero,
            tipo_cedula: data.tipo_cedula,
            cedula: data.cedula,
            cedula_escolar: data.cedula_escolar,
            representante_id: data.representante_id,
            created_at: formatearFecha(data.created_at)
        };

        const representante = {
            id: data.representante_id,
            nombres: data.rep_nombres,
            apellidos: data.rep_apellidos,
            relacion: data.relacion,
            email: data.email,
            telefono: data.rep_telefono,
            ocupacion: data.ocupacion,
            tipo_cedula: data.rep_tipo_cedula,
            cedula: data.rep_cedula,
            created_at: formatearFecha(data.rep_created_at)
        };

        return {
            estudiante,
            representante
        };
    }

    async obtenerEstudiantePorIdBD(id) {
        let conexion;

        try {
            conexion = await pool.getConnection();
            const resultado = await estudiantesModel.obtenerEstudiantePorId(conexion, id);

            if (!resultado) {
                throw {
                    code: 'ESTUDIANTE_NO_ENCONTRADO',
                    message: 'Estudiante no encontrado'
                };
            }

            return estudianteServicio.separarYFormatearObjetos(resultado);
        } catch (error) {
            throw error;
        } finally {
            conexion.release();
        }
    }

    async obtenerEstudiantePorCedulaoCiEscolarBD(cedula, cedulaEscolar) {
        let conexion
        try {
            if (!cedula && !cedulaEscolar) {
                const error = new Error('Debe proporcionar al menos un número de cédula o cédula escolar');
                throw error;
            }
            conexion = await pool.getConnection();
            const resultado = await estudiantesModel.obtenerEstudiantePorCedulaoCiEscolar(conexion, cedula, cedulaEscolar)
            console.log(resultado)

            if (!resultado) {
                throw {
                    code: 'ESTUDIANTE_NO_ENCONTRADO',
                    message: 'Estudiante no encontrado'
                };
            }

            return estudianteServicio.separarYFormatearObjetos(resultado);
        } catch (error) {
            throw error
        }
    }

    async obtenerTodosEstudiantesBD(filters) {
        try {
            const { page = 1, limit = 10, search, sortBy = 'apellidos', sortOrder = 'asc', exportAll } = filters;

            const result = await estudiantesModel.obtenerTodosEstudiantes({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                exportAll
            });

            if (exportAll) {
                return {
                    success: true,
                    data: result.students
                };
            }

            return {
                success: true,
                data: result.students,
                pagination: {
                    total: result.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(result.total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Error en servicio de estudiantes: ${error.message}`);
        }
    }
}

module.exports = new estudianteServicio();
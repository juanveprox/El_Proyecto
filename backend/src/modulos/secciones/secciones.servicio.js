const seccionesModel = require("./secciones.model")


class seccionesServicio {
    // GRADOS
    async crearGrado(data) {
        try {
            const gradoId = await seccionesModel.crearGrado(data);
            return { id: gradoId, ...data };
        } catch (error) {
            throw new Error(`Error al crear grado: ${error.message}`);
        }
    }

    async obtenerGrados() {
        try {
            const grados = await seccionesModel.obtenerGrados();
            return grados;
        } catch (error) {
            throw new Error(`Error al obtener grados: ${error.message}`);
        }
    }

    async obtenerGradoPorId(id) {
        try {
            const grado = await seccionesModel.obtenerGradoPorId(id);
            if (!grado) {
                throw new Error('Grado no encontrado');
            }
            return { success: true, data: grado };
        } catch (error) {
            throw new Error(`Error al obtener grado: ${error.message}`);
        }
    }

    async actualizarGrado(id, data) {
        try {
            const existe = await seccionesModel.verificarGradoExiste(id);
            if (!existe) {
                throw new Error('Grado no encontrado');
            }

            const affectedRows = await seccionesModel.actualizarGrado(id, data);
            return affectedRows
        } catch (error) {
            throw new Error(`Error al actualizar grado: ${error.message}`);
        }
    }

    async eliminarGrado(id) {
        try {
            const existe = await seccionesModel.verificarGradoExiste(id);
            if (!existe) {
                throw new Error('Grado no encontrado');
            }

            const affectedRows = await seccionesModel.eliminarGrado(id);
            return affectedRows;

        } catch (error) {
            throw new Error(`Error al eliminar grado: ${error.message}`);
        }
    }

    //*Secciones

    async crearSeccion(data) {
        try {
            // Verificar que el grado existe
            const gradoExiste = await seccionesModel.verificarGradoExiste(data.grado_id);
            if (!gradoExiste) {
                throw new Error('El grado especificado no existe');
            }

            const seccionId = await seccionesModel.crearSeccion(data);
            return { id: seccionId, ...data };
        } catch (error) {
            if (error.message.includes('Duplicate')) {
                throw new Error('La sección que quieres crear ya existe ' + error.message);
            }
            throw new Error(`Error al crear sección: ${error.message}`);
        }
    }

    async obtenerSeccionesPorGrado(gradoId) {
        try {
            const gradoExiste = await seccionesModel.verificarGradoExiste(gradoId);
            if (!gradoExiste) {
                throw new Error('El grado especificado no existe');
            }

            const secciones = await seccionesModel.obtenerSeccionesPorGrado(gradoId);
            return secciones
        } catch (error) {
            throw new Error(`Error al obtener secciones: ${error.message}`);
        }
    }

    async obtenerSeccionCompleta(id) {
        try {
            const seccion = await seccionesModel.obtenerSeccionPorId(id);
            if (!seccion) {
                throw new Error('Sección no encontrada');
            }

            const profesores = await seccionesModel.obtenerProfesoresPorSeccion(id);
            const estudiantes = await seccionesModel.obtenerEstudiantesPorSeccion(id);
            const capacidad = await seccionesModel.verificarCapacidadSeccion(id);

            return {
                data: {
                    ...seccion,
                    profesores,
                    estudiantes,
                    capacidad_actual: capacidad?.estudiantes_actuales || 0,
                    capacidad_maxima: capacidad?.capacidad_maxima || 0
                }
            };
        } catch (error) {
            throw new Error(`Error al obtener sección: ${error.message}`);
        }
    }

    async actualizarSeccion(id, data) {
        try {
            const existe = await seccionesModel.verificarSeccionExiste(id);
            if (!existe) {
                throw new Error('Sección no encontrada');
            }

            const affectedRows = await seccionesModel.actualizarSeccion(id, data);
            return affectedRows
        } catch (error) {
            throw new Error(`Error al actualizar sección: ${error.message}`);
        }
    }

    async eliminarSeccion(id) {
        try {
            const existe = await seccionesModel.verificarSeccionExiste(id);
            if (!existe) {
                throw new Error('Sección no encontrada');
            }

            const affectedRows = await seccionesModel.eliminarSeccion(id);
            return affectedRows
        } catch (error) {
            throw new Error(`Error al eliminar sección: ${error.message}`);
        }
    }

    //*Asignar profesor

    async asignarProfesorASeccion(data) {
        try {

            // Verificar que la sección existe
            const seccionExiste = await seccionesModel.verificarSeccionExiste(data.seccion_id);
            if (!seccionExiste) {
                throw new Error('La sección especificada no existe');
            }

            // Verificar que el usuario es profesor
            const profesorExiste = await seccionesModel.verificarDocenteExiste(data.profesor_id, 'docente');
            if (!profesorExiste) {
                throw new Error('El usuario especificado no es un docente válido');
            }

            // Verificar si ya está asignado
            const yaAsignado = await seccionesModel.verificarProfesorEnSeccion(
                data.profesor_id,
                data.seccion_id
            );
            if (yaAsignado) {
                throw new Error('Este profesor ya está asignado a esta sección');
            }

            // Si es tutor, verificar que no haya otro tutor
            if (data.es_tutor) {
                const profesores = await seccionesModel.obtenerProfesoresPorSeccion(data.seccion_id);
                const tieneTutor = profesores.some(p => p.es_tutor);
                if (tieneTutor) {
                    throw new Error('Esta sección ya tiene un tutor asignado');
                }
            }

            if (data.es_tutor == "true") {
                data.es_tutor = true
            }

            const asignacionId = await seccionesModel.asignarProfesorASeccion({
                ...data,
                fecha_asignacion: new Date().toISOString().split('T')[0]
            });

            return { id: asignacionId, ...data }

        } catch (error) {
            throw new Error(`Error al asignar profesor: ${error.message}`);
        }
    }
    async eliminarProfesorDeSeccion(asignacionId) {
        try {
            const affectedRows = await seccionesModel.eliminarProfesorDeSeccion(asignacionId);
            if (affectedRows === 0) {
                throw new Error('Asignación no encontrada');
            }

            return {
                success: true,
                message: 'Profesor removido de la sección correctamente'
            };
        } catch (error) {
            throw new Error(`Error al eliminar profesor: ${error.message}`);
        }
    }

    //*Asignar Estudiante

    async asignarEstudianteASeccion(data) {
        try {
            // Verificar que la sección existe
            const seccionExiste = await seccionesModel.verificarSeccionExiste(data.seccion_id);
            if (!seccionExiste) {
                throw new Error('La sección especificada no existe');
            }


            const estudianteExiste = await seccionesModel.verificarEstudianteExite(data.estudiante_id);
            if (!estudianteExiste) {
                throw new Error('El estudiante no existe');
            }

            // Verificar capacidad de la sección
            const capacidad = await seccionesModel.verificarCapacidadSeccion(data.seccion_id);
            if (capacidad && capacidad.estudiantes_actuales >= capacidad.capacidad_maxima) {
                throw new Error('La sección ha alcanzado su capacidad máxima');
            }

            // Verificar si ya está asignado en el mismo año escolar
            const yaAsignado = await seccionesModel.verificarEstudianteEnSeccion(
                data.estudiante_id,
                data.seccion_id,
                data.año_escolar
            );
            if (yaAsignado) {
                throw new Error('Este estudiante ya está asignado a esta sección en el año escolar especificado');
            }

            const asignacionId = await seccionesModel.asignarEstudianteASeccion({
                ...data,
                estado: 'activo',
                fecha_inscripcion: new Date().toISOString().split('T')[0]
            });


            return {
                success: true,
                message: 'Estudiante asignado correctamente',
                data: { id: asignacionId, ...data }
            };
        } catch (error) {
            throw new Error(`Error al asignar estudiante: ${error.message}`);
        }
    }

    async actualizarEstadoEstudiante(asignacionId, estado) {
        try {
            const affectedRows = await seccionesModel.actualizarEstadoEstudiante(asignacionId, estado);
            if (affectedRows === 0) {
                throw new Error('Asignación no encontrada');
            }

            return {
                success: true,
                message: `Estado del estudiante actualizado a "${estado}" correctamente`
            };
        } catch (error) {
            throw new Error(`Error al actualizar estado: ${error.message}`);
        }
    }

    async eliminarEstudianteDeSeccion(asignacionId) {
        try {
            const affectedRows = await seccionesModel.eliminarEstudianteDeSeccion(asignacionId);
            if (affectedRows === 0) {
                throw new Error('Asignación no encontrada');
            }

            return {
                success: true,
                message: 'Estudiante removido de la sección correctamente'
            };
        } catch (error) {
            throw new Error(`Error al eliminar estudiante: ${error.message}`);
        }
    }
}

module.exports = new seccionesServicio();
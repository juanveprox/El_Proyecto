const seccionesServicio = require("./secciones.servicio")

class seccionesController {
    // GRADOS
    async crearGrado(req, res) {
        try {
            const { nombre, nivel } = req.body;

            if (!nombre || !nivel) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y nivel son requeridos'
                });
            }
            const resultado = await seccionesServicio.crearGrado({ nombre, nivel });
            res.status(201).json({
                success: true,
                message: "Grado creado exitosamente",
                data: resultado
            });
        } catch (error) {

            if (error.message.includes('Duplicate')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async obtenerGrados(req, res) {
        try {
            const resultado = await seccionesServicio.obtenerGrados();
            res.status(200).json({
                success: true,
                message: "Grados obtenidos exitosamente",
                data: resultado
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async obtenerGradoPorId(req, res) {
        try {
            const { id } = req.params;
            const resultado = await seccionesServicio.obtenerGradoPorId(id);
            res.status(200).json({
                success: true,
                message: resultado ? "Grado obtenido exitosamente" : "No se encontró el grado",
                data: resultado
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async actualizarGrado(req, res) {
        try {
            const { id } = req.params;
            const { nombre, nivel } = req.body;

            const resultado = await seccionesServicio.actualizarGrado(id, { nombre, nivel });
            res.status(200).json({
                success: true,
                message: "Grado actualizado exitosamente",
                data: resultado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async eliminarGrado(req, res) {
        try {
            const { id } = req.params;
            const resultado = await seccionesServicio.eliminarGrado(id);
            res.status(200).json({
                success: true,
                message: "Grado eliminado exitosamente",
                resultado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //* Secciones

    async crearSeccion(req, res) {
        try {
            const { grado_id, nombre, capacidad_maxima } = req.body;

            if (!grado_id || !nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Grado ID y nombre son requeridos'
                });
            }

            const resultado = await seccionesServicio.crearSeccion({
                grado_id,
                nombre,
                capacidad_maxima: capacidad_maxima || 40
            });

            res.status(201).json({
                success: true,
                message: "Sección creada exitosamente",
                data: resultado
            })
        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async obtenerSeccionesPorGrado(req, res) {
        try {
            const { gradoId } = req.params;
            const resultado = await seccionesServicio.obtenerSeccionesPorGrado(gradoId);

            res.status(200).json({
                success: true,
                message: "Secciones obtenidas exitosamente",
                data: resultado
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async obtenerSeccionCompleta(req, res) {
        try {
            const { id } = req.params;
            const resultado = await seccionesServicio.obtenerSeccionCompleta(id);
            res.status(200).json({
                success: true,
                message: "Sección obtenida exitosamente",
                data: resultado
            })
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async actualizarSeccion(req, res) {
        try {
            const { id } = req.params;
            const { nombre, capacidad_maxima } = req.body;

            const resultado = await seccionesServicio.actualizarSeccion(id, {
                nombre,
                capacidad_maxima
            });

            res.status(200).json({
                success: true,
                message: "Sección actualizada exitosamente",
                data: resultado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async eliminarSeccion(req, res) {
        try {
            const { id } = req.params;
            const resultado = await seccionesServicio.eliminarSeccion(id);
            res.status(200).json(
                {
                    success: true,
                    message: "Sección eliminada exitosamente",
                    data: resultado
                });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //*Asignar profesor
    async asignarProfesorASeccion(req, res) {
        try {
            const { seccion_id, profesor_id, es_tutor } = req.body;

            if (!seccion_id || !profesor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Sección ID y Profesor ID son requeridos'
                });
            }

            const resultado = await seccionesServicio.asignarProfesorASeccion({
                seccion_id,
                profesor_id,
                es_tutor: es_tutor || false
            });

            res.status(201).json({
                success: true,
                message: "Profesor asignado a la sección exitosamente",
                data: resultado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async eliminarProfesorDeSeccion(req, res) {
        try {
            const { asignacionId } = req.params;
            const resultado = await seccionesServicio.eliminarProfesorDeSeccion(asignacionId);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //* Asignar Estudiante

    async asignarEstudianteASeccion(req, res) {
        try {
            const { seccion_id, estudiante_id, año_escolar } = req.body;

            if (!seccion_id || !estudiante_id || !año_escolar) {
                return res.status(400).json({
                    success: false,
                    message: 'Sección ID, Estudiante ID y Año Escolar son requeridos'
                });
            }

            const resultado = await seccionesServicio.asignarEstudianteASeccion({
                seccion_id,
                estudiante_id,
                año_escolar
            });

            res.status(201).json(resultado);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async actualizarEstadoEstudiante(req, res) {
        try {
            const { asignacionId } = req.params;
            const { estado } = req.body;

            if (!['activo', 'inactivo', 'graduado'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido. Use: activo, inactivo o graduado'
                });
            }

            const resultado = await seccionesServicio.actualizarEstadoEstudiante(asignacionId, estado);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async eliminarEstudianteDeSeccion(req, res) {
        try {
            const { asignacionId } = req.params;
            const resultado = await seccionesServicio.eliminarEstudianteDeSeccion(asignacionId);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

}


module.exports = new seccionesController();
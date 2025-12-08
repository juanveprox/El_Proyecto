const express = require('express');
const router = express.Router();
const seccionesController = require('./secciones.controller');

//*Grados
router.post("/grados", seccionesController.crearGrado)
router.get("/grados", seccionesController.obtenerGrados)
router.get("/grados/:id", seccionesController.obtenerGradoPorId)
router.put("/grados/:id", seccionesController.actualizarGrado)
router.delete("/grados/:id", seccionesController.eliminarGrado)

//*Secciones
router.post("/secciones", seccionesController.crearSeccion);
router.get("/grados/:gradoId/secciones", seccionesController.obtenerSeccionesPorGrado);//*¨Nota para buscar grado
router.get("/secciones/:id", seccionesController.obtenerSeccionCompleta);
router.put("/secciones/:id", seccionesController.actualizarSeccion);
router.delete("/secciones/:id", seccionesController.eliminarSeccion);

//*Asignar profesor a seccion

router.post("/secciones/profesores", seccionesController.asignarProfesorASeccion);
router.delete("/secciones/profesores/:asignacionId", seccionesController.eliminarProfesorDeSeccion);

//*Asignar estudiante a seccion

router.post('/secciones/estudiantes', seccionesController.asignarEstudianteASeccion);
router.patch('/secciones/estudiantes/:asignacionId/estado', seccionesController.actualizarEstadoEstudiante);
router.delete('/secciones/estudiantes/:asignacionId', seccionesController.eliminarEstudianteDeSeccion);

module.exports = router;
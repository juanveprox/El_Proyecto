const express = require("express")
const router = express.Router()
const estudiantesController = require("./estudiantes.controller")


router.get("/", (req, res) => {
    res.send("estudiantes papa")
})

router.post("/", estudiantesController.crearEstudiante)
router.delete("/:id", estudiantesController.eliminarEstudiante)
router.put("/:id", estudiantesController.editarEstudiante)
router.post("/buscar-cedula", estudiantesController.obtenerEstudiantePorCedulaoCiEscolar)
router.get("/buscar-todos", estudiantesController.obtenerTodosEstudiantes)
router.get("/:id", estudiantesController.obtenerEstudiantePorId)

module.exports = router;
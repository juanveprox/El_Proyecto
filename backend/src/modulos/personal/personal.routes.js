const express = require('express');
const router = express.Router();
const personalController = require("./personal.controller")
const subir = require("./personal.middleware")

router.post("/", subir.any("archivos", 3), personalController.registrarPersonal)
router.get("/", personalController.obtenerPersonalPorTipo)
router.get("/:id", personalController.obtenerPersonalPorId)
router.put("/:id", subir.any("archivos", 3), personalController.actualizarPersonal)
router.delete("/:id", personalController.eliminarPersonal)
router.delete("/:id/:archivoId", personalController.eliminarArchivo)
module.exports = router;
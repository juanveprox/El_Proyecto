const express = require("express")
const router = express.Router()
const archivosController = require("./archivos.controller")
const archivosMiddleware = require("./archivos.middleware")

router.post("/", archivosMiddleware, archivosController.subirArchivo)

module.exports = router;
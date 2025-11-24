const express = require("express")
const router = express.Router()
const estadisticaController = require("./estadistica.controller")

router.get("/", estadisticaController.obtenerResumenEstadisticas);

module.exports = router;

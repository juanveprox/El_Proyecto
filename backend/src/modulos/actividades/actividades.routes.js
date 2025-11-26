const express = require("express")
const router = express.Router()
const subir = require("./actividades.middleware")
const actividadesController = require("./actividades.controller")

// router.get("/", (req, res) => {
//     res.send(" actividades papa")
// })

router.post("/", subir.array('imagenes', 5), actividadesController.crearActividad)
router.get("/", actividadesController.obtenerTodasActividades)
router.delete("/:id", actividadesController.eliminarActividad)

module.exports = router;
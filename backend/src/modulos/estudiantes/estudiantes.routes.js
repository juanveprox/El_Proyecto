const express = require("express")
const router = express.Router()
const estudiantesController = require("./estudiantes.controller")


router.get("/", (req, res) => {
    res.send("estudiantes papa")
})

module.exports = router;
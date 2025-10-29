const express = require("express")
const router = express.Router()
const authController = require("./auth.controller")


router.post("/registrar", authController.registrar)
router.post("/login", authController.login)
router.get("/", (req, res) => {
    res.send("Login y registrar")
})


module.exports = router;
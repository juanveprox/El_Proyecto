const express = require("express")
const router = express.Router()
const authController = require("./auth.controller")


router.post("/registar", authController.registrar)
router.post("/login", authController.login)
router.get("/", (req, res) => {
    res.send("Auth")
})


module.exports = router;
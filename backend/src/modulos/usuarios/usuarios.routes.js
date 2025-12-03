const express = require('express');
const router = express.Router();
const usuariosController = require('./usuarios.controller');

//Rutas para administradores
router.get("/", usuariosController.obtenerUsuarios)
router.get("/:id", usuariosController.obtenerUsuarioPorId)
router.post("/", usuariosController.crearUsuario)
router.put("/:id", usuariosController.actualizarUsuario)
router.delete("/:id", usuariosController.eliminarUsuario)

//! Se puede agregar funcionalidad para que admin, restablesca password(se agg a bd columna, para que user actualice al iniciar sesion)

//Rutas para usuarios normales 
router.get("/perfil/:id", usuariosController.obtenerUsuarioPorId)
router.put("/perfil/:id", usuariosController.actualizarUsuarioNormal)
router.put("/perfil/contrasena/:id", usuariosController.actualizarContrasena)
module.exports = router;
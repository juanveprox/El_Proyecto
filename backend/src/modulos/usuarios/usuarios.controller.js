const usuariosServicio = require("./usuarios.servicio")

class usuariosController {
    async obtenerUsuarios(req, res) {
        try {
            const usuarios = await usuariosServicio.obtenerUsuarios();
            res.json({
                success: true,
                data: usuarios,
                total: usuarios.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener usuarios'
            });
        }
    }

    async obtenerUsuarioPorId(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuariosServicio.obtenerUsuarioPorId(id);
            res.status(200).json({
                success: true,
                data: usuario
            });

        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener usuario'
            });
        }

    }

    async crearUsuario(req, res) {
        try {
            const usuarioData = req.body;
            const nuevoUsuario = await usuariosServicio.crearUsuario(usuarioData);
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });
        } catch (error) {
            if (error.message.includes('Faltan campos obligatorios') ||
                error.message.includes('ya está en uso')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear usuario'
            });
        }
    }

    async actualizarUsuario(req, res) {
        try {
            const { id } = req.params;
            const { nombre, usuario, correo, rol } = req.body;
            await usuariosServicio.actualizarUsuario(id, { nombre, usuario, correo, rol });
            res.status(200).json({
                success: true,
                message: 'Usuario actualizado exitosamente'
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar usuario'
            });
        }
    }

    async eliminarUsuario(req, res) {
        try {
            const { id } = req.params;
            await usuariosServicio.eliminarUsuario(id);
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al eliminar usuario'
            });
        }
    }

    //Rutas para usuarios normales

    async actualizarUsuarioNormal(req, res) {
        try {
            const { id } = req.params;
            const { nombre, usuario, correo } = req.body;
            await usuariosServicio.actualizarUsuarioNormal(id, { nombre, usuario, correo });
            res.status(200).json({
                success: true,
                message: 'Usuario actualizado exitosamente'
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar usuario'
            });
        }
    }

    async actualizarContrasena(req, res) {
        try {
            const { id } = req.params;
            const { contrasena, nuevaContrasena } = req.body;

            await usuariosServicio.actualizarContrasena(id, { contrasena, nuevaContrasena });
            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar contraseña'
            });
        }
    }
}
module.exports = new usuariosController();
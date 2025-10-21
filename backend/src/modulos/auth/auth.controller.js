const authServicio = require('./auth.servicio');

class AuthController {
    // Registrar nuevo usuario
    async registrar(req, res) {
        try {

            const { nombre, usuario, correo, password } = req.body

            //*Vemos si los campos no esta vacios
            if (!nombre || !usuario || !correo || !password) {
                return res.status(400).json({
                    success: false,
                    error: "Los campos no pueden estar vacios"
                })
            }

            const username = await authServicio.registrarUsuario(req.body);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    id: username.id,
                    nombre: username.nombre,
                    username: username.username,
                    email: username.email,
                    rol: username.rol
                }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Login de usuario
    async login(req, res) {
        try {

            console.log(req.body)
            const { usuario, password } = req.body;

            // if (!usuario || !password) {
            //     return res.status(400).json({
            //         success: false,
            //         message: 'Usuario y contraseña son requeridos'
            //     });
            // }

            const resultado = await authServicio.login({ usuario, password });


            console.log("login")

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: resultado
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtener perfil del usuario autenticado
    async obtenerPerfil(req, res) {
        try {
            const perfil = await authService.obtenerPerfil(req.usuario.id);

            res.json({
                success: true,
                data: perfil
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Verificar token (para el frontend)
    async verificarToken(req, res) {
        try {
            res.json({
                success: true,
                data: {
                    usuario: req.usuario,
                    valido: true
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();
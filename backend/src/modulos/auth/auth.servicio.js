const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authModel = require('./auth.model');
const { jwtSecret, jwtExpiresIn } = require('../../config/jwt');

class AuthServicio {

    // Registrar nuevo usuario
    async registrarUsuario(datos) {

        // Validar que no exista el username
        if (await authModel.usernameExiste(datos.usuario)) {
            throw new Error('El nombre de usuario ya existe');
        }

        // Validar que no exista el email
        if (await authModel.emailExiste(datos.email)) {
            throw new Error('El email ya está registrado');
        }

        // Validaciones adicionales
        this.validarDatosRegistro(datos);

        // Crear usuario
        return await authModel.crearUsuario(datos);
    }

    // Login de usuario
    async login(datos) {
        const { usuario, password } = datos;

        // Buscar usuario
        const username = await authModel.obtenerUsuarioPorCredenciales(usuario);
        if (!username) {
            throw new Error('Usuario o Correo invalidos');
        }

        // Verificar password
        const passwordValido = await bcrypt.compare(password, username.contraseña);
        if (!passwordValido) {
            throw new Error('Contraseña invalida');
        }

        // Actualizar último login
        await authModel.actualizarUltimoLogin(username.id);

        // Generar token JWT
        const token = jwt.sign(
            {
                id: username.id,
                username: username.usuario,
                rol: username.rol
            },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        // Retornar datos del usuario y token
        return {
            usuario: {
                id: username.id,
                username: username.usuario,
                email: username.correo,
                rol: username.rol
            },
            token
        };
    }

    // Obtener perfil de usuario
    async obtenerPerfil(usuarioId) {
        const usuario = await authModel.obtenerUsuarioPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Eliminar datos sensibles
        delete usuario.password_hash;
        return usuario;
    }

    // Validaciones de registro
    validarDatosRegistro(datos) {
        const { usuario, correo, password, rol } = datos;

        if (usuario.length < 3) {
            throw new Error('El usuario debe tener al menos 3 caracteres');
        }

        if (!this.validarEmail(correo)) {
            throw new Error('El email no es válido');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        const rolesValidos = ['administrador', 'usuario'];
        if (rol && !rolesValidos.includes(rol)) {
            throw new Error('Rol no válido');
        }
    }

    // Validar formato de email
    validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Verificar token JWT
    verificarToken(token) {
        try {
            return jwt.verify(token, jwtSecret);
        } catch (error) {
            throw new Error('Token inválido');
        }
    }
}

module.exports = new AuthServicio();
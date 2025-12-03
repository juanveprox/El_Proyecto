const usuariosModel = require("./usuarios.model")
const bcrypt = require('bcrypt');

class usuariosServicio {
    async obtenerUsuarios() {
        try {
            return await usuariosModel.obtenerTodosUsuarios();
        } catch (error) {
            throw new Error('Error al obtener usuarios desde el servicio');
        }
    }

    async obtenerUsuarioPorId(id) {
        try {
            const usuario = await usuariosModel.obtenerUsuarioPorId(id);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            return usuario;
        } catch (error) {
            throw error;;
        }
    }

    async crearUsuario(usuarioData) {
        try {

            if (!usuarioData.nombre || !usuarioData.usuario || !usuarioData.correo) {
                throw new Error('Faltan campos obligatorios');
            }


            const usuarioExistente = await usuariosModel.encontrarPorUsuario(usuarioData.usuario);
            if (usuarioExistente) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            const correoExistente = await usuariosModel.encontrarPorCorreo(usuarioData.correo);
            if (correoExistente) {
                throw new Error('El correo electrónico ya está en uso');
            }

            const passwordHash = await bcrypt.hash(usuarioData.password, 10);
            usuarioData.password = passwordHash;

            return await usuariosModel.crearUsuario(usuarioData);
        } catch (error) {
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    async actualizarUsuario(id, usuarioData) {
        try {

            await this.validarActualizacionUsuario(id, usuarioData);

            const resultado = await usuariosModel.actualizarUsuario(id, usuarioData);
            if (!resultado) {
                throw new Error('No se pudo actualizar el usuario');
            }

        } catch (error) {
            throw error;
        }
    }

    async eliminarUsuario(id) {
        try {
            const resultado = await usuariosModel.eliminarUsuario(id);
            if (!resultado) {
                throw new Error('Usuario no encontrado');
            }
            return resultado;
        } catch (error) {
            throw error;
        }
    }

    async validarActualizacionUsuario(id, usuarioData) {
        // Validar campos obligatorios
        if (!usuarioData.nombre || !usuarioData.usuario || !usuarioData.correo) {
            throw new Error('Faltan campos obligatorios');
        }

        // Verificar que el usuario exista
        const usuarioExistente = await usuariosModel.obtenerUsuarioPorId(id);
        if (!usuarioExistente) {
            throw new Error('Usuario no encontrado');
        }

        // Validar unicidad del nombre de usuario
        const usuarioConMismoNombre = await usuariosModel.encontrarPorUsuario(usuarioData.usuario);
        if (usuarioConMismoNombre && usuarioConMismoNombre.id !== parseInt(id)) {
            throw new Error('El nombre de usuario ya está en uso');
        }

        // Validar unicidad del correo
        const correoExistente = await usuariosModel.encontrarPorCorreo(usuarioData.correo);
        if (correoExistente && correoExistente.id !== parseInt(id)) {
            throw new Error('El correo electrónico ya está en uso');
        }

        return true;
    }

    // Actualización de usuario normal (sin rol)

    async actualizarUsuarioNormal(id, usuarioData) {
        try {
            await this.validarActualizacionUsuario(id, usuarioData);

            const resultado = await usuariosModel.actualizarUsuarioNormal(id, usuarioData);
            if (!resultado) {
                throw new Error('No se pudo actualizar el usuario');
            }
        }
        catch (error) {
            throw error;
        }
    }

    async actualizarContrasena(id, usuarioData) {
        try {
            const usuarioExistente = await usuariosModel.obtenerUsuarioPorId(id);
            if (!usuarioExistente) {
                throw new Error('Usuario no encontrado');
            }

            const contrasena = await usuariosModel.obtenerContrasena(id)

            if (!contrasena) {
                throw new Error('No se pudo obtener la contraseña');
            }
            const contrasenaValida = await bcrypt.compare(usuarioData.contrasena, contrasena.contraseña);
            if (!contrasenaValida) {
                throw new Error('Contraseña actual incorrecta');
            }

            const nuevaContrasenaHash = await bcrypt.hash(usuarioData.nuevaContrasena, 10);

            const resultado = await usuariosModel.actualizarContrasena(id, nuevaContrasenaHash);
            if (!resultado) {
                throw new Error('No se pudo actualizar la contraseña');
            }
        } catch (error) {
            throw error;
        }
    }

}
module.exports = new usuariosServicio();
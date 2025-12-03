const { pool } = require('../../config/baseDatos');


class usuariosModel {
    async obtenerTodosUsuarios() {
        try {
            const [rows] = await pool.query('SELECT id, nombre, usuario, correo, rol, ultimo_login  FROM usuarios');
            return rows;
        } catch (error) {
            throw new Error('Error al obtener usuarios desde la base de datos, ' + error.message);
        }
    }

    async obtenerUsuarioPorId(id) {
        const [rows] = await pool.query(
            'SELECT id, nombre, usuario, correo, rol,ultimo_login FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    async crearUsuario(usuarioData) {
        const { nombre, usuario, correo, rol, password } = usuarioData;
        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nombre, usuario, correo, rol, contraseña) VALUES (?, ?, ?, ?, ?)',
            [nombre, usuario, correo, rol || 'usuario', password]
        );
        return { id: resultado.insertId, nombre, usuario, correo, rol: rol || 'usuario' };
    }

    async encontrarPorUsuario(usuario) {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = ?',
            [usuario]
        );
        return rows[0];
    }

    async encontrarPorCorreo(correo) {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE correo = ?',
            [correo]
        );
        return rows[0];

    }

    async actualizarUsuario(id, usuarioData) {
        const { nombre, usuario, correo, rol } = usuarioData;
        const [resultado] = await pool.query(
            'UPDATE usuarios SET nombre = ?, usuario = ?, correo = ?, rol = ? WHERE id = ?',
            [nombre, usuario, correo, rol || "usuario", id]
        );
        return resultado.affectedRows > 0;
    }

    async eliminarUsuario(id) {
        const [resultado] = await pool.query(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );
        return resultado.affectedRows > 0;
    }

    async actualizarUsuarioNormal(id, usuarioData) {
        const { nombre, usuario, correo } = usuarioData;
        const [resultado] = await pool.query(
            'UPDATE usuarios SET nombre = ?, usuario = ?, correo = ? WHERE id = ?',
            [nombre, usuario, correo, id]
        );
        return resultado.affectedRows > 0;
    }

    async obtenerContrasena(id) {
        const [rows] = await pool.query(
            'SELECT contraseña FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0];
    }
    async actualizarContrasena(id, contrasena) {
        const [resultado] = await pool.query(
            'UPDATE usuarios SET contraseña = ? WHERE id = ?',
            [contrasena, id]
        );
        return resultado.affectedRows > 0;
    }
}
module.exports = new usuariosModel();
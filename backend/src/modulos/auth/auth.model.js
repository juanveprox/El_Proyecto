const { pool, probarConexion } = require('../../config/baseDatos');
const bcrypt = require('bcrypt');

class AuthModel {
    // Crear nuevo usuario
    async crearUsuario(datos) {
        const hashedPassword = await bcrypt.hash(datos.password, 10);

        const [result] = await pool.execute(
            `INSERT INTO usuarios (nombre, usuario, correo, contraseña, rol) 
       VALUES (?, ?, ?, ?, ?)`,
            [datos.nombre, datos.usuario, datos.correo, hashedPassword, datos.rol]
        );

        return this.obtenerUsuarioPorId(result.insertId);
    }

    // Obtener usuario por ID
    async obtenerUsuarioPorId(id) {
        const [rows] = await pool.execute(
            `SELECT id, usuario, correo, rol,
       FROM usuarios WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // Obtener usuario por email o username
    async obtenerUsuarioPorCredenciales(identificador) {
        probarConexion
        const [rows] = await pool.execute(
            `SELECT id,nombre, usuario, correo, contraseña, rol
       FROM usuarios 
       WHERE (correo = ? OR usuario = ?)`,
            [identificador, identificador]
        );
        return rows[0] || null;
    }

    // Verificar si username existe
    async usernameExiste(username, excludeId = null) {
        let query = 'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?';
        const params = [username];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows[0].count > 0;
    }

    // Verificar si email existe
    async emailExiste(correo, excludeId = null) {
        let query = 'SELECT COUNT(*) as count FROM usuarios WHERE correo = ?';
        const params = [correo];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows[0].count > 0;
    }

    // Actualizar último login
    async actualizarUltimoLogin(id) {
        await pool.execute(
            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    // Obtener todos los usuarios (para admin)
    async obtenerUsuarios() {
        const [rows] = await pool.execute(
            `SELECT id, username, email, rol, activo, ultimo_login, creado_en
       FROM usuarios 
       ORDER BY creado_en DESC`
        );
        return rows;
    }

    // Cambiar estado de usuario
    async cambiarEstadoUsuario(id, activo) {
        const [result] = await pool.execute(
            'UPDATE usuarios SET activo = ? WHERE id = ?',
            [activo, id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Usuario no encontrado');
        }

        return this.obtenerUsuarioPorId(id);
    }
}

module.exports = new AuthModel();
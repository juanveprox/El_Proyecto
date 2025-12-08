const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado o formato incorrecto'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, jwtSecret);

        // Agregar datos del usuario al request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            rol: decoded.rol
        };

        next();
    } catch (error) {
        console.error('Error de autenticación:', error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Error de autenticación'
        });
    }
};

module.exports = authMiddleware;
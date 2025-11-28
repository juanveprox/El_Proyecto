// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta 'uploads' exista
const uploadsDir = path.join(__dirname, './carpeta-archivos');;
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Verificar nuevamente por si acaso
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Tipo de archivo no permitido. Solo se aceptan PDF, Word o Excel');
        error.code = 'LIMIT_FILE_TYPES';
        return cb(error, false);
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
}).single('file');

// Middleware final
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_TYPES') {
                return res.status(400).json({ error: err.message });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' });
            }
            return res.status(500).json({ error: 'Error al subir el archivo' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No se ha seleccionado ningún archivo' });
        }

        next();
    });
};

module.exports = uploadMiddleware;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        const rutaCarpeta = path.join(__dirname, './capeta-actividades');

        if (!fs.existsSync(rutaCarpeta)) {
            fs.mkdirSync(rutaCarpeta, { recursive: true });
        }

        cb(null, rutaCarpeta);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'), false);
    }
};

const subir = multer({
    storage: almacenamiento,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Máximo 5 imágenes
    },
    fileFilter: fileFilter
});

module.exports = subir;
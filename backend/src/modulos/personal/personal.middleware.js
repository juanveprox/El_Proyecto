const multer = require('multer');
const path = require('path');
const fs = require('fs');


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '../carpeta-personal'));
//     },
//     filename: (req, file, cb) => {
//         const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//         cb(null, uniqueName);
//     }
// });

// const subir = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//     fileFilter: (req, file, cb) => {
//         const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//         if (allowedTypes.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG o PDF'));
//         }
//     }
// });

class MulterConfig {
    constructor() {
        this.carpetaDestino = path.join(__dirname, './carpeta-personal');
        this.asegurarCarpeta();
    }

    asegurarCarpeta() {
        try {
            if (!fs.existsSync(this.carpetaDestino)) {
                fs.mkdirSync(this.carpetaDestino, {
                    recursive: true,
                    mode: 0o755 // Permisos de lectura/escritura
                });
                console.log(`✅ Carpeta creada exitosamente: ${this.carpetaDestino}`);
            }

            // Verificar permisos de escritura
            fs.accessSync(this.carpetaDestino, fs.constants.W_OK);
            console.log(`📁 Carpeta lista para uso: ${this.carpetaDestino}`);

        } catch (error) {
            console.error(`❌ Error crítico con la carpeta ${this.carpetaDestino}:`, error);
            throw new Error(`No se puede acceder a la carpeta de destino: ${error.message}`);
        }
    }

    getStorage() {
        return multer.diskStorage({
            destination: (req, file, cb) => {
                try {
                    // Verificación final antes de guardar
                    if (!fs.existsSync(this.carpetaDestino)) {
                        fs.mkdirSync(this.carpetaDestino, { recursive: true });
                    }
                    cb(null, this.carpetaDestino);
                } catch (error) {
                    cb(new Error(`Error al preparar destino: ${error.message}`), null);
                }
            },
            filename: (req, file, cb) => {
                const extension = path.extname(file.originalname);
                const nombreBase = path.basename(file.originalname, extension);
                const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
                cb(null, uniqueName);
            }
        });
    }

    getFileFilter() {
        return (req, file, cb) => {
            const allowedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/pdf'
            ];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipo de archivo "${file.mimetype}" no permitido. Solo se aceptan: JPEG, JPG, PNG, PDF`), false);
            }
        };
    }
}

// Crear instancia de configuración
const multerConfig = new MulterConfig();

// Configurar Multer
const subir = multer({
    storage: multerConfig.getStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Máximo 5 archivos
    },
    fileFilter: multerConfig.getFileFilter()
});

// Manejo de errores de Multer
subir.errorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 5MB permitido.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Demasiados archivos. Máximo 10 archivos permitidos.'
            });
        }
    }

    // Para errores de tipo de archivo
    if (error.message.includes('Tipo de archivo')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

module.exports = subir;
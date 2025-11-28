

class archivosController {

    async subirArchivo(req, res) {
        console.log('📦 Body recibido:', req.body);
        console.log('📁 File recibido:', req.file);
        console.log('🔍 Headers:', req.headers);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se seleccionó ningún archivo válido'
            });
        }

        const description = req.body.description || '';

        try {
            // const uploadedFile = await FileService.uploadFile(req.file, description);

            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Archivo subido correctamente',
                file: uploadedFile
            });

        } catch (error) {
            console.error('Error al subir archivo:', error);

            let statusCode = 500;
            let message = 'Error al guardar la información del archivo en la base de datos';

            if (error.message.includes('No se seleccionó') || error.message.includes('descripción')) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }



    // console.log(req.body)
    // if (!req.archivo) {
    //     return res.status(400).json({
    //         success: false,
    //         message: 'No se seleccionó ningún archivo válido'
    //     });
    // }

    // const descripcion = req.body;

    // try {


    // } catch (error) {

    // }
}

// static async uploadFile(req, res) {
//     // Verificar si se subió un archivo




//     try {
//         const uploadedFile = await FileService.uploadFile(req.file, description);

//         // Respuesta exitosa
//         res.json({
//             success: true,
//             message: 'Archivo subido correctamente',
//             file: uploadedFile
//         });

//     } catch (error) {
//         console.error('Error al subir archivo:', error);

//         let statusCode = 500;
//         let message = 'Error al guardar la información del archivo en la base de datos';

//         if (error.message.includes('No se seleccionó') || error.message.includes('descripción')) {
//             statusCode = 400;
//             message = error.message;
//         }

//         res.status(statusCode).json({
//             success: false,
//             message: message,
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// }




module.exports = new archivosController();
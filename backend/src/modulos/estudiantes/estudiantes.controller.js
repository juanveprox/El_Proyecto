const estudianteServicio = require("./estudiantes.servicio")

class estudiantesController {

    async crearEstudiante(req, res) {
        const { estudiante, representante } = req.body;
        try {

            const resultado = await estudianteServicio.crearEstudianteBD(estudiante, representante)
            //    console.log(resultado + " estudiante-controller")

            res.status(201).json({
                success: true,
                message: resultado.representanteExistente
                    ? 'Estudiante registrado con representante existente'
                    : 'Registro completo exitoso',
                data: resultado
            });
        } catch (error) {
            res.status(error.error?.code === 'ER_DUP_ENTRY' ? 409 : 500).json(error);
        }
    }

    async eliminarEstudiante(req, res) {
        const { id } = req.params;
        try {

            const resultado = await estudianteServicio.eliminarEstudianteBD(id);

            res.status(200).json({
                success: true,
                message: 'Estudiante eliminado exitosamente',
                data: resultado
            });

        } catch (error) {
            res.status(400).json({ error: 'Error al eliminar el estudiante' });
        }
    }

    async editarEstudiante(req, res) {
        const { estudiante, representante } = req.body;
        const estudianteId = req.params.id;
        try {
            const resultado = await estudianteServicio.editarEstudianteBD(estudianteId, estudiante, representante);

            res.status(200).json({
                success: true,
                message: 'Estudiante editado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.log(error)
            if (error.message === 'ERR_DUPLICATED_CEDULA') {
                res.status(400).json({ error: 'Existe un representante con esta cédula' });
            } else if (error.message === 'ERR_DUPLICATED_EMAIL') {
                res.status(400).json({ error: 'Existe un representante con este email' });
            } else if (error.message === 'ERR_DUPLICATED_CEDULA_ESTUDIANTE') {
                res.status(400).json({ error: 'Existe un estudiante con esta cédula' });
            } else if (error.message === 'ERR_DUPLICATED_CEDULA_ESCOLAR') {
                res.status(400).json({ error: 'Existe un estudiante con esta cédula escolar' });
            } else {
                res.status(400).json({ error: 'Error al editar el estudiante' });
            }
        }
    }

    async obtenerEstudiantePorId(req, res) {
        try {
            const resultado = await estudianteServicio.obtenerEstudiantePorIdBD(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Estudiante obtenido exitosamente',
                data: resultado
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error al obtener estudiantes',
                error: error.message
            });
        }
    }

    async obtenerEstudiantePorCedulaoCiEscolar(req, res) {
        const { cedula, cedula_escolar } = req.body;
        try {

            const resultado = await estudianteServicio.obtenerEstudiantePorCedulaoCiEscolarBD(cedula, cedula_escolar)
            res.status(200).json({
                success: true,
                message: 'Estudiantes obtenido exitosamente',
                data: resultado
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error al obtener estudiante',
                error: error.message
            });
        }
    }

    async obtenerTodosEstudiantes(req, res) {
        try {

            const { page = 1, limit = 10, search, sortBy = 'apellidos', sortOrder = 'asc', exportAll } = req.query;

            const resultado = await estudianteServicio.obtenerTodosEstudiantesBD({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                exportAll
            });


            res.status(200).json({
                success: true,
                message: 'Estudiantes obtenido exitosamente',
                data: resultado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error al obtener los estudiantes',
                error: error.message
            });
        }
    }


}
module.exports = new estudiantesController();
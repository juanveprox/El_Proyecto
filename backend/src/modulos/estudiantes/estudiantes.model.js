const { pool, probarConexion } = require('../../config/baseDatos');


class estudiantesModel {

    //*Metodos del representante */
    async buscarCedulaRepresentante(cedula) {
        const [rows] = await pool.execute(
            `SELECT id FROM representantes WHERE cedula = ? LIMIT 1`,
            [cedula]
        );
        return rows;
    }

    async registrarRepresentante(conexion, representante) {
        try {
            const [resultado] = await conexion.execute(
                `INSERT INTO representantes 
            (nombres, apellidos, relacion, email, telefono, ocupacion, tipo_cedula, cedula) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    representante.nombres,
                    representante.apellidos,
                    representante.relacion,
                    representante.email,
                    representante.telefono,
                    representante.ocupacion,
                    representante.tipoCedula,
                    representante.cedula
                ]
            );

            return resultado;

        } catch (error) {
            // Log completo con contexto mínimo (no imprimir datos sensibles completos)
            try {
                console.error('(estudiantes.model) Error en registrarRepresentante - cedula:', representante && representante.cedula);
                console.error('(estudiantes.model) error.message:', error && error.message);
                console.error('(estudiantes.model) error.stack:', error && error.stack);
            } catch (logErr) {
                // En caso de fallo en el log, imprimir el error bruto
                console.error('(estudiantes.model) fallo al loggear error:', logErr);
            }

            // Manejo específico para duplicados en la columna unique (ej. cedula)
            if (error && error.code === 'ER_DUP_ENTRY') {
                try {
                    const [rows] = await pool.execute(
                        `SELECT id FROM representantes WHERE cedula = ? LIMIT 1`,
                        [representante.cedula]
                    );
                    const existingId = rows && rows.length ? rows[0].id : null;
                    const dupError = new Error('Cedula ya registrada');
                    dupError.code = 'CEDULA_DUPLICADA';
                    dupError.existingId = existingId;
                    throw dupError;
                } catch (innerSelectErr) {
                    console.error('(estudiantes.model) error al obtener id existente tras ER_DUP_ENTRY:', innerSelectErr);
                    // Si no podemos obtener el id existente, relanzamos el error original de duplicado
                    throw error;
                }
            }

            // Para otros errores, relanzamos para que el controlador decida cómo manejarlos
            throw error;
        }

    }

    async verificarRepresentante(conexion, representante) {
        const existeRepresentante = await this.buscarCedulaRepresentante(representante.cedula);

        if (existeRepresentante.length > 0) {
            console.log(`(estudiantes.model- linea 75) El representante existente con ID: ${existeRepresentante[0].id}`);
            return {
                representanteID: existeRepresentante[0].id,
                estaRegistrado: true
            };
        }

        const newRepresentante = await this.registrarRepresentante(conexion, representante);

        return {
            representanteID: newRepresentante.insertId,
            estaRegistrado: false
        };
    }

    async actualizarDatosRepresentante(conexion, representanteId, representante) {

        try {

            // Verificar duplicados antes de actualizar
            const [existeCedula] = await conexion.execute(
                `SELECT id FROM representantes WHERE cedula = ? AND id != ?`,
                [representante.cedula, representanteId]
            );

            if (existeCedula.length > 0) {
                throw new Error('ERR_DUPLICATED_CEDULA');
            }

            // Verificar email si es único
            if (representante.email) {
                const [existeEmail] = await conexion.execute(
                    `SELECT id FROM representantes WHERE email = ? AND id != ?`,
                    [representante.email, representanteId]
                );

                if (existeEmail.length > 0) {
                    throw new Error('ERR_DUPLICATED_EMAIL');
                }
            }

            const [resultado] = await conexion.execute(`UPDATE representantes SET
        nombres = ?,
        apellidos = ?,
        relacion = ?,
        email = ?,
        telefono = ?,
        ocupacion = ?,
        tipo_cedula = ?,
        cedula = ?
        WHERE id = ?`,
                [
                    representante.nombres,
                    representante.apellidos,
                    representante.relacion,
                    representante.email,
                    representante.telefono,
                    representante.ocupacion,
                    representante.tipoCedula,
                    representante.cedula,
                    representanteId
                ]
            );
            return resultado;

        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('cedula')) {
                    throw new Error('ERR_DUPLICATED_CEDULA');
                } else if (error.message.includes('email')) {
                    throw new Error('ERR_DUPLICATED_EMAIL');
                }
            }
            throw error;
        }

    }

    async obtenerIdRepresentante(conexion, estudianteId) {
        const [representanteId] = await conexion.execute(
            'SELECT representante_id FROM estudiantes WHERE id = ?',
            [estudianteId]
        );

        return representanteId.length > 0 ? representanteId[0].representante_id : null;
    }

    async eliminarRepresentanteSiNoTieneEstudiantes(conexion, representanteId) {
        const [otroEstudiante] = await conexion.query(
            'SELECT id FROM estudiantes WHERE representante_id = ?',
            [representanteId]
        );

        if (otroEstudiante.length === 0) {
            await conexion.query(
                'DELETE FROM representantes WHERE id = ?',
                [representanteId]
            );
        }
    };
    //*Auxiliares *//

    verificarDuplicadoEstudiante(existeEstudiante, estudiante) {
        if (!existeEstudiante || existeEstudiante.length === 0) return;

        const existing = existeEstudiante[0];

        const isCedula = existing.cedula && estudiante.cedula && existing.cedula === estudiante.cedula;
        const isCedulaEscolar = existing.cedula_escolar && estudiante.cedulaEscolar && existing.cedula_escolar === estudiante.cedulaEscolar;

        const duplicateField = isCedula
            ? 'estudiantes.cedula'
            : isCedulaEscolar
                ? 'estudiantes.cedula_escolar'
                : (existing.cedula ? 'estudiantes.cedula' : 'estudiantes.cedula_escolar');

        const duplicateValue = isCedula
            ? estudiante.cedula
            : isCedulaEscolar
                ? estudiante.cedulaEscolar
                : (existing.cedula || existing.cedula_escolar || null);

        const error = new Error(`Estudiante ya registrado. Campo duplicado: ${duplicateField} (${duplicateValue})`);
        error.code = 'CEDULA_DUPLICADA';
        error.sqlCode = 'ER_DUP_ENTRY';
        error.field = duplicateField;
        error.value = duplicateValue;
        error.existingId = existing.id || null;
        error.status = 409; // HTTP Conflict, useful para controladores

        throw error;
    }

    static mapeoColumnaEstudiante = {
        estudiante: 'e.*',
        representante: {
            nombres: 'r.nombres as rep_nombres',
            apellidos: 'r.apellidos as rep_apellidos',
            relacion: 'r.relacion',
            email: 'r.email',
            telefono: 'r.telefono as rep_telefono',
            ocupacion: 'r.ocupacion',
            tipoCedula: 'r.tipo_cedula as rep_tipo_cedula',
            cedula: 'r.cedula as rep_cedula',
            created_at: 'r.created_at as rep_created_at'
        }
    };

    static cotruirQueryEstudiante(buscar) {
        let encontrar

        const columns = [
            this.mapeoColumnaEstudiante.estudiante,
            ...Object.values(this.mapeoColumnaEstudiante.representante)
        ].join(', ');

        if (buscar == "id") {
            encontrar = " e.id = ?"
        } else {
            encontrar = ` e.cedula = ? OR e.cedula_escolar = ?
          LIMIT 1`
        }

        return `
        SELECT ${columns}
        FROM estudiantes e
        JOIN representantes r ON e.representante_id = r.id
        WHERE ${encontrar}`;


    }

    //*Metodos del estudiante */

    async encontrarEstudiantePorCedula(estudiante) {
        let query = '';
        let params = [];
        const cedula = (estudiante.cedula || '').toString().trim();
        const cedulaEscolar = (estudiante.cedulaEscolar || '').toString().trim();

        // Si ambos valores están presentes, buscar por cualquiera de los dos
        if (cedula && cedulaEscolar) {
            query = `SELECT id, cedula, cedula_escolar FROM estudiantes WHERE cedula = ? OR cedula_escolar = ? LIMIT 1`;
            params = [cedula, cedulaEscolar];
        } else if (!cedula && cedulaEscolar) {
            query = `SELECT id, cedula, cedula_escolar FROM estudiantes WHERE cedula_escolar = ? LIMIT 1`;
            params = [cedulaEscolar];
        } else if (cedula && !cedulaEscolar) {
            query = `SELECT id, cedula, cedula_escolar FROM estudiantes WHERE cedula = ? LIMIT 1`;
            params = [cedula];
        }

        if (query) {
            const [rows] = await pool.execute(query, params);
            return rows;
        }

        return [];
    }

    async registrarEstudiante(conexion, estudiante, representanteID) {
        console.log(estudiante)
        const [resultado] = await conexion.execute(
            `INSERT INTO estudiantes 
            (nombres, apellidos, fecha_nacimiento, genero, tipo_cedula, cedula, cedula_escolar, representante_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                estudiante.nombres,
                estudiante.apellidos,
                estudiante.fechaNacimiento,
                estudiante.genero,
                estudiante.tipoCedula || null,
                estudiante.cedula || null,
                estudiante.cedulaEscolar,
                representanteID
            ]
        );
        return resultado;
    }

    async eliminarEstudiante(conexion, estudianteId) {
        const [resultado] = await conexion.execute(
            'DELETE FROM estudiantes WHERE id = ?',
            [estudianteId]
        );
        return resultado;
    }

    async actualizarDatosEstudiante(conexion, estudianteId, estudiante) {
        try {
            const [resultado] = await conexion.execute(`UPDATE estudiantes SET
        nombres = ?,
        apellidos = ?,
        fecha_nacimiento = ?,
        genero = ?,
        tipo_cedula = ?,
        cedula = ?,
        cedula_escolar = ?
        WHERE id = ?`,
                [
                    estudiante.nombres,
                    estudiante.apellidos,
                    estudiante.fechaNacimiento,
                    estudiante.genero,
                    estudiante.tipoCedula,
                    estudiante.cedula || null,
                    estudiante.cedulaEscolar,
                    estudianteId
                ]
            );

            return resultado;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('cedula')) {
                    throw new Error('ERR_DUPLICATED_CEDULA_ESTUDIANTE');
                } else if (error.message.includes('cedula_escolar')) {
                    throw new Error('ERR_DUPLICATED_CEDULA_ESCOLAR');
                }
            }
            throw error;
        }

    }

    async obtenerEstudiantePorId(conexion, estudianteId) {
        let buscar = "id";
        const query = estudiantesModel.cotruirQueryEstudiante(buscar);
        const [rows] = await conexion.execute(query, [estudianteId]);
        return rows[0];
    }

    async obtenerEstudiantePorCedulaoCiEscolar(conexion, cedula, cedulaEscolar) {
        let buscar = "cedula";
        const query = estudiantesModel.cotruirQueryEstudiante(buscar);
        const [rows] = await conexion.execute(query, [cedula, cedulaEscolar]);
        return rows[0];
    }

    async obtenerTodosEstudiantes(filters) {
        const { page = 1, limit = 10, search, sortBy = 'apellidos', sortOrder = 'asc', exportAll } = filters;

        const finalLimit = exportAll ? 10000 : limit;
        const finalPage = exportAll ? 1 : page;
        const offset = (finalPage - 1) * finalLimit;

        // Construir consulta base
        let query = `
      SELECT 
        e.id,
        e.nombres,
        e.apellidos,
        e.cedula,
        e.cedula_escolar,
        e.genero,
        e.fecha_nacimiento,
        r.nombres as rep_nombres,
        r.apellidos as rep_apellidos,
        r.cedula as rep_cedula,
        r.telefono as rep_telefono
      FROM estudiantes e
      JOIN representantes r ON e.representante_id = r.id
    `;

        const params = [];

        // Añadir filtro de búsqueda si existe
        if (search) {
            query += `
        WHERE e.nombres LIKE ? 
        OR e.apellidos LIKE ? 
        OR e.cedula LIKE ? 
        OR e.cedula_escolar LIKE ?
        OR r.nombres LIKE ?
        OR r.apellidos LIKE ?
      `;
            const searchTerm = `%${search}%`;
            params.push(...Array(6).fill(searchTerm));
        }

        // Añadir ordenamiento
        query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;

        // Añadir paginación
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(finalLimit), parseInt(offset));

        // Ejecutar consulta
        const [students] = await pool.query(query, params);

        // Obtener conteo total para paginación
        const [total] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');

        return {
            students,
            total: total[0].total
        };
    }

}

module.exports = new estudiantesModel()
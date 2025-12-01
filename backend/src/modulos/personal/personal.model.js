const { pool } = require("../../config/baseDatos")
const fs = require('fs');
class personalModel {

    async existeCedula(cedula, conexion, excludeId = null) {
        let query = 'SELECT id FROM personal WHERE cedula = ?';
        const params = [cedula];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        //Ojo como estaba antes
        // const [rows] = await conexion.execute(query, [params]);
        const [rows] = await conexion.execute(query, params);

        return rows.length > 0;
    }

    async crearPersonal(personalData, conexion) {
        const query = `
            INSERT INTO personal 
            (tipo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
             cedula, telefono, correo, fecha_nacimiento, sexo, cargo_voucher, 
             codigo_cargo, dependencia, codigo_dependencia, carga_horaria, 
             fecha_ingreso_mppe, titulos_profesionales, tipo_titulo, 
             talla_franela, talla_pantalon, talla_zapato) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            personalData.tipo,
            personalData.primerNombre || null,
            personalData.segundoNombre || null,
            personalData.primerApellido || null,
            personalData.segundoApellido || null,
            personalData.cedula || null,
            personalData.telefono || null,
            personalData.correo || null,
            personalData.fechaNacimiento || null,
            personalData.sexo || null,
            personalData.cargoVoucher || null,
            personalData.codigoCargo || null,
            personalData.dependencia || null,
            personalData.codigoDependencia || null,
            personalData.cargaHoraria || null,
            personalData.fechaIngresoMPPE || null,
            personalData.titulosProfesionales || null,
            personalData.tipoTitulo || null,
            personalData.tallaFranela || null,
            personalData.tallaPantalon || null,
            personalData.tallaZapato || null
        ]
        const [resultado] = await conexion.execute(query, valores);
        return resultado.insertId;
    }

    async agregarArchivo(personalId, archivoData, conexion) {
        const query = `
            INSERT INTO personal_archivos
            (personal_id, nombre_archivo, ruta_archivo, tipo_archivo) 
            VALUES (?, ?, ?, ?)
        `;

        const valores = [
            personalId,
            archivoData.nombreArchivo,
            archivoData.rutaArchivo,
            archivoData.tipoArchivo
        ];

        await conexion.execute(query, valores);
    }

    async actualizarPersonal(id, datosActualizados, conexion) {
        try {
            // Filtrar campos undefined o null
            const camposValidos = Object.entries(datosActualizados)
                .filter(([_, value]) => value !== undefined && value !== null)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});

            if (Object.keys(camposValidos).length === 0) {
                return false; // No hay campos para actualizar
            }

            const setClause = Object.keys(camposValidos)
                .map(field => `${field} = ?`)
                .join(', ');

            const values = [...Object.values(camposValidos), id];

            const query = `UPDATE personal SET ${setClause} WHERE id = ?`;
            const [result] = await conexion.execute(query, values);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en modelo al actualizar personal:', error);
            throw error;
        }
    }

    async obtenerPersonalPorTipo(tipo, conexion) {
        const query = 'SELECT * FROM personal WHERE tipo = ?';
        const [rows] = await conexion.execute(query, [tipo]);
        return rows;
    }

    async obtenerDatosPersonalPorId(id, conexion) {
        const query = 'SELECT * FROM personal WHERE id = ?';
        const [rows] = await conexion.execute(query, [id]);
        return rows[0];

    }

    async obtenerArchivosPersonalPorId(personalId, conexion, archivoId = null) {
        let query = 'SELECT * FROM personal_archivos WHERE personal_id = ?';
        const params = [personalId];

        if (archivoId) {
            query += ' AND id = ?';
            params.push(archivoId);
        }

        const [rows] = await conexion.execute(query, params);
        return rows;
    }

    async eliminarArchivosPorPersonalId(id, conexion) {
        try {
            const query = `DELETE FROM personal_archivos WHERE personal_id = ?`;

            await conexion.execute(query, [id]);

        } catch (error) {
            console.error('Error en modelo al eliminar archivos:', error);
            throw error;
        }
    }

    async eliminarArchivoPorId(archivoId, conexion) {
        try {
            const query = `DELETE FROM personal_archivos WHERE id = ?`;
            const [result] = await conexion.execute(query, [archivoId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en modelo al eliminar archivo:', error);
            throw error;
        }
    }

    async eliminarPersonal(id, conexion) {
        try {
            const query = `DELETE FROM personal WHERE id = ?`;
            const [resultado] = await conexion.execute(query, [id]);
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('Error en modelo al eliminar personal:', error);
            throw error;
        }
    }

    async eliminarArchivosFisicos(archivos) {

        try {
            let archivosEliminados = 0;
            for (const archivo of archivos) {
                try {
                    if (fs.existsSync(archivo.ruta_archivo)) {
                        fs.unlinkSync(archivo.ruta_archivo);
                        archivosEliminados++;
                        console.log(`✅ Archivo eliminado: ${archivo.ruta_archivo}`);
                    }
                } catch (err) {
                    console.error(`❌ Error eliminando archivo ${archivo.ruta_archivo}:`, err);
                }
            }

            return archivosEliminados;
        } catch (error) {
            console.error('Error en modelo al eliminar archivos físicos:', error);
            throw error;
        }
    }

    async obtenerPersonalPorId(id, conexion) {
        const datosPersonales = await this.obtenerDatosPersonalPorId(id, conexion);

        if (!datosPersonales) {
            throw new Error('Personal no encontrado');
        }

        const archivosPersonales = await this.obtenerArchivosPersonalPorId(id, conexion);
        console.log(typeof archivosPersonales);
        return {
            datosPersonales,
            archivosPersonales: archivosPersonales.length > 0 ? archivosPersonales : "La persona no tiene archivos cargados"
        }
    }

    async obtenerConexion() {
        return await pool.getConnection();
    }

}

module.exports = new personalModel();
class estudiantesValidar {
    static validarDataEstudiante(estudiante) {
        const errors = [];

        if (!estudiante.nombres || estudiante.nombres.trim().length === 0) {
            errors.push('El nombre del estudiante es requerido');
        }

        if (!estudiante.apellidos || estudiante.apellidos.trim().length === 0) {
            errors.push('Los apellidos del estudiante son requeridos');
        }

        if (!estudiante.fechaNacimiento) {
            errors.push('La fecha de nacimiento es requerida');
        }

        if (!estudiante.cedula && !estudiante.cedulaEscolar) {
            errors.push('Se requiere al menos cédula o cédula escolar');
        }

        return errors;
    }

    static validarDataRepresentante(representante) {
        const errors = [];

        if (!representante.nombres || representante.nombres.trim().length === 0) {
            errors.push('El nombre del representante es requerido');
        }

        if (!representante.cedula || representante.cedula.trim().length === 0) {
            errors.push('La cédula del representante es requerida');
        }

        if (!representante.email || representante.email.trim().length === 0) {
            errors.push('El email del representante es requerido');
        }

        return errors;
    }
}

module.exports = estudiantesValidar;
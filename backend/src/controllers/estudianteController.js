const estudianteModel = require("../models/estudianteModel");
const cursoModel = require("../models/cursoModel");

/**
 * GET /api/estudiantes
 * Obtiene lista de todos los estudiantes con filtros opcionales
 */
const getAllEstudiantes = async (req, res, next) => {
  try {
    const { estado, cursoId, q, limit } = req.query;

    const estudiantes = await estudianteModel.findAll({
      estado: estado || null,
      cursoId: cursoId || null,
      q: q?.trim() || null,
      limit: limit || null,
    });

    return res.json({
      ok: true,
      message: "Estudiantes obtenidos correctamente.",
      data: estudiantes,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/estudiantes/:id
 * Obtiene los detalles de un estudiante específico
 */
const getEstudianteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de estudiante inválido.",
      });
    }

    const estudiante = await estudianteModel.findById(id);

    if (!estudiante) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado.",
      });
    }

    return res.json({
      ok: true,
      message: "Estudiante obtenido correctamente.",
      data: estudiante,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/estudiantes
 * Crea un nuevo estudiante
 */
const createEstudiante = async (req, res, next) => {
  try {
    const {
      usuarioId,
      cursoId,
      nombres,
      apellidos,
      documento,
      fechaNacimiento,
      genero,
      direccion,
      telefonoAcudiente,
      nombreAcudiente,
    } = req.body;

    // Validaciones
    if (!cursoId || !nombres || !apellidos || !documento) {
      return res.status(400).json({
        ok: false,
        message: "cursoId, nombres, apellidos y documento son obligatorios.",
      });
    }

    const curso = await cursoModel.findById(cursoId);
    if (!curso) {
      return res.status(400).json({
        ok: false,
        message: "El curso seleccionado no existe.",
      });
    }

    if (Number(curso.estudiantes_actuales) >= Number(curso.max_students)) {
      return res.status(409).json({
        ok: false,
        message: "El curso ya alcanzo su capacidad maxima de estudiantes.",
      });
    }

    // Verifica si el documento ya existe
    const estudianteExistente = await estudianteModel.findByDocumento(documento);
    if (estudianteExistente) {
      return res.status(409).json({
        ok: false,
        message: "El documento ya está registrado.",
      });
    }

    // Crea el estudiante
    const estudianteId = await estudianteModel.create({
      usuarioId: usuarioId || null,
      cursoId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      documento: documento.trim(),
      fechaNacimiento: fechaNacimiento || null,
      genero: genero || null,
      direccion: direccion?.trim() || null,
      telefonoAcudiente: telefonoAcudiente?.trim() || null,
      nombreAcudiente: nombreAcudiente?.trim() || null,
    });

    // Obtiene el estudiante creado
    const estudianteCreado = await estudianteModel.findById(estudianteId);

    return res.status(201).json({
      ok: true,
      message: "Estudiante creado correctamente.",
      data: estudianteCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/estudiantes/:id
 * Actualiza un estudiante existente
 */
const updateEstudiante = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      usuarioId,
      cursoId,
      nombres,
      apellidos,
      documento,
      fechaNacimiento,
      genero,
      direccion,
      telefonoAcudiente,
      nombreAcudiente,
      estado,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de estudiante inválido.",
      });
    }

    // Verifica que el estudiante exista
    const estudianteExistente = await estudianteModel.findById(id);
    if (!estudianteExistente) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado.",
      });
    }

    // Verifica si el documento es único (si cambió)
    if (documento && documento !== estudianteExistente.documento) {
      const otroEstudiante = await estudianteModel.findByDocumento(documento);
      if (otroEstudiante) {
        return res.status(409).json({
          ok: false,
          message: "El documento ya está registrado por otro estudiante.",
        });
      }
    }

    if (cursoId !== undefined && Number(cursoId) !== Number(estudianteExistente.curso_id)) {
      const curso = await cursoModel.findById(cursoId);
      if (!curso) {
        return res.status(400).json({
          ok: false,
          message: "El curso seleccionado no existe.",
        });
      }

      if (Number(curso.estudiantes_actuales) >= Number(curso.max_students)) {
        return res.status(409).json({
          ok: false,
          message: "El curso ya alcanzo su capacidad maxima de estudiantes.",
        });
      }
    }

    // Actualiza el estudiante
    const actualizado = await estudianteModel.update(id, {
      usuarioId: usuarioId !== undefined ? usuarioId : undefined,
      cursoId: cursoId !== undefined ? cursoId : undefined,
      nombres: nombres?.trim(),
      apellidos: apellidos?.trim(),
      documento: documento?.trim(),
      fechaNacimiento,
      genero,
      direccion: direccion?.trim() || undefined,
      telefonoAcudiente: telefonoAcudiente?.trim() || undefined,
      nombreAcudiente: nombreAcudiente?.trim() || undefined,
      estado,
    });

    if (!actualizado) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar.",
      });
    }

    // Obtiene el estudiante actualizado
    const estudianteActualizado = await estudianteModel.findById(id);

    return res.json({
      ok: true,
      message: "Estudiante actualizado correctamente.",
      data: estudianteActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/estudiantes/:id
 * Elimina un estudiante
 */
const deleteEstudiante = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de estudiante inválido.",
      });
    }

    // Verifica que el estudiante exista
    const estudianteExistente = await estudianteModel.findById(id);
    if (!estudianteExistente) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado.",
      });
    }

    // Elimina el estudiante
    const eliminado = await estudianteModel.deleteEstudiante(id);

    if (!eliminado) {
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar el estudiante.",
      });
    }

    return res.json({
      ok: true,
      message: "Estudiante eliminado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
};

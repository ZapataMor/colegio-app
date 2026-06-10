const profesorModel = require("../models/profesorModel");

/**
 * GET /api/profesores
 * Obtiene lista de todos los profesores con filtro opcional de estado
 */
const getAllProfesores = async (req, res, next) => {
  try {
    const { estado, q, limit } = req.query;

    const profesores = await profesorModel.findAll({
      estado: estado || null,
      q: q?.trim() || null,
      limit: limit || null,
    });

    return res.json({
      ok: true,
      message: "Profesores obtenidos correctamente.",
      data: profesores,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/profesores/:id
 * Obtiene los detalles de un profesor específico
 */
const getProfesorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de profesor inválido.",
      });
    }

    const profesor = await profesorModel.findById(id);

    if (!profesor) {
      return res.status(404).json({
        ok: false,
        message: "Profesor no encontrado.",
      });
    }

    return res.json({
      ok: true,
      message: "Profesor obtenido correctamente.",
      data: profesor,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/profesores
 * Crea un nuevo profesor
 */
const createProfesor = async (req, res, next) => {
  try {
    const {
      usuarioId,
      nombres,
      apellidos,
      documento,
      correo,
      telefono,
      especialidad,
    } = req.body;

    // Validaciones
    if (!nombres || !apellidos || !documento) {
      return res.status(400).json({
        ok: false,
        message: "nombres, apellidos y documento son obligatorios.",
      });
    }

    // Verifica si el documento ya existe
    const profesorExistente = await profesorModel.findByDocumento(documento);
    if (profesorExistente) {
      return res.status(409).json({
        ok: false,
        message: "El documento ya está registrado.",
      });
    }

    // Verifica si el correo ya existe (si se proporciona)
    if (correo) {
      const profesorCorreo = await profesorModel.findByCorreo(correo);
      if (profesorCorreo) {
        return res.status(409).json({
          ok: false,
          message: "El correo ya está registrado.",
        });
      }
    }

    // Crea el profesor
    const profesorId = await profesorModel.create({
      usuarioId: usuarioId || null,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      documento: documento.trim(),
      correo: correo?.trim().toLowerCase() || null,
      telefono: telefono?.trim() || null,
      especialidad: especialidad?.trim() || null,
    });

    // Obtiene el profesor creado
    const profesorCreado = await profesorModel.findById(profesorId);

    return res.status(201).json({
      ok: true,
      message: "Profesor creado correctamente.",
      data: profesorCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/profesores/:id
 * Actualiza un profesor existente
 */
const updateProfesor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      usuarioId,
      nombres,
      apellidos,
      documento,
      correo,
      telefono,
      especialidad,
      estado,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de profesor inválido.",
      });
    }

    // Verifica que el profesor exista
    const profesorExistente = await profesorModel.findById(id);
    if (!profesorExistente) {
      return res.status(404).json({
        ok: false,
        message: "Profesor no encontrado.",
      });
    }

    // Verifica si el documento es único (si cambió)
    if (documento && documento !== profesorExistente.documento) {
      const otroProfesor = await profesorModel.findByDocumento(documento);
      if (otroProfesor) {
        return res.status(409).json({
          ok: false,
          message: "El documento ya está registrado por otro profesor.",
        });
      }
    }

    // Verifica si el correo es único (si cambió)
    if (correo && correo !== profesorExistente.correo) {
      const otroProfesor = await profesorModel.findByCorreo(correo);
      if (otroProfesor) {
        return res.status(409).json({
          ok: false,
          message: "El correo ya está registrado por otro profesor.",
        });
      }
    }

    // Actualiza el profesor
    const actualizado = await profesorModel.update(id, {
      usuarioId: usuarioId !== undefined ? usuarioId : undefined,
      nombres: nombres?.trim(),
      apellidos: apellidos?.trim(),
      documento: documento?.trim(),
      correo: correo?.trim().toLowerCase(),
      telefono: telefono?.trim() || undefined,
      especialidad: especialidad?.trim() || undefined,
      estado,
    });

    if (!actualizado) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar.",
      });
    }

    // Obtiene el profesor actualizado
    const profesorActualizado = await profesorModel.findById(id);

    return res.json({
      ok: true,
      message: "Profesor actualizado correctamente.",
      data: profesorActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/profesores/:id
 * Elimina un profesor
 */
const deleteProfesor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de profesor inválido.",
      });
    }

    // Verifica que el profesor exista
    const profesorExistente = await profesorModel.findById(id);
    if (!profesorExistente) {
      return res.status(404).json({
        ok: false,
        message: "Profesor no encontrado.",
      });
    }

    // Elimina el profesor
    const eliminado = await profesorModel.deleteProfesor(id);

    if (!eliminado) {
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar el profesor.",
      });
    }

    return res.json({
      ok: true,
      message: "Profesor eliminado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllProfesores,
  getProfesorById,
  createProfesor,
  updateProfesor,
  deleteProfesor,
};

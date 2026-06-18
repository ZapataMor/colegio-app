const asistenciaModel = require("../models/asistenciaModel");

const ESTADOS = ["presente", "ausente", "excusa", "tardanza"];

const getAllAsistencias = async (req, res, next) => {
  try {
    const asistencias = await asistenciaModel.findAll({
      cursoId: req.query.cursoId || null,
      asignaturaId: req.query.asignaturaId || null,
      fecha: req.query.fecha || null,
      estudianteId: req.query.estudianteId || null,
      profesorId: req.query.profesorId || null,
      profesorPersonaId: req.query.profesorPersonaId || null,
      estadoAsistencia: req.query.estadoAsistencia || null,
      q: req.query.q?.trim() || null,
      limit: req.query.limit || null,
    });

    return res.json({
      ok: true,
      message: "Asistencias obtenidas correctamente.",
      data: asistencias,
    });
  } catch (error) {
    return next(error);
  }
};

const getAsistenciasPorCurso = async (req, res, next) => {
  try {
    // El profesor siempre se filtra por su propia identidad (derivada del token),
    // nunca por un parametro del cliente. El administrador ve todos los cursos.
    let profesorPersonaId = null;
    if (req.user?.rol === "profesor") {
      profesorPersonaId = await getPersonaIdFromRequest(req);
    }

    return res.json({
      ok: true,
      data: await asistenciaModel.findPorCurso({
        periodoId: req.query.periodoId ? Number(req.query.periodoId) : null,
        profesorPersonaId,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getPersonaIdFromRequest = async (req) => {
  if (req.user?.personaId) return req.user.personaId;
  if (!req.user?.id) return null;
  return asistenciaModel.findPersonaIdByUsuarioId(req.user.id);
};

const marcarAsistencia = async (req, res, next) => {
  try {
    if (req.user?.rol !== "profesor") {
      return res.status(403).json({
        ok: false,
        message: "Solo un profesor puede registrar asistencias desde su salon asignado.",
      });
    }

    const personaId = await getPersonaIdFromRequest(req);
    const profesor = personaId ? await asistenciaModel.findProfesorByPersonaId(personaId) : null;
    if (!profesor) {
      return res.status(403).json({
        ok: false,
        message: "Tu usuario no tiene un perfil de profesor activo asociado.",
      });
    }

    const estudianteId = Number(req.body.estudianteId);
    const cursoId = Number(req.body.cursoId);
    const asignaturaId = Number(req.body.asignaturaId);
    const fecha = req.body.fecha;
    const estadoAsistencia = req.body.estadoAsistencia;

    if (!estudianteId || !cursoId || !asignaturaId || !fecha || !estadoAsistencia) {
      return res.status(400).json({
        ok: false,
        message: "estudianteId, cursoId, asignaturaId, fecha y estadoAsistencia son obligatorios.",
      });
    }

    if (!ESTADOS.includes(estadoAsistencia)) {
      return res.status(400).json({ ok: false, message: "Estado de asistencia invalido." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      return res.status(400).json({ ok: false, message: "La fecha debe tener formato YYYY-MM-DD." });
    }

    const pertenece = await asistenciaModel.estudiantePerteneceCurso(estudianteId, cursoId);
    if (!pertenece) {
      return res.status(400).json({
        ok: false,
        message: "El estudiante no pertenece al curso indicado.",
      });
    }

    const tieneClase = await asistenciaModel.profesorTieneClase({
      profesorId: profesor.id,
      cursoId,
      asignaturaId,
    });
    if (!tieneClase) {
      return res.status(403).json({
        ok: false,
        message: "Solo puedes registrar asistencias en cursos y asignaturas que tengas asignados.",
      });
    }

    await asistenciaModel.upsert({
      estudianteId,
      cursoId,
      asignaturaId,
      profesorId: profesor.id,
      fecha,
      estadoAsistencia,
      observacion: req.body.observacion?.trim() || null,
    });

    return res.json({ ok: true, message: "Asistencia registrada correctamente." });
  } catch (error) {
    return next(error);
  }
};

const getAsistenciaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de asistencia invalido." });
    }

    const asistencia = await asistenciaModel.findById(id);
    if (!asistencia) {
      return res.status(404).json({ ok: false, message: "Asistencia no encontrada." });
    }

    return res.json({ ok: true, data: asistencia });
  } catch (error) {
    return next(error);
  }
};

const createAsistencia = async (req, res, next) => {
  try {
    const { estudianteId, cursoId, asignaturaId, profesorId, fecha, estadoAsistencia, observacion } =
      req.body;

    if (!estudianteId || !cursoId || !asignaturaId || !profesorId || !fecha || !estadoAsistencia) {
      return res.status(400).json({
        ok: false,
        message: "estudianteId, cursoId, asignaturaId, profesorId, fecha y estadoAsistencia son obligatorios.",
      });
    }

    if (!ESTADOS.includes(estadoAsistencia)) {
      return res.status(400).json({ ok: false, message: "Estado de asistencia invalido." });
    }

    const asistenciaId = await asistenciaModel.create({
      estudianteId,
      cursoId,
      asignaturaId,
      profesorId,
      fecha,
      estadoAsistencia,
      observacion: observacion?.trim() || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Asistencia registrada correctamente.",
      data: await asistenciaModel.findById(asistenciaId),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una asistencia para este estudiante, asignatura y fecha.",
      });
    }
    return next(error);
  }
};

const updateAsistencia = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de asistencia invalido." });
    }

    const current = await asistenciaModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Asistencia no encontrada." });
    }

    if (req.body.estadoAsistencia && !ESTADOS.includes(req.body.estadoAsistencia)) {
      return res.status(400).json({ ok: false, message: "Estado de asistencia invalido." });
    }

    const updated = await asistenciaModel.update(id, {
      estudianteId: req.body.estudianteId,
      cursoId: req.body.cursoId,
      asignaturaId: req.body.asignaturaId,
      profesorId: req.body.profesorId,
      fecha: req.body.fecha,
      estadoAsistencia: req.body.estadoAsistencia,
      observacion: req.body.observacion?.trim(),
    });

    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay cambios para actualizar." });
    }

    return res.json({
      ok: true,
      message: "Asistencia actualizada correctamente.",
      data: await asistenciaModel.findById(id),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una asistencia para este estudiante, asignatura y fecha.",
      });
    }
    return next(error);
  }
};

const deleteAsistencia = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de asistencia invalido." });
    }

    const current = await asistenciaModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Asistencia no encontrada." });
    }

    await asistenciaModel.deleteAsistencia(id);
    return res.json({ ok: true, message: "Asistencia eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
};

const getResumenAsistencias = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await asistenciaModel.getResumen({
        cursoId: req.query.cursoId || null,
        asignaturaId: req.query.asignaturaId || null,
        fecha: req.query.fecha || null,
        profesorPersonaId: req.query.profesorPersonaId || null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getAsistenciaCatalog = async (req, res, next) => {
  try {
    return res.json({ ok: true, data: await asistenciaModel.getCatalog() });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllAsistencias,
  getAsistenciasPorCurso,
  marcarAsistencia,
  getAsistenciaById,
  createAsistencia,
  updateAsistencia,
  deleteAsistencia,
  getResumenAsistencias,
  getAsistenciaCatalog,
};

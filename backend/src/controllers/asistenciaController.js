const asistenciaModel = require("../models/asistenciaModel");

const ESTADOS = ["presente", "ausente", "excusa", "tardanza"];

const getAllAsistencias = async (req, res, next) => {
  try {
    const asistencias = await asistenciaModel.findAll({
      cursoId: req.query.cursoId || null,
      fecha: req.query.fecha || null,
      estudianteId: req.query.estudianteId || null,
      profesorId: req.query.profesorId || null,
      profesorPersonaId: req.query.profesorPersonaId || null,
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
  getAsistenciaById,
  createAsistencia,
  updateAsistencia,
  deleteAsistencia,
  getResumenAsistencias,
  getAsistenciaCatalog,
};

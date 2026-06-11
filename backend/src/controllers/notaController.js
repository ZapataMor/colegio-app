const notaModel = require("../models/notaModel");

const getNotasPorCurso = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await notaModel.findPorCurso({
        periodoId: req.query.periodoId ? Number(req.query.periodoId) : null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getAllNotas = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await notaModel.findAll({
        q: req.query.q?.trim() || null,
        estudianteId: req.query.estudianteId ? Number(req.query.estudianteId) : null,
        cursoId: req.query.cursoId ? Number(req.query.cursoId) : null,
        asignaturaId: req.query.asignaturaId ? Number(req.query.asignaturaId) : null,
        periodoId: req.query.periodoId ? Number(req.query.periodoId) : null,
        limit: req.query.limit || null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getNotaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const nota = await notaModel.findById(id);
    if (!nota) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    return res.json({ ok: true, data: nota });
  } catch (error) {
    return next(error);
  }
};

const getNotaCatalog = async (req, res, next) => {
  try {
    return res.json({ ok: true, data: await notaModel.getCatalog() });
  } catch (error) {
    return next(error);
  }
};

const createNota = async (req, res, next) => {
  try {
    const { estudianteId, cursoId, asignaturaId, profesorId, periodoId, nota, observacion } = req.body;

    if (!estudianteId || !cursoId || !asignaturaId || !profesorId || !periodoId || nota === undefined || nota === "") {
      return res.status(400).json({
        ok: false,
        message: "estudianteId, cursoId, asignaturaId, profesorId, periodoId y nota son obligatorios.",
      });
    }

    const notaNum = Number(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      return res.status(400).json({ ok: false, message: "La nota debe ser un numero entre 0.00 y 5.00." });
    }

    const id = await notaModel.create({
      estudianteId: Number(estudianteId),
      cursoId: Number(cursoId),
      asignaturaId: Number(asignaturaId),
      profesorId: Number(profesorId),
      periodoId: Number(periodoId),
      nota: notaNum,
      observacion,
    });

    return res.status(201).json({
      ok: true,
      message: "Nota registrada correctamente.",
      data: await notaModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una nota para este estudiante, asignatura y periodo.",
      });
    }
    return next(error);
  }
};

const updateNota = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const existing = await notaModel.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    if (req.body.nota !== undefined && req.body.nota !== "") {
      const notaNum = Number(req.body.nota);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
        return res.status(400).json({ ok: false, message: "La nota debe ser un numero entre 0.00 y 5.00." });
      }
      req.body.nota = notaNum;
    }

    const updated = await notaModel.update(id, {
      estudianteId: req.body.estudianteId ? Number(req.body.estudianteId) : undefined,
      cursoId: req.body.cursoId ? Number(req.body.cursoId) : undefined,
      asignaturaId: req.body.asignaturaId ? Number(req.body.asignaturaId) : undefined,
      profesorId: req.body.profesorId ? Number(req.body.profesorId) : undefined,
      periodoId: req.body.periodoId ? Number(req.body.periodoId) : undefined,
      nota: req.body.nota,
      observacion: req.body.observacion,
    });

    if (!updated) return res.status(400).json({ ok: false, message: "No hay cambios." });

    return res.json({
      ok: true,
      message: "Nota actualizada correctamente.",
      data: await notaModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una nota para ese estudiante, asignatura y periodo.",
      });
    }
    return next(error);
  }
};

const deleteNota = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const existing = await notaModel.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    await notaModel.deleteNota(id);
    return res.json({ ok: true, message: "Nota eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllNotas, getNotaById, getNotaCatalog, getNotasPorCurso, createNota, updateNota, deleteNota };

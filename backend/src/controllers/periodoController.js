const periodoModel = require("../models/periodoModel");

const ESTADOS = ["activo", "inactivo", "cerrado"];

const getAllPeriodos = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await periodoModel.findAll({
        q: req.query.q?.trim() || null,
        estado: req.query.estado || null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getPeriodoById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const periodo = await periodoModel.findById(id);
    if (!periodo) return res.status(404).json({ ok: false, message: "Periodo no encontrado." });

    return res.json({ ok: true, data: periodo });
  } catch (error) {
    return next(error);
  }
};

const createPeriodo = async (req, res, next) => {
  try {
    const { nombre, fechaInicio, fechaFin, estado } = req.body;

    if (!nombre?.trim() || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        ok: false,
        message: "nombre, fechaInicio y fechaFin son obligatorios.",
      });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado invalido." });
    }

    const id = await periodoModel.create({ nombre, fechaInicio, fechaFin, estado });
    return res.status(201).json({
      ok: true,
      message: "Periodo creado correctamente.",
      data: await periodoModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe un periodo con ese nombre." });
    }
    return next(error);
  }
};

const updatePeriodo = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const periodo = await periodoModel.findById(id);
    if (!periodo) return res.status(404).json({ ok: false, message: "Periodo no encontrado." });

    if (req.body.estado && !ESTADOS.includes(req.body.estado)) {
      return res.status(400).json({ ok: false, message: "Estado invalido." });
    }

    const updated = await periodoModel.update(id, {
      nombre: req.body.nombre,
      fechaInicio: req.body.fechaInicio,
      fechaFin: req.body.fechaFin,
      estado: req.body.estado,
    });

    if (!updated) return res.status(400).json({ ok: false, message: "No hay cambios." });

    return res.json({
      ok: true,
      message: "Periodo actualizado correctamente.",
      data: await periodoModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe un periodo con ese nombre." });
    }
    return next(error);
  }
};

const deletePeriodo = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const periodo = await periodoModel.findById(id);
    if (!periodo) return res.status(404).json({ ok: false, message: "Periodo no encontrado." });

    await periodoModel.deletePeriodo(id);
    return res.json({ ok: true, message: "Periodo eliminado correctamente." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar: hay notas o asistencias asociadas a este periodo.",
      });
    }
    return next(error);
  }
};

module.exports = { getAllPeriodos, getPeriodoById, createPeriodo, updatePeriodo, deletePeriodo };

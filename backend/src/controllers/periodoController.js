const periodoModel = require("../models/periodoModel");

const ESTADOS = ["activo", "inactivo", "cerrado"];
const ESTADOS_ASIGNATURA = ["activo", "inactivo"];

const hasAcademicUsage = (usage) =>
  Number(usage.actividades || 0) > 0 ||
  Number(usage.notas || 0) > 0 ||
  Number(usage.asistencias || 0) > 0;

const usageMessage = (usage, action = "modificar") =>
  `No se puede ${action} la asignatura porque ya tiene registros asociados (${usage.actividades} actividades, ${usage.notas} notas, ${usage.asistencias} asistencias).`;

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

const getPeriodoAsignaturas = async (req, res, next) => {
  try {
    const periodoId = Number(req.params.id);
    if (!periodoId) return res.status(400).json({ ok: false, message: "ID invalido." });

    const periodo = await periodoModel.findById(periodoId);
    if (!periodo) return res.status(404).json({ ok: false, message: "Periodo no encontrado." });

    return res.json({
      ok: true,
      data: await periodoModel.findAsignaturas(periodoId),
    });
  } catch (error) {
    return next(error);
  }
};

const createPeriodoAsignatura = async (req, res, next) => {
  try {
    const periodoId = Number(req.params.id);
    const asignaturaId = Number(req.body.asignaturaId);
    const estado = req.body.estado || "activo";
    const observacion = req.body.observacion?.trim() || null;

    if (!periodoId) return res.status(400).json({ ok: false, message: "ID invalido." });
    if (!asignaturaId) return res.status(400).json({ ok: false, message: "La asignatura es obligatoria." });
    if (!ESTADOS_ASIGNATURA.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de asignatura invalido." });
    }

    const periodo = await periodoModel.findById(periodoId);
    if (!periodo) return res.status(404).json({ ok: false, message: "Periodo no encontrado." });

    const asignaturaExiste = await periodoModel.asignaturaExists(asignaturaId);
    if (!asignaturaExiste) {
      return res.status(400).json({ ok: false, message: "La asignatura seleccionada no existe o esta inactiva." });
    }

    const id = await periodoModel.createAsignatura({ periodoId, asignaturaId, estado, observacion });

    return res.status(201).json({
      ok: true,
      message: "Asignatura agregada al periodo correctamente.",
      data: await periodoModel.findAsignaturaById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "La asignatura ya esta agregada a este periodo." });
    }
    return next(error);
  }
};

const updatePeriodoAsignatura = async (req, res, next) => {
  try {
    const periodoId = Number(req.params.id);
    const asignaturaPeriodoId = Number(req.params.asignaturaPeriodoId);
    const asignaturaId =
      req.body.asignaturaId !== undefined ? Number(req.body.asignaturaId) : undefined;
    const estado = req.body.estado;
    const observacion = req.body.observacion !== undefined ? req.body.observacion?.trim() || null : undefined;

    if (!periodoId || !asignaturaPeriodoId) {
      return res.status(400).json({ ok: false, message: "ID invalido." });
    }

    const current = await periodoModel.findAsignaturaById(asignaturaPeriodoId);
    if (!current || Number(current.periodo_id) !== periodoId) {
      return res.status(404).json({ ok: false, message: "Asignatura del periodo no encontrada." });
    }

    if (estado !== undefined && !ESTADOS_ASIGNATURA.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de asignatura invalido." });
    }

    if (asignaturaId !== undefined && !asignaturaId) {
      return res.status(400).json({ ok: false, message: "La asignatura es obligatoria." });
    }

    if (asignaturaId !== undefined && asignaturaId !== Number(current.asignatura_id)) {
      const usage = await periodoModel.getAsignaturaUsage({
        periodoId,
        asignaturaId: current.asignatura_id,
      });
      if (hasAcademicUsage(usage)) {
        return res.status(409).json({ ok: false, message: usageMessage(usage) });
      }

      const asignaturaExiste = await periodoModel.asignaturaExists(asignaturaId);
      if (!asignaturaExiste) {
        return res.status(400).json({ ok: false, message: "La asignatura seleccionada no existe o esta inactiva." });
      }
    }

    if (estado === "inactivo" && current.estado !== "inactivo") {
      const usage = await periodoModel.getAsignaturaUsage({
        periodoId,
        asignaturaId: current.asignatura_id,
      });
      if (hasAcademicUsage(usage)) {
        return res.status(409).json({ ok: false, message: usageMessage(usage, "desactivar") });
      }
    }

    const updated = await periodoModel.updateAsignatura(asignaturaPeriodoId, {
      asignaturaId,
      estado,
      observacion,
    });

    if (!updated) return res.status(400).json({ ok: false, message: "No hay cambios." });

    return res.json({
      ok: true,
      message: "Asignatura del periodo actualizada correctamente.",
      data: await periodoModel.findAsignaturaById(asignaturaPeriodoId),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "La asignatura ya esta agregada a este periodo." });
    }
    return next(error);
  }
};

const deletePeriodoAsignatura = async (req, res, next) => {
  try {
    const periodoId = Number(req.params.id);
    const asignaturaPeriodoId = Number(req.params.asignaturaPeriodoId);

    if (!periodoId || !asignaturaPeriodoId) {
      return res.status(400).json({ ok: false, message: "ID invalido." });
    }

    const current = await periodoModel.findAsignaturaById(asignaturaPeriodoId);
    if (!current || Number(current.periodo_id) !== periodoId) {
      return res.status(404).json({ ok: false, message: "Asignatura del periodo no encontrada." });
    }

    const usage = await periodoModel.getAsignaturaUsage({
      periodoId,
      asignaturaId: current.asignatura_id,
    });
    if (hasAcademicUsage(usage)) {
      return res.status(409).json({ ok: false, message: usageMessage(usage, "eliminar") });
    }

    await periodoModel.deleteAsignatura(asignaturaPeriodoId);

    return res.json({ ok: true, message: "Asignatura eliminada del periodo correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPeriodo,
  createPeriodoAsignatura,
  deletePeriodo,
  deletePeriodoAsignatura,
  getAllPeriodos,
  getPeriodoAsignaturas,
  getPeriodoById,
  updatePeriodo,
  updatePeriodoAsignatura,
};

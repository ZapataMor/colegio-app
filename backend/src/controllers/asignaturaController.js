const asignaturaModel = require("../models/asignaturaModel");

const ESTADOS_VALIDOS = ["activo", "inactivo"];

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getAllAsignaturas = async (req, res, next) => {
  try {
    const asignaturas = await asignaturaModel.findAll({
      q: req.query.q?.trim() || null,
      estado: req.query.estado || null,
      areaId: req.query.areaId ? Number(req.query.areaId) : null,
    });
    return res.json({ ok: true, data: asignaturas });
  } catch (error) {
    return next(error);
  }
};

const getAreas = async (req, res, next) => {
  try {
    const areas = await asignaturaModel.listAreas();
    return res.json({ ok: true, data: areas });
  } catch (error) {
    return next(error);
  }
};

const getAsignaturaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de asignatura invalido." });
    }

    const asignatura = await asignaturaModel.findById(id);
    if (!asignatura) {
      return res.status(404).json({ ok: false, message: "Asignatura no encontrada." });
    }

    return res.json({ ok: true, data: asignatura });
  } catch (error) {
    return next(error);
  }
};

const createAsignatura = async (req, res, next) => {
  try {
    const { areaId, area_id, nombre, descripcion, estado = "activo" } = req.body;

    const cleanNombre = nombre?.trim();
    if (!cleanNombre) {
      return res.status(400).json({ ok: false, message: "El nombre de la asignatura es obligatorio." });
    }

    const targetAreaId = parsePositiveInteger(areaId ?? area_id);
    if (!targetAreaId) {
      return res.status(400).json({ ok: false, message: "El area es obligatoria." });
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de asignatura invalido." });
    }

    if (!(await asignaturaModel.areaExists(targetAreaId))) {
      return res.status(400).json({ ok: false, message: "El area seleccionada no existe." });
    }

    if (await asignaturaModel.findByNombre(cleanNombre)) {
      return res.status(409).json({ ok: false, message: "Ya existe una asignatura con ese nombre." });
    }

    const id = await asignaturaModel.create({
      areaId: targetAreaId,
      nombre: cleanNombre,
      descripcion: descripcion?.trim() || null,
      estado,
    });

    const asignatura = await asignaturaModel.findById(id);
    return res.status(201).json({ ok: true, message: "Asignatura creada correctamente.", data: asignatura });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe una asignatura con ese nombre." });
    }
    return next(error);
  }
};

const updateAsignatura = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { areaId, area_id, nombre, descripcion, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de asignatura invalido." });
    }

    const existente = await asignaturaModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Asignatura no encontrada." });
    }

    const data = {};

    if (areaId !== undefined || area_id !== undefined) {
      const targetAreaId = parsePositiveInteger(areaId ?? area_id);
      if (!targetAreaId || !(await asignaturaModel.areaExists(targetAreaId))) {
        return res.status(400).json({ ok: false, message: "El area seleccionada no existe." });
      }
      data.areaId = targetAreaId;
    }

    if (nombre !== undefined) {
      const cleanNombre = String(nombre).trim();
      if (!cleanNombre) {
        return res.status(400).json({ ok: false, message: "El nombre de la asignatura es obligatorio." });
      }
      if (await asignaturaModel.findByNombre(cleanNombre, Number(id))) {
        return res.status(409).json({ ok: false, message: "Ya existe una asignatura con ese nombre." });
      }
      data.nombre = cleanNombre;
    }

    if (descripcion !== undefined) {
      data.descripcion = descripcion ? String(descripcion).trim() : null;
    }

    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ ok: false, message: "Estado de asignatura invalido." });
      }
      data.estado = estado;
    }

    const updated = await asignaturaModel.update(id, data);
    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar." });
    }

    const asignatura = await asignaturaModel.findById(id);
    return res.json({ ok: true, message: "Asignatura actualizada correctamente.", data: asignatura });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe una asignatura con ese nombre." });
    }
    return next(error);
  }
};

const deleteAsignatura = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de asignatura invalido." });
    }

    const existente = await asignaturaModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Asignatura no encontrada." });
    }

    const referencias = await asignaturaModel.countReferences(id);
    if (referencias > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar una asignatura en uso (horarios, notas u otros registros). Puedes desactivarla.",
      });
    }

    await asignaturaModel.deleteAsignatura(id);
    return res.json({ ok: true, message: "Asignatura eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllAsignaturas,
  getAreas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura,
};

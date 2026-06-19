const areaModel = require("../models/areaModel");

const ESTADOS_VALIDOS = ["activo", "inactivo"];

const getAllAreas = async (req, res, next) => {
  try {
    const areas = await areaModel.findAll({
      q: req.query.q?.trim() || null,
      estado: req.query.estado || null,
    });
    return res.json({ ok: true, data: areas });
  } catch (error) {
    return next(error);
  }
};

const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de area invalido." });
    }

    const area = await areaModel.findById(id);
    if (!area) {
      return res.status(404).json({ ok: false, message: "Area no encontrada." });
    }

    return res.json({ ok: true, data: area });
  } catch (error) {
    return next(error);
  }
};

const createArea = async (req, res, next) => {
  try {
    const { nombre, descripcion, estado = "activo" } = req.body;

    const cleanNombre = nombre?.trim();
    if (!cleanNombre) {
      return res.status(400).json({ ok: false, message: "El nombre del area es obligatorio." });
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de area invalido." });
    }

    if (await areaModel.findByNombre(cleanNombre)) {
      return res.status(409).json({ ok: false, message: "Ya existe un area con ese nombre." });
    }

    const id = await areaModel.create({
      nombre: cleanNombre,
      descripcion: descripcion?.trim() || null,
      estado,
    });

    const area = await areaModel.findById(id);
    return res.status(201).json({ ok: true, message: "Area creada correctamente.", data: area });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe un area con ese nombre." });
    }
    return next(error);
  }
};

const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de area invalido." });
    }

    const existente = await areaModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Area no encontrada." });
    }

    const data = {};

    if (nombre !== undefined) {
      const cleanNombre = String(nombre).trim();
      if (!cleanNombre) {
        return res.status(400).json({ ok: false, message: "El nombre del area es obligatorio." });
      }
      if (await areaModel.findByNombre(cleanNombre, Number(id))) {
        return res.status(409).json({ ok: false, message: "Ya existe un area con ese nombre." });
      }
      data.nombre = cleanNombre;
    }

    if (descripcion !== undefined) {
      data.descripcion = descripcion ? String(descripcion).trim() : null;
    }

    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ ok: false, message: "Estado de area invalido." });
      }
      data.estado = estado;
    }

    const updated = await areaModel.update(id, data);
    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar." });
    }

    const area = await areaModel.findById(id);
    return res.json({ ok: true, message: "Area actualizada correctamente.", data: area });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, message: "Ya existe un area con ese nombre." });
    }
    return next(error);
  }
};

const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de area invalido." });
    }

    const existente = await areaModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Area no encontrada." });
    }

    const referencias = await areaModel.countReferences(id);
    if (referencias > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar un area con asignaturas asociadas. Puedes desactivarla.",
      });
    }

    await areaModel.deleteArea(id);
    return res.json({ ok: true, message: "Area eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};

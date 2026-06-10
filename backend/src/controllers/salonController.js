const salonModel = require("../models/salonModel");

const ESTADOS_VALIDOS = ["activo", "inactivo", "mantenimiento"];

const getAllSalones = async (req, res, next) => {
  try {
    const salones = await salonModel.findAll(req.query.estado || null);
    return res.json({ ok: true, data: salones });
  } catch (error) {
    return next(error);
  }
};

const getSalonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de salon invalido." });
    }

    const salon = await salonModel.findById(id);
    if (!salon) {
      return res.status(404).json({ ok: false, message: "Salon no encontrado." });
    }

    return res.json({ ok: true, data: salon });
  } catch (error) {
    return next(error);
  }
};

const createSalon = async (req, res, next) => {
  try {
    const { nombre, ubicacion, capacidad, estado = "activo" } = req.body;
    const capacidadNum = Number(capacidad);

    if (!nombre || isNaN(capacidadNum) || capacidadNum < 0) {
      return res.status(400).json({ ok: false, message: "Nombre y capacidad valida son obligatorios." });
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de salon invalido." });
    }

    const id = await salonModel.create({
      nombre: nombre.trim(),
      ubicacion: ubicacion?.trim() || null,
      capacidad: capacidadNum,
      estado,
    });

    const salon = await salonModel.findById(id);
    return res.status(201).json({ ok: true, message: "Salon creado correctamente.", data: salon });
  } catch (error) {
    return next(error);
  }
};

const updateSalon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, ubicacion, capacidad, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de salon invalido." });
    }

    const existente = await salonModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Salon no encontrado." });
    }

    const data = {};
    if (nombre !== undefined) data.nombre = String(nombre).trim();
    if (ubicacion !== undefined) data.ubicacion = ubicacion ? String(ubicacion).trim() : null;
    if (capacidad !== undefined) {
      const capacidadNum = Number(capacidad);
      if (isNaN(capacidadNum) || capacidadNum < 0) {
        return res.status(400).json({ ok: false, message: "Capacidad invalida." });
      }
      data.capacidad = capacidadNum;
    }
    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ ok: false, message: "Estado de salon invalido." });
      }
      data.estado = estado;
    }

    const updated = await salonModel.update(id, data);
    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar." });
    }

    const salon = await salonModel.findById(id);
    return res.json({ ok: true, message: "Salon actualizado correctamente.", data: salon });
  } catch (error) {
    return next(error);
  }
};

const deleteSalon = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de salon invalido." });
    }

    const existente = await salonModel.findById(id);
    if (!existente) {
      return res.status(404).json({ ok: false, message: "Salon no encontrado." });
    }

    await salonModel.deleteSalon(id);
    return res.json({ ok: true, message: "Salon eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSalon,
  deleteSalon,
  getAllSalones,
  getSalonById,
  updateSalon,
};

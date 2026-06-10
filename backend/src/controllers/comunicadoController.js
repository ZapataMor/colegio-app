const comunicadoModel = require("../models/comunicadoModel");

const PRIORIDADES = ["baja", "media", "alta", "urgente"];
const AUDIENCIAS = ["todos", "administrador", "profesor", "estudiante", "acudiente"];
const ESTADOS = ["borrador", "publicado", "archivado"];

const getAllComunicados = async (req, res, next) => {
  try {
    const comunicados = await comunicadoModel.findAll({
      audiencia: req.query.audiencia || null,
      cursoId: req.query.cursoId || null,
      estado: req.query.estado || null,
      q: req.query.q?.trim() || null,
      prioridad: req.query.prioridad || null,
      limit: req.query.limit || 50,
    });

    return res.json({
      ok: true,
      message: "Comunicados obtenidos correctamente.",
      data: comunicados,
    });
  } catch (error) {
    return next(error);
  }
};

const getComunicadoById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de comunicado invalido." });
    }

    const comunicado = await comunicadoModel.findById(id);
    if (!comunicado) {
      return res.status(404).json({ ok: false, message: "Comunicado no encontrado." });
    }

    return res.json({ ok: true, data: comunicado });
  } catch (error) {
    return next(error);
  }
};

const createComunicado = async (req, res, next) => {
  try {
    const {
      titulo,
      resumen,
      contenido,
      prioridad,
      audiencia,
      cursoId,
      publicadoPorPersonaId,
      fechaPublicacion,
      fechaExpiracion,
      estado,
    } = req.body;

    if (!titulo?.trim() || !contenido?.trim()) {
      return res.status(400).json({ ok: false, message: "Titulo y contenido son obligatorios." });
    }

    if (prioridad && !PRIORIDADES.includes(prioridad)) {
      return res.status(400).json({ ok: false, message: "Prioridad invalida." });
    }

    if (audiencia && !AUDIENCIAS.includes(audiencia)) {
      return res.status(400).json({ ok: false, message: "Audiencia invalida." });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado invalido." });
    }

    const comunicadoId = await comunicadoModel.create({
      titulo: titulo.trim(),
      resumen: resumen?.trim() || null,
      contenido: contenido.trim(),
      prioridad,
      audiencia,
      cursoId,
      publicadoPorPersonaId,
      fechaPublicacion: fechaPublicacion || undefined,
      fechaExpiracion: fechaExpiracion || null,
      estado,
    });

    return res.status(201).json({
      ok: true,
      message: "Comunicado creado correctamente.",
      data: await comunicadoModel.findById(comunicadoId),
    });
  } catch (error) {
    return next(error);
  }
};

const updateComunicado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de comunicado invalido." });
    }

    const current = await comunicadoModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Comunicado no encontrado." });
    }

    if (req.body.prioridad && !PRIORIDADES.includes(req.body.prioridad)) {
      return res.status(400).json({ ok: false, message: "Prioridad invalida." });
    }

    if (req.body.audiencia && !AUDIENCIAS.includes(req.body.audiencia)) {
      return res.status(400).json({ ok: false, message: "Audiencia invalida." });
    }

    if (req.body.estado && !ESTADOS.includes(req.body.estado)) {
      return res.status(400).json({ ok: false, message: "Estado invalido." });
    }

    const updated = await comunicadoModel.update(id, {
      titulo: req.body.titulo?.trim(),
      resumen: req.body.resumen?.trim(),
      contenido: req.body.contenido?.trim(),
      prioridad: req.body.prioridad,
      audiencia: req.body.audiencia,
      cursoId: req.body.cursoId,
      publicadoPorPersonaId: req.body.publicadoPorPersonaId,
      fechaPublicacion: req.body.fechaPublicacion,
      fechaExpiracion: req.body.fechaExpiracion,
      estado: req.body.estado,
    });

    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay cambios para actualizar." });
    }

    return res.json({
      ok: true,
      message: "Comunicado actualizado correctamente.",
      data: await comunicadoModel.findById(id),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteComunicado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de comunicado invalido." });
    }

    const current = await comunicadoModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Comunicado no encontrado." });
    }

    await comunicadoModel.deleteComunicado(id);
    return res.json({ ok: true, message: "Comunicado eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

const getComunicadoCatalog = async (req, res, next) => {
  try {
    return res.json({ ok: true, data: await comunicadoModel.getCatalog() });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllComunicados,
  getComunicadoById,
  createComunicado,
  updateComunicado,
  deleteComunicado,
  getComunicadoCatalog,
};

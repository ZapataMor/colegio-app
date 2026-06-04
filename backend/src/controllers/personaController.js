const personaModel = require("../models/personaModel");

const getAllPersonas = async (req, res, next) => {
  try {
    const { estado } = req.query;
    const personas = await personaModel.findAll(estado || null);

    return res.json({
      ok: true,
      message: "Personas obtenidas correctamente.",
      data: personas,
    });
  } catch (error) {
    return next(error);
  }
};

const getPersonaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de persona inválido." });
    }

    const persona = await personaModel.findById(id);

    if (!persona) {
      return res.status(404).json({ ok: false, message: "Persona no encontrada." });
    }

    return res.json({
      ok: true,
      data: persona,
    });
  } catch (error) {
    return next(error);
  }
};

const getDisponiblesParaUsuario = async (req, res, next) => {
  try {
    const { rol } = req.query;
    const rolesValidos = ["administrador", "profesor", "estudiante", "acudiente"];

    if (!rol || !rolesValidos.includes(rol)) {
      return res.status(400).json({
        ok: false,
        message: "Query rol es obligatorio: administrador, profesor, estudiante o acudiente.",
      });
    }

    const personas = await personaModel.findDisponiblesParaUsuario(rol);

    return res.json({
      ok: true,
      message: "Personas disponibles obtenidas correctamente.",
      data: personas,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllPersonas,
  getPersonaById,
  getDisponiblesParaUsuario,
};

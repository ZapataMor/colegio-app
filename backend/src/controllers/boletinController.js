const boletinModel = require("../models/boletinModel");

const getBoletinCatalog = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await boletinModel.findCatalog(),
    });
  } catch (error) {
    return next(error);
  }
};

const getBoletinByStudent = async (req, res, next) => {
  try {
    const estudianteId = Number(req.params.estudianteId);
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;

    if (!estudianteId) {
      return res.status(400).json({
        ok: false,
        message: "ID de estudiante invalido.",
      });
    }

    return res.json({
      ok: true,
      data: await boletinModel.buildBoletin(estudianteId, periodoId),
    });
  } catch (error) {
    return next(error);
  }
};

const generateBoletinesByCourse = async (req, res, next) => {
  try {
    const cursoId = Number(req.body.cursoId);
    const periodoId = req.body.periodoId ? Number(req.body.periodoId) : null;

    if (!cursoId) {
      return res.status(400).json({
        ok: false,
        message: "ID de salon invalido.",
      });
    }

    return res.json({
      ok: true,
      message: "Boletines generados correctamente.",
      data: await boletinModel.generateByCourse(cursoId, periodoId),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getBoletinCatalog,
  getBoletinByStudent,
  generateBoletinesByCourse,
};

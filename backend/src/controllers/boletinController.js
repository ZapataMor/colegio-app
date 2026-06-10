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

module.exports = {
  getBoletinCatalog,
  getBoletinByStudent,
};

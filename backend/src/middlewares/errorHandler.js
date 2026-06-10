const errorHandler = (error, req, res, next) => {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message || "Error interno del servidor.",
  });
};

module.exports = errorHandler;

const pool = require("../config/db");

const getRoles = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion FROM roles ORDER BY nombre ASC"
    );

    return res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRoles,
};

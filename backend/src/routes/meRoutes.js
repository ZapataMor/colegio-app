const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Devuelve el estudiante_id y acudiente_id del usuario autenticado (si aplica)
router.get("/api/me", async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const [userRows] = await pool.query(
      `SELECT u.persona_id FROM usuarios u WHERE u.id = ? LIMIT 1`,
      [usuarioId]
    );

    if (!userRows[0]) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const personaId = userRows[0].persona_id;

    const [estudianteRows] = await pool.query(
      `SELECT e.id AS estudiante_id, e.curso_id, c.nombre AS curso_nombre
       FROM estudiantes e
       INNER JOIN cursos c ON c.id = e.curso_id
       WHERE e.persona_id = ? LIMIT 1`,
      [personaId]
    );

    const [acudienteRows] = await pool.query(
      `SELECT a.id AS acudiente_id FROM acudientes a WHERE a.persona_id = ? LIMIT 1`,
      [personaId]
    );

    const [acudidosRows] = estudianteRows.length ? [[], null] : await pool.query(
      `SELECT ea.estudiante_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre, ea.parentesco
       FROM estudiante_acudiente ea
       INNER JOIN acudientes ac ON ac.id = ea.acudiente_id
       INNER JOIN estudiantes e ON e.id = ea.estudiante_id
       INNER JOIN personas p ON p.id = e.persona_id
       WHERE ac.persona_id = ?
       ORDER BY ea.es_principal DESC`,
      [personaId]
    );

    return res.json({
      ok: true,
      data: {
        personaId,
        estudianteId: estudianteRows[0]?.estudiante_id || null,
        cursoId: estudianteRows[0]?.curso_id || null,
        cursoNombre: estudianteRows[0]?.curso_nombre || null,
        acudienteId: acudienteRows[0]?.acudiente_id || null,
        acudidos: acudidosRows || [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

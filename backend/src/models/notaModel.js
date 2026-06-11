const pool = require("../config/db");

const findAll = async ({ q = null, estudianteId = null, cursoId = null, asignaturaId = null, periodoId = null, limit = null } = {}) => {
  const conditions = [];
  const params = [];

  if (estudianteId) { conditions.push("n.estudiante_id = ?"); params.push(estudianteId); }
  if (cursoId) { conditions.push("n.curso_id = ?"); params.push(cursoId); }
  if (asignaturaId) { conditions.push("n.asignatura_id = ?"); params.push(asignaturaId); }
  if (periodoId) { conditions.push("n.periodo_id = ?"); params.push(periodoId); }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(CONCAT(p.nombres, ' ', p.apellidos) LIKE ? OR p.documento LIKE ? OR a.nombre LIKE ?)`);
    params.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let sql = `SELECT
    n.id,
    n.nota,
    n.observacion,
    n.fecha_registro,
    n.estudiante_id,
    n.curso_id,
    n.asignatura_id,
    n.profesor_id,
    n.periodo_id,
    CONCAT(p.nombres, ' ', p.apellidos) AS estudiante_nombre,
    p.documento AS estudiante_documento,
    c.nombre AS curso_nombre,
    a.nombre AS asignatura_nombre,
    CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre,
    per.nombre AS periodo_nombre
  FROM notas n
  INNER JOIN estudiantes e ON e.id = n.estudiante_id
  INNER JOIN personas p ON p.id = e.persona_id
  INNER JOIN cursos c ON c.id = n.curso_id
  INNER JOIN asignaturas a ON a.id = n.asignatura_id
  INNER JOIN profesores pr ON pr.id = n.profesor_id
  INNER JOIN personas pp ON pp.id = pr.persona_id
  INNER JOIN periodos_academicos per ON per.id = n.periodo_id
  ${where}
  ORDER BY per.nombre DESC, p.apellidos ASC, a.nombre ASC`;

  if (limit) { sql += ` LIMIT ?`; params.push(Number(limit)); }

  const [rows] = await pool.query(sql, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT n.id, n.nota, n.observacion, n.fecha_registro,
      n.estudiante_id, n.curso_id, n.asignatura_id, n.profesor_id, n.periodo_id,
      CONCAT(p.nombres, ' ', p.apellidos) AS estudiante_nombre,
      c.nombre AS curso_nombre,
      a.nombre AS asignatura_nombre,
      CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre,
      per.nombre AS periodo_nombre
    FROM notas n
    INNER JOIN estudiantes e ON e.id = n.estudiante_id
    INNER JOIN personas p ON p.id = e.persona_id
    INNER JOIN cursos c ON c.id = n.curso_id
    INNER JOIN asignaturas a ON a.id = n.asignatura_id
    INNER JOIN profesores pr ON pr.id = n.profesor_id
    INNER JOIN personas pp ON pp.id = pr.persona_id
    INNER JOIN periodos_academicos per ON per.id = n.periodo_id
    WHERE n.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const getCatalog = async ({ profesorPersonaId = null } = {}) => {
  const [estudiantes] = await pool.query(
    `SELECT e.id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre, p.documento, c.nombre AS curso_nombre, e.curso_id
     FROM estudiantes e
     INNER JOIN personas p ON p.id = e.persona_id
     INNER JOIN cursos c ON c.id = e.curso_id
     WHERE e.estado = 'activo'
     ORDER BY p.apellidos, p.nombres ASC`
  );

  const [asignaturas] = profesorPersonaId
    ? await pool.query(
        `SELECT DISTINCT a.id, a.nombre, h.curso_id
         FROM horarios h
         INNER JOIN profesores pr ON pr.id = h.profesor_id
         INNER JOIN asignaturas a ON a.id = h.asignatura_id
         WHERE pr.persona_id = ? AND h.estado = 'activo' AND a.estado = 'activo'
         ORDER BY a.nombre ASC`,
        [profesorPersonaId]
      )
    : await pool.query(
        `SELECT id, nombre FROM asignaturas WHERE estado = 'activo' ORDER BY nombre ASC`
      );

  const [profesores] = profesorPersonaId
    ? await pool.query(
        `SELECT pr.id, pr.persona_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
         FROM profesores pr
         INNER JOIN personas p ON p.id = pr.persona_id
         WHERE pr.estado = 'activo' AND pr.persona_id = ?
         ORDER BY p.apellidos, p.nombres ASC`,
        [profesorPersonaId]
      )
    : await pool.query(
        `SELECT pr.id, pr.persona_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
         FROM profesores pr
         INNER JOIN personas p ON p.id = pr.persona_id
         WHERE pr.estado = 'activo'
         ORDER BY p.apellidos, p.nombres ASC`
      );

  const [periodos] = await pool.query(
    `SELECT id, nombre, estado FROM periodos_academicos ORDER BY fecha_inicio DESC`
  );

  const [cursos] = await pool.query(
    `SELECT id, nombre FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
  );

  return { estudiantes, asignaturas, profesores, periodos, cursos };
};

const create = async ({ estudianteId, cursoId, asignaturaId, profesorId, periodoId, nota, observacion }) => {
  const [result] = await pool.query(
    `INSERT INTO notas (estudiante_id, curso_id, asignatura_id, profesor_id, periodo_id, nota, observacion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [estudianteId, cursoId, asignaturaId, profesorId, periodoId, nota, observacion || null]
  );
  return result.insertId;
};

const update = async (id, { estudianteId, cursoId, asignaturaId, profesorId, periodoId, nota, observacion }) => {
  const fields = [];
  const params = [];

  if (estudianteId !== undefined) { fields.push("estudiante_id = ?"); params.push(estudianteId); }
  if (cursoId !== undefined) { fields.push("curso_id = ?"); params.push(cursoId); }
  if (asignaturaId !== undefined) { fields.push("asignatura_id = ?"); params.push(asignaturaId); }
  if (profesorId !== undefined) { fields.push("profesor_id = ?"); params.push(profesorId); }
  if (periodoId !== undefined) { fields.push("periodo_id = ?"); params.push(periodoId); }
  if (nota !== undefined) { fields.push("nota = ?"); params.push(nota); }
  if (observacion !== undefined) { fields.push("observacion = ?"); params.push(observacion?.trim() || null); }

  if (!fields.length) return null;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE notas SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
  return result.affectedRows > 0;
};

const deleteNota = async (id) => {
  const [result] = await pool.query(`DELETE FROM notas WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const findProfesorByPersonaId = async (personaId) => {
  const [rows] = await pool.query(
    `SELECT id, persona_id FROM profesores WHERE persona_id = ? AND estado = 'activo' LIMIT 1`,
    [personaId]
  );
  return rows[0] || null;
};

const findPersonaIdByUsuarioId = async (usuarioId) => {
  const [rows] = await pool.query(
    `SELECT persona_id FROM usuarios WHERE id = ? LIMIT 1`,
    [usuarioId]
  );
  return rows[0]?.persona_id || null;
};

const estudiantePerteneceCurso = async (estudianteId, cursoId) => {
  const [rows] = await pool.query(
    `SELECT id FROM estudiantes WHERE id = ? AND curso_id = ? AND estado = 'activo' LIMIT 1`,
    [estudianteId, cursoId]
  );
  return Boolean(rows[0]);
};

const profesorTieneClase = async ({ profesorId, cursoId, asignaturaId }) => {
  const [rows] = await pool.query(
    `SELECT id
     FROM horarios
     WHERE profesor_id = ? AND curso_id = ? AND asignatura_id = ? AND estado = 'activo'
     LIMIT 1`,
    [profesorId, cursoId, asignaturaId]
  );
  return Boolean(rows[0]);
};

const findPorCurso = async ({ periodoId = null, profesorPersonaId = null } = {}) => {
  // Query 1: cursos activos con sus estudiantes activos
  const cursoParams = [];
  const profesorCursoJoin = profesorPersonaId
    ? `INNER JOIN (
        SELECT DISTINCT h.curso_id
        FROM horarios h
        INNER JOIN profesores pr ON pr.id = h.profesor_id
        WHERE pr.persona_id = ? AND h.estado = 'activo'
      ) cursos_profesor ON cursos_profesor.curso_id = c.id`
    : "";

  if (profesorPersonaId) cursoParams.push(profesorPersonaId);

  const [filas] = await pool.query(
    `SELECT
      c.id   AS curso_id,
      c.nombre AS curso_nombre,
      e.id   AS estudiante_id,
      CONCAT(p.nombres, ' ', p.apellidos) AS estudiante_nombre,
      p.documento
    FROM cursos c
    ${profesorCursoJoin}
    LEFT JOIN estudiantes e ON e.curso_id = c.id AND e.estado = 'activo'
    LEFT JOIN personas p ON p.id = e.persona_id
    WHERE c.estado = 'activo'
    ORDER BY c.nombre ASC, p.apellidos ASC, p.nombres ASC`,
    cursoParams
  );

  // Query 2: todas las notas (filtradas por periodo si se indica)
  const notasParams = [];
  let notasWhere = "";
  if (periodoId) {
    notasWhere = "WHERE n.periodo_id = ?";
    notasParams.push(periodoId);
  }

  if (profesorPersonaId) {
    notasWhere += notasWhere ? " AND pr.persona_id = ?" : "WHERE pr.persona_id = ?";
    notasParams.push(profesorPersonaId);
  }

  const [notasRows] = await pool.query(
    `SELECT
      n.id          AS nota_id,
      n.estudiante_id,
      n.curso_id,
      n.asignatura_id,
      n.profesor_id,
      n.periodo_id,
      n.nota,
      n.observacion,
      a.nombre      AS asignatura,
      CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor,
      per.nombre    AS periodo
    FROM notas n
    INNER JOIN asignaturas a  ON a.id  = n.asignatura_id
    INNER JOIN profesores pr  ON pr.id = n.profesor_id
    INNER JOIN personas pp    ON pp.id = pr.persona_id
    INNER JOIN periodos_academicos per ON per.id = n.periodo_id
    ${notasWhere}
    ORDER BY n.estudiante_id ASC, a.nombre ASC`,
    notasParams
  );

  // Indexar notas por estudiante_id
  const notasPorEstudiante = {};
  for (const n of notasRows) {
    if (!notasPorEstudiante[n.estudiante_id]) notasPorEstudiante[n.estudiante_id] = [];
    notasPorEstudiante[n.estudiante_id].push({
      notaId: n.nota_id,
      asignatura: n.asignatura,
      asignaturaId: n.asignatura_id,
      profesor: n.profesor,
      profesorId: n.profesor_id,
      periodo: n.periodo,
      periodoId: n.periodo_id,
      nota: Number(n.nota),
      observacion: n.observacion ?? null,
    });
  }

  // Agrupar por curso
  const cursosMap = new Map();
  for (const fila of filas) {
    if (!cursosMap.has(fila.curso_id)) {
      cursosMap.set(fila.curso_id, {
        cursoId: fila.curso_id,
        cursoNombre: fila.curso_nombre,
        estudiantes: [],
      });
    }
    if (fila.estudiante_id) {
      cursosMap.get(fila.curso_id).estudiantes.push({
        estudianteId: fila.estudiante_id,
        estudianteNombre: fila.estudiante_nombre,
        documento: fila.documento,
        notas: notasPorEstudiante[fila.estudiante_id] ?? [],
      });
    }
  }

  return Array.from(cursosMap.values());
};

module.exports = {
  findAll,
  findById,
  getCatalog,
  findPorCurso,
  findProfesorByPersonaId,
  findPersonaIdByUsuarioId,
  estudiantePerteneceCurso,
  profesorTieneClase,
  create,
  update,
  deleteNota,
};

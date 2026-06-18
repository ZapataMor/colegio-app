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
  if (!profesorPersonaId) {
    const [estudiantes] = await pool.query(
      `SELECT e.id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre, p.documento, c.nombre AS curso_nombre, e.curso_id
       FROM estudiantes e
       INNER JOIN personas p ON p.id = e.persona_id
       INNER JOIN cursos c ON c.id = e.curso_id
       WHERE e.estado = 'activo'
       ORDER BY p.apellidos, p.nombres ASC`
    );

    const [asignaturas] = await pool.query(
      `SELECT id, nombre FROM asignaturas WHERE estado = 'activo' ORDER BY nombre ASC`
    );

    const [profesores] = await pool.query(
      `SELECT pr.id, pr.persona_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
       FROM profesores pr
       INNER JOIN personas p ON p.id = pr.persona_id
       WHERE pr.estado = 'activo'
       ORDER BY p.apellidos, p.nombres ASC`
    );

    const [periodos] = await pool.query(
      `SELECT id, nombre, fecha_inicio, fecha_fin, estado
       FROM periodos_academicos
       ORDER BY fecha_inicio DESC`
    );

    const [cursos] = await pool.query(
      `SELECT id, nombre FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
    );

    return { estudiantes, asignaturas, profesores, periodos, cursos };
  }

  const params = [];
  const profesorJoinFilter = "AND pr.persona_id = ?";
  params.push(profesorPersonaId);

  const [cursos] = await pool.query(
    `SELECT DISTINCT c.id, c.nombre
     FROM cursos c
     INNER JOIN horarios h ON h.curso_id = c.id AND h.estado = 'activo'
     INNER JOIN profesores pr ON pr.id = h.profesor_id AND pr.estado = 'activo'
     WHERE c.estado = 'activo' ${profesorJoinFilter}
     ORDER BY c.nombre ASC`,
    params
  );

  const [asignaturas] = await pool.query(
    `SELECT DISTINCT a.id, a.nombre, h.curso_id
     FROM horarios h
     INNER JOIN profesores pr ON pr.id = h.profesor_id AND pr.estado = 'activo'
     INNER JOIN asignaturas a ON a.id = h.asignatura_id
     INNER JOIN cursos c ON c.id = h.curso_id
     WHERE h.estado = 'activo' AND a.estado = 'activo' AND c.estado = 'activo' ${profesorJoinFilter}
     ORDER BY a.nombre ASC`,
    params
  );

  const [profesores] = await pool.query(
     `SELECT DISTINCT
       pr.id,
       pr.persona_id,
       CONCAT(p.nombres, ' ', p.apellidos) AS nombre,
       p.apellidos,
       p.nombres,
       h.curso_id,
       h.asignatura_id
     FROM profesores pr
     INNER JOIN personas p ON p.id = pr.persona_id
     INNER JOIN horarios h ON h.profesor_id = pr.id AND h.estado = 'activo'
     WHERE pr.estado = 'activo' ${profesorJoinFilter}
     ORDER BY p.apellidos, p.nombres ASC`,
    params
  );

  const [periodos] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado
     FROM periodos_academicos
     ORDER BY fecha_inicio DESC`
  );

  return { asignaturas, profesores, periodos, cursos };
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

const findNotasFinalesPorCurso = async ({ periodoId = null, profesorPersonaId = null } = {}) => {
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
      c.id AS curso_id,
      c.nombre AS curso_nombre,
      e.id AS estudiante_id,
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

  // La definitiva de cada asignatura es el promedio de las notas de las
  // actividades que cada profesor registra en notas_actividades.
  const notasParams = [];
  let notasWhere = "";
  if (periodoId) {
    notasWhere = "WHERE ac.periodo_id = ?";
    notasParams.push(periodoId);
  }

  if (profesorPersonaId) {
    notasWhere += notasWhere ? " AND pr.persona_id = ?" : "WHERE pr.persona_id = ?";
    notasParams.push(profesorPersonaId);
  }

  const [notasRows] = await pool.query(
    `SELECT
      na.estudiante_id,
      ac.curso_id,
      ac.asignatura_id,
      ac.profesor_id,
      ac.periodo_id,
      ROUND(AVG(na.nota), 1) AS nota,
      COUNT(*) AS total_actividades,
      a.nombre AS asignatura,
      CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor,
      per.nombre AS periodo
    FROM notas_actividades na
    INNER JOIN actividades ac ON ac.id = na.actividad_id
    INNER JOIN asignaturas a ON a.id = ac.asignatura_id
    INNER JOIN profesores pr ON pr.id = ac.profesor_id
    INNER JOIN personas pp ON pp.id = pr.persona_id
    INNER JOIN periodos_academicos per ON per.id = ac.periodo_id
    ${notasWhere}
    GROUP BY na.estudiante_id, ac.curso_id, ac.asignatura_id, ac.profesor_id, ac.periodo_id, a.nombre, profesor, per.nombre
    ORDER BY na.estudiante_id ASC, a.nombre ASC`,
    notasParams
  );

  const notasPorEstudiante = {};
  for (const n of notasRows) {
    if (!notasPorEstudiante[n.estudiante_id]) notasPorEstudiante[n.estudiante_id] = [];
    notasPorEstudiante[n.estudiante_id].push({
      notaId: null,
      asignatura: n.asignatura,
      asignaturaId: n.asignatura_id,
      profesor: n.profesor,
      profesorId: n.profesor_id,
      periodo: n.periodo,
      periodoId: n.periodo_id,
      nota: Number(n.nota),
      observacion: null,
    });
  }

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

const periodoExists = async (periodoId) => {
  const [rows] = await pool.query(
    `SELECT id FROM periodos_academicos WHERE id = ? LIMIT 1`,
    [periodoId]
  );
  return Boolean(rows[0]);
};

const findPeriodoById = async (periodoId) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado
     FROM periodos_academicos
     WHERE id = ?
     LIMIT 1`,
    [periodoId]
  );
  return rows[0] || null;
};

const findActividadById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       ac.id,
       ac.titulo,
       ac.descripcion,
       ac.fecha,
       ac.curso_id,
       ac.asignatura_id,
       ac.profesor_id,
       ac.periodo_id,
       c.nombre AS curso_nombre,
       s.nombre AS asignatura_nombre,
       per.nombre AS periodo_nombre,
       pr.persona_id AS profesor_persona_id,
       CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre
     FROM actividades ac
     INNER JOIN cursos c ON c.id = ac.curso_id
     INNER JOIN asignaturas s ON s.id = ac.asignatura_id
     INNER JOIN periodos_academicos per ON per.id = ac.periodo_id
     INNER JOIN profesores pr ON pr.id = ac.profesor_id
     INNER JOIN personas pp ON pp.id = pr.persona_id
     WHERE ac.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findPorCurso = async ({
  periodoId = null,
  cursoId = null,
  asignaturaId = null,
  profesorPersonaId = null,
} = {}) => {
  if (!periodoId || !cursoId || !asignaturaId) {
    return null;
  }

  const profesorParams = profesorPersonaId ? [profesorPersonaId] : [];
  const profesorFilter = profesorPersonaId ? "AND pr.persona_id = ?" : "";

  const [cursoRows] = await pool.query(
    `SELECT DISTINCT c.id AS curso_id, c.nombre AS curso_nombre
     FROM cursos c
     INNER JOIN horarios h ON h.curso_id = c.id AND h.estado = 'activo'
     INNER JOIN profesores pr ON pr.id = h.profesor_id AND pr.estado = 'activo'
     WHERE c.id = ? AND h.asignatura_id = ? AND c.estado = 'activo' ${profesorFilter}
     LIMIT 1`,
    [cursoId, asignaturaId, ...profesorParams]
  );

  if (!cursoRows[0]) {
    return null;
  }

  const [asignaturaRows] = await pool.query(
    `SELECT id, nombre FROM asignaturas WHERE id = ? AND estado = 'activo' LIMIT 1`,
    [asignaturaId]
  );

  const [periodoRows] = await pool.query(
    `SELECT id, nombre FROM periodos_academicos WHERE id = ? LIMIT 1`,
    [periodoId]
  );

  const [estudiantesRows] = await pool.query(
    `SELECT
       e.id AS estudiante_id,
       CONCAT(p.nombres, ' ', p.apellidos) AS estudiante_nombre,
       p.documento
     FROM estudiantes e
     INNER JOIN personas p ON p.id = e.persona_id
     WHERE e.curso_id = ? AND e.estado = 'activo'
     ORDER BY p.apellidos ASC, p.nombres ASC`,
    [cursoId]
  );

  const [actividadesRows] = await pool.query(
    `SELECT
       ac.id,
       ac.titulo,
       ac.fecha,
       ac.descripcion,
       ac.profesor_id,
       CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre
     FROM actividades ac
     INNER JOIN profesores pr ON pr.id = ac.profesor_id
     INNER JOIN personas pp ON pp.id = pr.persona_id
     WHERE ac.curso_id = ?
       AND ac.asignatura_id = ?
       AND ac.periodo_id = ?
       ${profesorFilter}
     ORDER BY ac.fecha ASC, ac.id ASC`,
    [cursoId, asignaturaId, periodoId, ...profesorParams]
  );

  const actividadIds = actividadesRows.map((actividad) => actividad.id);
  let notasRows = [];

  if (actividadIds.length) {
    const placeholders = actividadIds.map(() => "?").join(", ");
    const [rows] = await pool.query(
      `SELECT id, actividad_id, estudiante_id, nota, observacion
       FROM notas_actividades
       WHERE actividad_id IN (${placeholders})
       ORDER BY estudiante_id ASC`,
      actividadIds
    );
    notasRows = rows;
  }

  const notasPorEstudiante = {};
  for (const row of notasRows) {
    const key = String(row.estudiante_id);
    if (!notasPorEstudiante[key]) notasPorEstudiante[key] = [];
    notasPorEstudiante[key].push({
      notaId: row.id,
      actividadId: row.actividad_id,
      nota: Number(row.nota),
      observacion: row.observacion ?? null,
    });
  }

  const estudiantes = estudiantesRows.map((row) => {
    const notas = notasPorEstudiante[String(row.estudiante_id)] ?? [];
    const definitiva = notas.length
      ? Number((notas.reduce((sum, item) => sum + Number(item.nota), 0) / notas.length).toFixed(1))
      : null;

    return {
      estudianteId: row.estudiante_id,
      estudianteNombre: row.estudiante_nombre,
      documento: row.documento,
      notas,
      definitiva,
    };
  });

  return {
    cursoId: cursoRows[0].curso_id,
    cursoNombre: cursoRows[0].curso_nombre,
    asignaturaId,
    asignaturaNombre: asignaturaRows[0]?.nombre || "",
    periodoId,
    periodoNombre: periodoRows[0]?.nombre || "",
    actividades: actividadesRows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      fecha: row.fecha instanceof Date ? row.fecha.toISOString().slice(0, 10) : String(row.fecha).slice(0, 10),
      descripcion: row.descripcion ?? null,
      profesorId: row.profesor_id,
      profesorNombre: row.profesor_nombre,
    })),
    estudiantes,
  };
};

const createActividad = async ({ titulo, fecha, cursoId, asignaturaId, periodoId, profesorId, descripcion = null }) => {
  const [result] = await pool.query(
    `INSERT INTO actividades (titulo, fecha, curso_id, asignatura_id, periodo_id, profesor_id, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titulo, fecha, cursoId, asignaturaId, periodoId, profesorId, descripcion]
  );
  return result.insertId;
};

const deleteActividad = async (id) => {
  const [result] = await pool.query(`DELETE FROM actividades WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const upsertNotaActividad = async ({ actividadId, estudianteId, nota, observacion = null }) => {
  const [result] = await pool.query(
    `INSERT INTO notas_actividades (actividad_id, estudiante_id, nota, observacion)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       nota = VALUES(nota),
       observacion = VALUES(observacion),
       updated_at = CURRENT_TIMESTAMP`,
    [actividadId, estudianteId, nota, observacion]
  );

  if (result.insertId) return result.insertId;

  const [rows] = await pool.query(
    `SELECT id FROM notas_actividades WHERE actividad_id = ? AND estudiante_id = ? LIMIT 1`,
    [actividadId, estudianteId]
  );
  return rows[0]?.id || null;
};

const findNotaActividadById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, actividad_id, estudiante_id, nota, observacion
     FROM notas_actividades
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  getCatalog,
  findPorCurso,
  findNotasFinalesPorCurso,
  findProfesorByPersonaId,
  findPersonaIdByUsuarioId,
  estudiantePerteneceCurso,
  profesorTieneClase,
  periodoExists,
  findPeriodoById,
  findActividadById,
  createActividad,
  deleteActividad,
  upsertNotaActividad,
  findNotaActividadById,
  create,
  update,
  deleteNota,
};

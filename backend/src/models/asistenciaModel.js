const pool = require("../config/db");

const baseSelect = `SELECT
  a.id,
  a.estudiante_id,
  a.curso_id,
  a.asignatura_id,
  a.profesor_id,
  a.fecha,
  a.estado_asistencia,
  a.observacion,
  a.created_at,
  a.updated_at,
  c.nombre AS curso_nombre,
  s.nombre AS asignatura_nombre,
  CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre,
  pe.id AS estudiante_persona_id,
  pe.nombres AS estudiante_nombres,
  pe.apellidos AS estudiante_apellidos,
  pe.documento AS estudiante_documento,
  pp.id AS profesor_persona_id
FROM asistencias a
INNER JOIN cursos c ON c.id = a.curso_id
INNER JOIN asignaturas s ON s.id = a.asignatura_id
INNER JOIN profesores pr ON pr.id = a.profesor_id
INNER JOIN personas pp ON pp.id = pr.persona_id
INNER JOIN estudiantes e ON e.id = a.estudiante_id
INNER JOIN personas pe ON pe.id = e.persona_id`;

const findAll = async ({
  cursoId = null,
  asignaturaId = null,
  fecha = null,
  estudianteId = null,
  profesorId = null,
  profesorPersonaId = null,
  estadoAsistencia = null,
  q = null,
  limit = null,
} = {}) => {
  let query = baseSelect;
  const conditions = [];
  const params = [];

  if (cursoId) {
    conditions.push("a.curso_id = ?");
    params.push(cursoId);
  }

  if (asignaturaId) {
    conditions.push("a.asignatura_id = ?");
    params.push(asignaturaId);
  }

  if (fecha) {
    conditions.push("a.fecha = ?");
    params.push(fecha);
  }

  if (estudianteId) {
    conditions.push("a.estudiante_id = ?");
    params.push(estudianteId);
  }

  if (profesorId) {
    conditions.push("a.profesor_id = ?");
    params.push(profesorId);
  }

  if (profesorPersonaId) {
    conditions.push("pr.persona_id = ?");
    params.push(profesorPersonaId);
  }

  if (estadoAsistencia) {
    conditions.push("a.estado_asistencia = ?");
    params.push(estadoAsistencia);
  }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(
      pe.nombres LIKE ? OR
      pe.apellidos LIKE ? OR
      pe.documento LIKE ? OR
      s.nombre LIKE ? OR
      CONCAT(pe.nombres, ' ', pe.apellidos) LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY a.fecha DESC, pe.apellidos ASC, pe.nombres ASC`;

  if (limit) {
    query += ` LIMIT ?`;
    params.push(Number(limit));
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO asistencias
      (estudiante_id, curso_id, asignatura_id, profesor_id, fecha, estado_asistencia, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.estudianteId,
      data.cursoId,
      data.asignaturaId,
      data.profesorId,
      data.fecha,
      data.estadoAsistencia,
      data.observacion || null,
    ]
  );

  return result.insertId;
};

// Inserta o actualiza la marca de asistencia de un estudiante en una fecha
// y asignatura concretas (clave unica estudiante_id + asignatura_id + fecha).
const upsert = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO asistencias
      (estudiante_id, curso_id, asignatura_id, profesor_id, fecha, estado_asistencia, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      estado_asistencia = VALUES(estado_asistencia),
      profesor_id = VALUES(profesor_id),
      observacion = VALUES(observacion),
      updated_at = CURRENT_TIMESTAMP`,
    [
      data.estudianteId,
      data.cursoId,
      data.asignaturaId,
      data.profesorId,
      data.fecha,
      data.estadoAsistencia,
      data.observacion || null,
    ]
  );

  return result;
};

const update = async (id, data) => {
  const fieldMap = {
    estudianteId: "estudiante_id",
    cursoId: "curso_id",
    asignaturaId: "asignatura_id",
    profesorId: "profesor_id",
    fecha: "fecha",
    estadoAsistencia: "estado_asistencia",
    observacion: "observacion",
  };

  const updates = [];
  const params = [];

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE asistencias SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deleteAsistencia = async (id) => {
  const [result] = await pool.query(`DELETE FROM asistencias WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getResumen = async ({ cursoId = null, asignaturaId = null, fecha = null, profesorPersonaId = null } = {}) => {
  let query = `SELECT
    a.estado_asistencia,
    COUNT(*) AS total
  FROM asistencias a
  INNER JOIN profesores pr ON pr.id = a.profesor_id`;
  const conditions = [];
  const params = [];

  if (cursoId) {
    conditions.push("a.curso_id = ?");
    params.push(cursoId);
  }

  if (asignaturaId) {
    conditions.push("a.asignatura_id = ?");
    params.push(asignaturaId);
  }

  if (fecha) {
    conditions.push("a.fecha = ?");
    params.push(fecha);
  }

  if (profesorPersonaId) {
    conditions.push("pr.persona_id = ?");
    params.push(profesorPersonaId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` GROUP BY a.estado_asistencia`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const getCatalog = async () => {
  const [cursos] = await pool.query(
    `SELECT id, nombre, nivel FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  const [estudiantes] = await pool.query(
    `SELECT e.id, e.curso_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
    FROM estudiantes e
    INNER JOIN personas p ON p.id = e.persona_id
    WHERE e.estado = 'activo'
    ORDER BY p.apellidos, p.nombres ASC`
  );
  const [profesores] = await pool.query(
    `SELECT pr.id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
    FROM profesores pr
    INNER JOIN personas p ON p.id = pr.persona_id
    WHERE pr.estado = 'activo'
    ORDER BY p.apellidos, p.nombres ASC`
  );
  const [asignaturas] = await pool.query(
    `SELECT id, nombre FROM asignaturas WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  const [periodos] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado
    FROM periodos_academicos
    ORDER BY fecha_inicio DESC`
  );

  return { cursos, estudiantes, profesores, asignaturas, periodos };
};

const findPorCurso = async ({ periodoId = null, profesorPersonaId = null } = {}) => {
  const [filas] = await pool.query(
    `SELECT
      c.id AS curso_id,
      c.nombre AS curso_nombre,
      e.id AS estudiante_id,
      CONCAT(p.nombres, ' ', p.apellidos) AS estudiante_nombre,
      p.documento
    FROM cursos c
    LEFT JOIN estudiantes e ON e.curso_id = c.id AND e.estado = 'activo'
    LEFT JOIN personas p ON p.id = e.persona_id
    WHERE c.estado = 'activo'
    ORDER BY c.nombre ASC, p.apellidos ASC, p.nombres ASC`
  );

  const subjectParams = [];
  let subjectProfessorFilter = "";
  if (profesorPersonaId) {
    subjectProfessorFilter = "WHERE pr.persona_id = ?";
    subjectParams.push(profesorPersonaId);
  }

  const [asignaturasRows] = await pool.query(
    `SELECT
      ca.curso_id,
      ca.asignatura_id,
      s.nombre AS asignatura_nombre
    FROM (
      SELECT h.curso_id, h.asignatura_id, h.profesor_id
      FROM horarios h
      WHERE h.estado = 'activo'
      UNION
      SELECT a.curso_id, a.asignatura_id, a.profesor_id
      FROM asistencias a
      UNION
      SELECT n.curso_id, n.asignatura_id, n.profesor_id
      FROM notas n
    ) ca
    INNER JOIN profesores pr ON pr.id = ca.profesor_id
    INNER JOIN asignaturas s ON s.id = ca.asignatura_id
    ${subjectProfessorFilter}
    GROUP BY ca.curso_id, ca.asignatura_id, s.nombre
    ORDER BY s.nombre ASC`,
    subjectParams
  );

  const asistenciaParams = [];
  const asistenciaConditions = [];

  if (periodoId) {
    asistenciaConditions.push(`a.fecha BETWEEN (
      SELECT fecha_inicio FROM periodos_academicos WHERE id = ?
    ) AND (
      SELECT fecha_fin FROM periodos_academicos WHERE id = ?
    )`);
    asistenciaParams.push(periodoId, periodoId);
  }

  if (profesorPersonaId) {
    asistenciaConditions.push("pr.persona_id = ?");
    asistenciaParams.push(profesorPersonaId);
  }

  const asistenciaWhere = asistenciaConditions.length
    ? `WHERE ${asistenciaConditions.join(" AND ")}`
    : "";

  const [asistenciasRows] = await pool.query(
    `SELECT
      a.id AS asistencia_id,
      a.estudiante_id,
      a.curso_id,
      a.asignatura_id,
      a.profesor_id,
      a.fecha,
      a.estado_asistencia,
      a.observacion,
      s.nombre AS asignatura_nombre,
      CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre
    FROM asistencias a
    INNER JOIN asignaturas s ON s.id = a.asignatura_id
    INNER JOIN profesores pr ON pr.id = a.profesor_id
    INNER JOIN personas pp ON pp.id = pr.persona_id
    ${asistenciaWhere}
    ORDER BY a.fecha ASC, a.estudiante_id ASC`,
    asistenciaParams
  );

  const asistenciasPorEstudiante = {};
  const fechasPorAsignatura = {};
  const resumenPorAsignatura = {};

  for (const a of asistenciasRows) {
    const fecha = a.fecha instanceof Date ? a.fecha.toISOString().slice(0, 10) : String(a.fecha).slice(0, 10);
    const cursoAsignaturaKey = `${a.curso_id}:${a.asignatura_id}`;
    const estudianteKey = String(a.estudiante_id);

    if (!asistenciasPorEstudiante[estudianteKey]) asistenciasPorEstudiante[estudianteKey] = [];
    asistenciasPorEstudiante[estudianteKey].push({
      asistenciaId: a.asistencia_id,
      asignaturaId: a.asignatura_id,
      profesorId: a.profesor_id,
      profesor: a.profesor_nombre,
      fecha,
      estado: a.estado_asistencia,
      observacion: a.observacion ?? null,
    });

    if (!fechasPorAsignatura[cursoAsignaturaKey]) fechasPorAsignatura[cursoAsignaturaKey] = new Set();
    fechasPorAsignatura[cursoAsignaturaKey].add(fecha);

    if (!resumenPorAsignatura[cursoAsignaturaKey]) {
      resumenPorAsignatura[cursoAsignaturaKey] = { presente: 0, ausente: 0, excusa: 0, tardanza: 0, total: 0 };
    }
    resumenPorAsignatura[cursoAsignaturaKey][a.estado_asistencia] += 1;
    resumenPorAsignatura[cursoAsignaturaKey].total += 1;
  }

  const asignaturasPorCurso = {};
  for (const asignatura of asignaturasRows) {
    const key = `${asignatura.curso_id}:${asignatura.asignatura_id}`;
    if (!asignaturasPorCurso[asignatura.curso_id]) asignaturasPorCurso[asignatura.curso_id] = [];
    asignaturasPorCurso[asignatura.curso_id].push({
      asignaturaId: asignatura.asignatura_id,
      asignaturaNombre: asignatura.asignatura_nombre,
      fechas: Array.from(fechasPorAsignatura[key] ?? []).sort(),
      resumen: resumenPorAsignatura[key] ?? { presente: 0, ausente: 0, excusa: 0, tardanza: 0, total: 0 },
    });
  }

  const cursosMap = new Map();
  for (const fila of filas) {
    if (!cursosMap.has(fila.curso_id)) {
      cursosMap.set(fila.curso_id, {
        cursoId: fila.curso_id,
        cursoNombre: fila.curso_nombre,
        asignaturas: asignaturasPorCurso[fila.curso_id] ?? [],
        estudiantes: [],
      });
    }

    if (fila.estudiante_id) {
      cursosMap.get(fila.curso_id).estudiantes.push({
        estudianteId: fila.estudiante_id,
        estudianteNombre: fila.estudiante_nombre,
        documento: fila.documento,
        asistencias: asistenciasPorEstudiante[String(fila.estudiante_id)] ?? [],
      });
    }
  }

  return Array.from(cursosMap.values());
};

const findPersonaIdByUsuarioId = async (usuarioId) => {
  const [rows] = await pool.query(
    `SELECT persona_id FROM usuarios WHERE id = ? LIMIT 1`,
    [usuarioId]
  );
  return rows[0]?.persona_id || null;
};

const findProfesorByPersonaId = async (personaId) => {
  const [rows] = await pool.query(
    `SELECT id, persona_id FROM profesores WHERE persona_id = ? AND estado = 'activo' LIMIT 1`,
    [personaId]
  );
  return rows[0] || null;
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

module.exports = {
  findAll,
  findById,
  create,
  upsert,
  update,
  deleteAsistencia,
  getResumen,
  getCatalog,
  findPorCurso,
  findPersonaIdByUsuarioId,
  findProfesorByPersonaId,
  estudiantePerteneceCurso,
  profesorTieneClase,
};

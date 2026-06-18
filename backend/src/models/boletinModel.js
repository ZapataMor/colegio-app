const pool = require("../config/db");

const findCatalog = async () => {
  const [cursos] = await pool.query(
    `SELECT
      c.id,
      c.nombre,
      c.nivel,
      c.jornada,
      COUNT(e.id) AS estudiantes_total
    FROM cursos c
    LEFT JOIN estudiantes e ON e.curso_id = c.id AND e.estado IN ('activo', 'egresado')
    WHERE c.estado = 'activo'
    GROUP BY c.id, c.nombre, c.nivel, c.jornada
    ORDER BY c.nombre ASC`
  );

  const [estudiantes] = await pool.query(
    `SELECT
      e.id,
      e.curso_id,
      CONCAT(p.nombres, ' ', p.apellidos) AS nombre,
      p.documento,
      c.nombre AS curso_nombre
    FROM estudiantes e
    INNER JOIN personas p ON p.id = e.persona_id
    INNER JOIN cursos c ON c.id = e.curso_id
    WHERE e.estado IN ('activo', 'egresado')
    ORDER BY p.apellidos, p.nombres ASC`
  );

  const [periodos] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado
    FROM periodos_academicos
    ORDER BY fecha_inicio DESC`
  );

  return { cursos, estudiantes, periodos };
};

const findPeriodo = async (periodoId = null) => {
  const [rows] = await pool.query(
    periodoId
      ? `SELECT id, nombre, fecha_inicio, fecha_fin, estado
         FROM periodos_academicos
         WHERE id = ?
         LIMIT 1`
      : `SELECT id, nombre, fecha_inicio, fecha_fin, estado
         FROM periodos_academicos
         ORDER BY (estado = 'activo') DESC, fecha_inicio DESC
         LIMIT 1`,
    periodoId ? [periodoId] : []
  );

  return rows[0] || null;
};

const findStudentInfo = async (estudianteId) => {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.persona_id,
      e.curso_id,
      e.codigo_estudiante,
      e.estado,
      p.nombres,
      p.apellidos,
      p.documento,
      p.correo,
      p.fecha_nacimiento,
      c.nombre AS curso_nombre,
      c.nivel AS curso_nivel,
      c.jornada AS curso_jornada
    FROM estudiantes e
    INNER JOIN personas p ON p.id = e.persona_id
    INNER JOIN cursos c ON c.id = e.curso_id
    WHERE e.id = ?
    LIMIT 1`,
    [estudianteId]
  );

  return rows[0] || null;
};

const findMaterias = async (estudianteId, periodoId) => {
  // La nota final de cada asignatura es el promedio de las notas de las
  // actividades registradas por el profesor (igual que el modulo de notas).
  const [rows] = await pool.query(
    `SELECT
      ac.asignatura_id AS id,
      ROUND(AVG(na.nota), 1) AS nota,
      NULL AS observacion,
      a.nombre AS asignatura,
      CONCAT(p.nombres, ' ', p.apellidos) AS profesor
    FROM notas_actividades na
    INNER JOIN actividades ac ON ac.id = na.actividad_id
    INNER JOIN asignaturas a ON a.id = ac.asignatura_id
    INNER JOIN profesores pr ON pr.id = ac.profesor_id
    INNER JOIN personas p ON p.id = pr.persona_id
    WHERE na.estudiante_id = ? AND ac.periodo_id = ?
    GROUP BY ac.asignatura_id, a.nombre, profesor
    ORDER BY a.nombre ASC`,
    [estudianteId, periodoId]
  );

  return rows;
};

const findAttendanceSummary = async (estudianteId, fechaInicio, fechaFin) => {
  const [rows] = await pool.query(
    `SELECT
      estado_asistencia,
      COUNT(*) AS total
    FROM asistencias
    WHERE estudiante_id = ? AND fecha BETWEEN ? AND ?
    GROUP BY estado_asistencia`,
    [estudianteId, fechaInicio, fechaFin]
  );

  return rows;
};

const buildBoletin = async (estudianteId, periodoId = null) => {
  const [estudiante, periodo] = await Promise.all([
    findStudentInfo(estudianteId),
    findPeriodo(periodoId),
  ]);

  if (!estudiante) {
    throw Object.assign(new Error("Estudiante no encontrado."), { statusCode: 404 });
  }

  if (!periodo) {
    throw Object.assign(new Error("No hay periodos academicos configurados."), { statusCode: 404 });
  }

  const [materiasRows, attendanceRows] = await Promise.all([
    findMaterias(estudianteId, periodo.id),
    findAttendanceSummary(estudianteId, periodo.fecha_inicio, periodo.fecha_fin),
  ]);

  const materias = materiasRows.map((item) => ({
    ...item,
    nota: Number(item.nota),
    desempeno:
      Number(item.nota) >= 4.6
        ? "Superior"
        : Number(item.nota) >= 4
          ? "Alto"
          : Number(item.nota) >= 3
            ? "Basico"
            : "Bajo",
  }));

  const promedioGeneral = materias.length
    ? Number(
        (materias.reduce((acc, item) => acc + Number(item.nota), 0) / materias.length).toFixed(2)
      )
    : 0;

  const asistencia = attendanceRows.reduce(
    (acc, row) => {
      acc[row.estado_asistencia] = Number(row.total);
      acc.total += Number(row.total);
      return acc;
    },
    { presente: 0, ausente: 0, excusa: 0, tardanza: 0, total: 0 }
  );

  const porcentajeAsistencia = asistencia.total
    ? Math.round(((asistencia.presente + asistencia.excusa) / asistencia.total) * 100)
    : 0;

  return {
    estudiante,
    periodo,
    materias,
    resumen: {
      promedioGeneral,
      materiasRegistradas: materias.length,
      materiasAprobadas: materias.filter((item) => item.nota >= 3).length,
      materiasEnRiesgo: materias.filter((item) => item.nota < 3).length,
      porcentajeAsistencia,
    },
    asistencia,
    observaciones: materias
      .filter((item) => item.observacion)
      .slice(0, 4)
      .map((item) => ({
        asignatura: item.asignatura,
        observacion: item.observacion,
      })),
  };
};

const generateByCourse = async (cursoId, periodoId = null) => {
  const periodo = await findPeriodo(periodoId);

  if (!periodo) {
    throw Object.assign(new Error("No hay periodos academicos configurados."), { statusCode: 404 });
  }

  const [estudiantes] = await pool.query(
    `SELECT e.id
    FROM estudiantes e
    WHERE e.curso_id = ? AND e.estado IN ('activo', 'egresado')
    ORDER BY e.id ASC`,
    [cursoId]
  );

  if (estudiantes.length === 0) {
    throw Object.assign(new Error("El salon seleccionado no tiene estudiantes activos."), { statusCode: 404 });
  }

  await Promise.all(estudiantes.map((estudiante) => buildBoletin(estudiante.id, periodo.id)));

  return {
    cursoId,
    periodo,
    estudiantesGenerados: estudiantes.length,
    estudiantes: estudiantes.map((estudiante) => estudiante.id),
  };
};

module.exports = {
  findCatalog,
  buildBoletin,
  generateByCourse,
};

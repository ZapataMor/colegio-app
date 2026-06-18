const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const DEFAULT_TEACHER_PASSWORD = "Docente123*";

const DIAS_CLASE = ["lunes", "martes", "miercoles", "jueves", "viernes"];
const BLOQUES_HORARIO = [
  ["07:00:00", "07:55:00"],
  ["08:00:00", "08:55:00"],
  ["09:00:00", "09:55:00"],
  ["10:20:00", "11:15:00"],
  ["11:15:00", "12:10:00"],
  ["12:10:00", "13:05:00"],
];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const subjectAlias = (especialidad) => {
  const key = normalize(especialidad);
  const aliases = {
    biologia: "Ciencias Naturales",
    fisica: "Ciencias Naturales",
    filosofia: "Sociales",
    religion: "Sociales",
    "etica y valores": "Sociales",
    artistica: "Arte",
  };
  return aliases[key] || especialidad;
};

const gradoFromCurso = (nombre) => {
  const match = String(nombre).match(/^(\d+)/);
  return match ? Number(match[1]) : 1;
};

const subjectsForGrade = (grado, asignaturaByName) => {
  const base = [
    "Español",
    "Matemáticas",
    "Inglés",
    "Sociales",
    "Informática",
    "Educación Física",
    "Arte",
    "Ciencias Naturales",
  ];

  if (grado >= 6) base.push("Estadística");
  if (grado >= 8) base.push("Química");

  return base.filter((name) => asignaturaByName.get(normalize(name)));
};

const ensureProfesorRole = async () => {
  await pool.query(
    `INSERT INTO roles (nombre, descripcion)
     VALUES ('profesor', 'Gestiona asignaturas, notas y asistencias')
     ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), updated_at = CURRENT_TIMESTAMP`
  );
  const [rows] = await pool.query(`SELECT id FROM roles WHERE nombre = 'profesor' LIMIT 1`);
  return rows[0].id;
};

const ensureTeacherUsers = async (profesorRoleId) => {
  const [profesores] = await pool.query(
    `SELECT pr.id, pr.persona_id, p.correo, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
     FROM profesores pr
     INNER JOIN personas p ON p.id = pr.persona_id
     WHERE pr.estado = 'activo'
     ORDER BY pr.id ASC`
  );

  let created = 0;
  let activated = 0;

  for (const profesor of profesores) {
    await pool.query(
      `INSERT INTO persona_roles (persona_id, rol_id, estado)
       VALUES (?, ?, 'activo')
       ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
      [profesor.persona_id, profesorRoleId]
    );

    const [users] = await pool.query(`SELECT id, estado FROM usuarios WHERE persona_id = ? LIMIT 1`, [
      profesor.persona_id,
    ]);

    if (users[0]) {
      if (users[0].estado !== "activo") {
        await pool.query(`UPDATE usuarios SET estado = 'activo', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
          users[0].id,
        ]);
        activated += 1;
      }
      continue;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);
    await pool.query(
      `INSERT INTO usuarios (persona_id, password_hash, estado)
       VALUES (?, ?, 'activo')`,
      [profesor.persona_id, passwordHash]
    );
    created += 1;
  }

  return { total: profesores.length, created, activated };
};

const ensureTeacherSubjects = async () => {
  const [asignaturas] = await pool.query(`SELECT id, nombre FROM asignaturas WHERE estado = 'activo'`);
  const asignaturaByName = new Map(asignaturas.map((item) => [normalize(item.nombre), item]));

  const [profesores] = await pool.query(
    `SELECT id, especialidad
     FROM profesores
     WHERE estado = 'activo'
     ORDER BY id ASC`
  );

  let inserted = 0;
  const teachersBySubject = new Map();

  for (const profesor of profesores) {
    const targetName = subjectAlias(profesor.especialidad);
    const asignatura =
      asignaturaByName.get(normalize(targetName)) ||
      asignaturaByName.get(normalize(profesor.especialidad)) ||
      asignaturaByName.get("matematicas");

    if (!asignatura) continue;

    const [result] = await pool.query(
      `INSERT IGNORE INTO profesor_asignatura (profesor_id, asignatura_id)
       VALUES (?, ?)`,
      [profesor.id, asignatura.id]
    );
    inserted += result.affectedRows;

    const key = normalize(asignatura.nombre);
    if (!teachersBySubject.has(key)) teachersBySubject.set(key, []);
    teachersBySubject.get(key).push({ ...profesor, asignaturaId: asignatura.id, asignaturaNombre: asignatura.nombre });
  }

  return { asignaturaByName, teachersBySubject, inserted };
};

const loadExistingHorarioKeys = async () => {
  const [rows] = await pool.query(
    `SELECT profesor_id, curso_id, salon_id, dia_semana, hora_inicio
     FROM horarios
     WHERE estado = 'activo'`
  );

  return rows.reduce(
    (acc, row) => {
      const hora = String(row.hora_inicio).slice(0, 8);
      acc.profesor.add(`${row.profesor_id}|${row.dia_semana}|${hora}`);
      acc.curso.add(`${row.curso_id}|${row.dia_semana}|${hora}`);
      acc.salon.add(`${row.salon_id}|${row.dia_semana}|${hora}`);
      return acc;
    },
    { profesor: new Set(), curso: new Set(), salon: new Set() }
  );
};

const ensureSchedules = async ({ asignaturaByName, teachersBySubject }) => {
  const [cursos] = await pool.query(`SELECT id, nombre FROM cursos WHERE estado = 'activo' ORDER BY id ASC`);
  const [salones] = await pool.query(`SELECT id, nombre FROM salones WHERE estado = 'activo' ORDER BY id ASC`);

  if (!cursos.length || !salones.length) {
    throw new Error("No hay cursos o salones activos para asociar horarios.");
  }

  const occupied = await loadExistingHorarioKeys();
  const teacherLoad = new Map();
  let inserted = 0;
  let skipped = 0;
  let slotPointer = 0;

  for (let courseIndex = 0; courseIndex < cursos.length; courseIndex += 1) {
    const curso = cursos[courseIndex];
    const salon = salones[courseIndex % salones.length];
    const grado = gradoFromCurso(curso.nombre);
    const subjects = subjectsForGrade(grado, asignaturaByName);

    for (const subjectName of subjects) {
      const subject = asignaturaByName.get(normalize(subjectName));
      const teachers = [...(teachersBySubject.get(normalize(subjectName)) || [])].sort(
        (a, b) => (teacherLoad.get(a.id) || 0) - (teacherLoad.get(b.id) || 0) || a.id - b.id
      );

      if (!subject || !teachers.length) {
        skipped += 1;
        continue;
      }

      let placed = false;
      const totalSlots = DIAS_CLASE.length * BLOQUES_HORARIO.length;

      for (let attempts = 0; attempts < totalSlots && !placed; attempts += 1) {
        const slotIndex = (slotPointer + attempts) % totalSlots;
        const dia = DIAS_CLASE[Math.floor(slotIndex / BLOQUES_HORARIO.length)];
        const [horaInicio, horaFin] = BLOQUES_HORARIO[slotIndex % BLOQUES_HORARIO.length];
        const cursoKey = `${curso.id}|${dia}|${horaInicio}`;
        const salonKey = `${salon.id}|${dia}|${horaInicio}`;

        if (occupied.curso.has(cursoKey) || occupied.salon.has(salonKey)) continue;

        for (const teacher of teachers) {
          const profesorKey = `${teacher.id}|${dia}|${horaInicio}`;
          if (occupied.profesor.has(profesorKey)) continue;

          const [result] = await pool.query(
            `INSERT IGNORE INTO horarios
              (curso_id, profesor_id, asignatura_id, salon_id, dia_semana, hora_inicio, hora_fin, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
            [curso.id, teacher.id, subject.id, salon.id, dia, horaInicio, horaFin]
          );

          if (result.affectedRows > 0) {
            inserted += 1;
            teacherLoad.set(teacher.id, (teacherLoad.get(teacher.id) || 0) + 1);
          }

          occupied.curso.add(cursoKey);
          occupied.salon.add(salonKey);
          occupied.profesor.add(profesorKey);
          slotPointer = (slotIndex + 1) % totalSlots;
          placed = true;
          break;
        }
      }

      if (!placed) skipped += 1;
    }
  }

  return { inserted, skipped };
};

const summarize = async () => {
  const [profesoresSinUsuario] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM profesores pr
     LEFT JOIN usuarios u ON u.persona_id = pr.persona_id
     WHERE pr.estado = 'activo' AND u.id IS NULL`
  );
  const [profesorAsignatura] = await pool.query(`SELECT COUNT(*) AS total FROM profesor_asignatura`);
  const [horarios] = await pool.query(`SELECT COUNT(*) AS total FROM horarios WHERE estado = 'activo'`);
  const [profesoresConHorario] = await pool.query(
    `SELECT COUNT(DISTINCT profesor_id) AS total FROM horarios WHERE estado = 'activo'`
  );

  return {
    profesoresSinUsuario: profesoresSinUsuario[0].total,
    profesorAsignatura: profesorAsignatura[0].total,
    horarios: horarios[0].total,
    profesoresConHorario: profesoresConHorario[0].total,
  };
};

const main = async () => {
  try {
    console.log("Asegurando usuarios y cursos para profesores...\n");

    const profesorRoleId = await ensureProfesorRole();
    const users = await ensureTeacherUsers(profesorRoleId);
    const subjectSetup = await ensureTeacherSubjects();
    const schedules = await ensureSchedules(subjectSetup);
    const summary = await summarize();

    console.log(`Profesores activos revisados: ${users.total}`);
    console.log(`Usuarios de profesor creados: ${users.created}`);
    console.log(`Usuarios de profesor reactivados: ${users.activated}`);
    console.log(`Relaciones profesor-asignatura nuevas: ${subjectSetup.inserted}`);
    console.log(`Horarios nuevos creados: ${schedules.inserted}`);
    console.log(`Asignaciones omitidas por falta de cupo/profesor: ${schedules.skipped}`);
    console.log("\nEstado final:");
    console.log(`  Profesores sin usuario: ${summary.profesoresSinUsuario}`);
    console.log(`  Registros profesor_asignatura: ${summary.profesorAsignatura}`);
    console.log(`  Horarios activos: ${summary.horarios}`);
    console.log(`  Profesores con al menos un curso: ${summary.profesoresConHorario}`);
    console.log(`\nClave para usuarios nuevos: ${DEFAULT_TEACHER_PASSWORD}`);
  } catch (error) {
    console.error("No se pudieron asegurar las asignaciones:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();

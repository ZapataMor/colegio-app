const cursoModel = require("../models/cursoModel");
const gradoModel = require("../models/gradoModel");

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseNumericLevel = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validateGradePayload = async ({ nombre, numericLevel, educationLevel, status }, currentId = null) => {
  const cleanName = String(nombre || "").trim();

  if (!cleanName) {
    return { ok: false, statusCode: 400, message: "El nombre del grado es obligatorio." };
  }

  if (status && !gradoModel.ESTADOS_GRADO.includes(status)) {
    return { ok: false, statusCode: 400, message: "Estado de grado invalido." };
  }

  const cleanNumericLevel = parseNumericLevel(numericLevel);

  const duplicate = await gradoModel.findByName(cleanName, currentId);
  if (duplicate) {
    return { ok: false, statusCode: 409, message: "Ya existe un grado con este nombre." };
  }

  const duplicateNumericLevel = await gradoModel.findByNumericLevel(cleanNumericLevel, currentId);
  if (duplicateNumericLevel) {
    return { ok: false, statusCode: 409, message: "Ya existe un grado con este numero." };
  }

  return {
    ok: true,
    data: {
      nombre: cleanName,
      numericLevel: cleanNumericLevel,
      educationLevel: educationLevel ? String(educationLevel).trim() : null,
      status: status || "activo",
    },
  };
};

const getAllGrados = async (req, res, next) => {
  try {
    const grados = await gradoModel.findAll({ status: req.query.status || null });
    return res.json({ ok: true, message: "Grados obtenidos correctamente.", data: grados });
  } catch (error) {
    return next(error);
  }
};

const getGradoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de grado invalido." });
    }

    const grado = await gradoModel.findById(id);
    if (!grado) {
      return res.status(404).json({ ok: false, message: "Grado no encontrado." });
    }

    const cursos = await cursoModel.findAll({ gradeId: id });
    return res.json({ ok: true, message: "Grado obtenido correctamente.", data: { ...grado, cursos } });
  } catch (error) {
    return next(error);
  }
};

const createGrado = async (req, res, next) => {
  try {
    const validation = await validateGradePayload(req.body);
    if (!validation.ok) {
      return res.status(validation.statusCode).json({ ok: false, message: validation.message });
    }

    const id = await gradoModel.create(validation.data);
    const grado = await gradoModel.findById(id);
    return res.status(201).json({ ok: true, message: "Grado creado correctamente.", data: grado });
  } catch (error) {
    return next(error);
  }
};

const updateGrado = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de grado invalido." });
    }

    const current = await gradoModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Grado no encontrado." });
    }

    const validation = await validateGradePayload(
      {
        nombre: req.body.nombre ?? current.nombre,
        numericLevel: req.body.numericLevel ?? req.body.numeric_level ?? current.numeric_level,
        educationLevel: req.body.educationLevel ?? req.body.education_level ?? current.education_level,
        status: req.body.status ?? current.status,
      },
      id
    );

    if (!validation.ok) {
      return res.status(validation.statusCode).json({ ok: false, message: validation.message });
    }

    await gradoModel.update(id, validation.data);
    const grado = await gradoModel.findById(id);
    return res.json({ ok: true, message: "Grado actualizado correctamente.", data: grado });
  } catch (error) {
    return next(error);
  }
};

const deleteGrado = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de grado invalido." });
    }

    const grado = await gradoModel.findById(id);
    if (!grado) {
      return res.status(404).json({ ok: false, message: "Grado no encontrado." });
    }

    const activeCourses = await gradoModel.countActiveCourses(id);
    if (activeCourses > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar un grado con cursos activos asociados. Desactiva los cursos primero.",
      });
    }

    await gradoModel.deleteGrade(id);
    return res.json({ ok: true, message: "Grado eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

const getCursosByGrado = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de grado invalido." });
    }

    const grado = await gradoModel.findById(id);
    if (!grado) {
      return res.status(404).json({ ok: false, message: "Grado no encontrado." });
    }

    const cursos = await cursoModel.findAll({ gradeId: id });
    return res.json({ ok: true, message: "Cursos obtenidos correctamente.", data: cursos });
  } catch (error) {
    return next(error);
  }
};

const createCursoForGrado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nomenclature, nomenclatura, maxStudents, max_students, estado = "activo" } = req.body;
    const grade = await gradoModel.findById(id);

    if (!grade) {
      return res.status(404).json({ ok: false, message: "Grado no encontrado." });
    }

    const cleanNomenclature = cursoModel.normalizeNomenclature(nomenclature ?? nomenclatura);
    const capacity = parsePositiveInteger(maxStudents ?? max_students);

    if (!cleanNomenclature) {
      return res.status(400).json({ ok: false, message: "La nomenclatura del curso es obligatoria." });
    }

    if (!capacity) {
      return res.status(400).json({ ok: false, message: "La capacidad maxima debe ser un entero mayor que cero." });
    }

    if (!cursoModel.ESTADOS_CURSO.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de curso invalido." });
    }

    const fullName = cursoModel.buildFullName(grade, cleanNomenclature);
    const duplicateNomenclature = await cursoModel.findDuplicateNomenclature(id, cleanNomenclature);
    if (duplicateNomenclature) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un curso con esta nomenclatura para el grado seleccionado.",
      });
    }

    const duplicateFullName = await cursoModel.findDuplicateFullName(fullName);
    if (duplicateFullName) {
      return res.status(409).json({ ok: false, message: "Ya existe un curso con este nombre completo." });
    }

    const courseId = await cursoModel.create({
      grade,
      nomenclature: cleanNomenclature,
      maxStudents: capacity,
      estado,
    });
    const curso = await cursoModel.findById(courseId);

    return res.status(201).json({ ok: true, message: "Curso creado correctamente.", data: curso });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCursoForGrado,
  createGrado,
  deleteGrado,
  getAllGrados,
  getCursosByGrado,
  getGradoById,
  updateGrado,
};

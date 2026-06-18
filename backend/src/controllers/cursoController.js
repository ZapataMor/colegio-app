const cursoModel = require("../models/cursoModel");
const gradoModel = require("../models/gradoModel");

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getAllCursos = async (req, res, next) => {
  try {
    const cursos = await cursoModel.findAll({
      gradeId: req.query.gradeId || req.query.gradoId || null,
      estado: req.query.estado || null,
    });

    return res.json({ ok: true, message: "Cursos obtenidos correctamente.", data: cursos });
  } catch (error) {
    return next(error);
  }
};

const getCursoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de curso invalido." });
    }

    const curso = await cursoModel.findById(id);
    if (!curso) {
      return res.status(404).json({ ok: false, message: "Curso no encontrado." });
    }

    const estudiantes = await cursoModel.findStudents(id);
    return res.json({
      ok: true,
      message: "Curso obtenido correctamente.",
      data: { ...curso, estudiantes },
    });
  } catch (error) {
    return next(error);
  }
};

const updateCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gradeId, gradoId, nomenclature, nomenclatura, maxStudents, max_students, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de curso invalido." });
    }

    const current = await cursoModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Curso no encontrado." });
    }

    const targetGradeId = gradeId ?? gradoId ?? current.grade_id;
    const grade = await gradoModel.findById(targetGradeId);
    if (!grade) {
      return res.status(400).json({ ok: false, message: "El grado seleccionado no existe." });
    }

    const cleanNomenclature =
      nomenclature !== undefined || nomenclatura !== undefined
        ? cursoModel.normalizeNomenclature(nomenclature ?? nomenclatura)
        : current.nomenclature;

    if (!cleanNomenclature) {
      return res.status(400).json({ ok: false, message: "La nomenclatura del curso es obligatoria." });
    }

    let capacity;
    if (maxStudents !== undefined || max_students !== undefined) {
      capacity = parsePositiveInteger(maxStudents ?? max_students);
      if (!capacity) {
        return res.status(400).json({ ok: false, message: "La capacidad maxima debe ser un entero mayor que cero." });
      }

      const activeStudents = await cursoModel.countStudents(id, true);
      if (capacity < activeStudents) {
        return res.status(409).json({
          ok: false,
          message: "No se puede reducir la capacidad por debajo de la cantidad actual de estudiantes.",
        });
      }
    }

    if (estado !== undefined && !cursoModel.ESTADOS_CURSO.includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado de curso invalido." });
    }

    const duplicateNomenclature = await cursoModel.findDuplicateNomenclature(
      grade.id,
      cleanNomenclature,
      id
    );
    if (duplicateNomenclature) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un curso con esta nomenclatura para el grado seleccionado.",
      });
    }

    const fullName = cursoModel.buildFullName(grade, cleanNomenclature);
    const duplicateFullName = await cursoModel.findDuplicateFullName(fullName, id);
    if (duplicateFullName) {
      return res.status(409).json({ ok: false, message: "Ya existe un curso con este nombre completo." });
    }

    await cursoModel.update(id, {
      grade,
      nomenclature: cleanNomenclature,
      maxStudents: capacity,
      estado,
    });

    const curso = await cursoModel.findById(id);
    return res.json({ ok: true, message: "Curso actualizado correctamente.", data: curso });
  } catch (error) {
    return next(error);
  }
};

const deleteCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de curso invalido." });
    }

    const current = await cursoModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Curso no encontrado." });
    }

    const students = await cursoModel.countStudents(id);
    if (students > 0) {
      return res.status(409).json({
        ok: false,
        message: "No se puede eliminar un curso que tiene estudiantes asignados. Puedes desactivarlo.",
      });
    }

    await cursoModel.deleteCourse(id);
    return res.json({ ok: true, message: "Curso eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  deleteCurso,
  getAllCursos,
  getCursoById,
  updateCurso,
};

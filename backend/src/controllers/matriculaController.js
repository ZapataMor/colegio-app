const matriculaModel = require("../models/matriculaModel");

const getAllMatriculas = async (req, res, next) => {
  try {
    const { estado, anio, cursoId } = req.query;

    const matriculas = await matriculaModel.findAll(
      estado || null,
      anio || null,
      cursoId || null
    );

    return res.json({
      ok: true,
      message: "Matrículas obtenidas correctamente.",
      data: matriculas,
    });
  } catch (error) {
    return next(error);
  }
};

const getMatriculaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de matrícula inválido.",
      });
    }

    const matricula = await matriculaModel.findById(id);

    if (!matricula) {
      return res.status(404).json({
        ok: false,
        message: "Matrícula no encontrada.",
      });
    }

    return res.json({
      ok: true,
      message: "Matrícula obtenida correctamente.",
      data: matricula,
    });
  } catch (error) {
    return next(error);
  }
};

const createMatricula = async (req, res, next) => {
  try {
    const { estudianteId, cursoId, anio } = req.body;

    if (!estudianteId || !cursoId || !anio) {
      return res.status(400).json({
        ok: false,
        message: "estudianteId, cursoId y anio son obligatorios.",
      });
    }

    const anioNum = Number(anio);
    if (isNaN(anioNum) || anioNum < 2000 || anioNum > 2100) {
      return res.status(400).json({
        ok: false,
        message: "El año debe ser un valor válido.",
      });
    }

    const duplicada = await matriculaModel.findByEstudianteAnio(estudianteId, anioNum);
    if (duplicada) {
      return res.status(409).json({
        ok: false,
        message: "El estudiante ya tiene matrícula registrada para ese año.",
      });
    }

    const matriculaId = await matriculaModel.create({
      estudianteId,
      cursoId,
      anio: anioNum,
    });

    const matriculaCreada = await matriculaModel.findById(matriculaId);

    return res.status(201).json({
      ok: true,
      message: "Matrícula creada correctamente.",
      data: matriculaCreada,
    });
  } catch (error) {
    return next(error);
  }
};

const updateMatricula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estudianteId, cursoId, anio, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de matrícula inválido.",
      });
    }

    const existente = await matriculaModel.findById(id);
    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Matrícula no encontrada.",
      });
    }

    const nuevoEstudianteId = estudianteId !== undefined ? estudianteId : existente.estudiante_id;
    const nuevoAnio = anio !== undefined ? Number(anio) : existente.anio;

    if (anio !== undefined && (isNaN(nuevoAnio) || nuevoAnio < 2000 || nuevoAnio > 2100)) {
      return res.status(400).json({
        ok: false,
        message: "El año debe ser un valor válido.",
      });
    }

    if (
      nuevoEstudianteId !== existente.estudiante_id ||
      nuevoAnio !== existente.anio
    ) {
      const duplicada = await matriculaModel.findByEstudianteAnio(
        nuevoEstudianteId,
        nuevoAnio,
        id
      );
      if (duplicada) {
        return res.status(409).json({
          ok: false,
          message: "El estudiante ya tiene matrícula registrada para ese año.",
        });
      }
    }

    const actualizado = await matriculaModel.update(id, {
      estudianteId: estudianteId !== undefined ? estudianteId : undefined,
      cursoId: cursoId !== undefined ? cursoId : undefined,
      anio: anio !== undefined ? nuevoAnio : undefined,
      estado,
    });

    if (!actualizado) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar.",
      });
    }

    const matriculaActualizada = await matriculaModel.findById(id);

    return res.json({
      ok: true,
      message: "Matrícula actualizada correctamente.",
      data: matriculaActualizada,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMatricula = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de matrícula inválido.",
      });
    }

    const existente = await matriculaModel.findById(id);
    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Matrícula no encontrada.",
      });
    }

    const eliminado = await matriculaModel.deleteMatricula(id);

    if (!eliminado) {
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar la matrícula.",
      });
    }

    return res.json({
      ok: true,
      message: "Matrícula eliminada correctamente.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllMatriculas,
  getMatriculaById,
  createMatricula,
  updateMatricula,
  deleteMatricula,
};

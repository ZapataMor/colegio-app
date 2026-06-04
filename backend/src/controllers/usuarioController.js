const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");

/**
 * GET /api/usuarios
 * Obtiene lista de todos los usuarios con filtro opcional de estado
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { estado } = req.query;

    const usuarios = await userModel.findAll(estado);

    return res.json({
      ok: true,
      message: "Usuarios obtenidos correctamente.",
      data: usuarios,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/usuarios/:id
 * Obtiene los detalles de un usuario específico
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de usuario inválido.",
      });
    }

    const usuario = await userModel.findById(id);

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    return res.json({
      ok: true,
      message: "Usuario obtenido correctamente.",
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/usuarios
 * Crea un nuevo usuario
 */
const createUser = async (req, res, next) => {
  try {
    const { rolId, nombre, apellido, correo, contrasena, telefono } = req.body;

    // Validaciones
    if (!rolId || !nombre || !apellido || !correo || !contrasena) {
      return res.status(400).json({
        ok: false,
        message: "rolId, nombre, apellido, correo y contrasena son obligatorios.",
      });
    }

    const correoLower = correo.trim().toLowerCase();

    // Verifica si el correo ya existe
    const usuarioExistente = await userModel.findByCorreo(correoLower);
    if (usuarioExistente) {
      return res.status(409).json({
        ok: false,
        message: "El correo ya está registrado.",
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(contrasena, 10);

    // Crea el usuario
    const userId = await userModel.createUser({
      rolId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correoLower,
      passwordHash,
      telefono: telefono?.trim() || null,
    });

    // Obtiene el usuario creado
    const usuarioCreado = await userModel.findById(userId);

    return res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente.",
      data: usuarioCreado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario existente
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de usuario inválido.",
      });
    }

    // Verifica que el usuario exista
    const usuarioExistente = await userModel.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    // Actualiza el usuario
    const actualizado = await userModel.updateUser(id, {
      nombre: nombre?.trim(),
      apellido: apellido?.trim(),
      telefono: telefono?.trim() || null,
      estado,
    });

    if (!actualizado) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar.",
      });
    }

    // Obtiene el usuario actualizado
    const usuarioActualizado = await userModel.findById(id);

    return res.json({
      ok: true,
      message: "Usuario actualizado correctamente.",
      data: usuarioActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID de usuario inválido.",
      });
    }

    // Verifica que el usuario exista
    const usuarioExistente = await userModel.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    // Elimina el usuario
    const eliminado = await userModel.deleteUser(id);

    if (!eliminado) {
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar el usuario.",
      });
    }

    return res.json({
      ok: true,
      message: "Usuario eliminado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

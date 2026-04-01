const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function register(req, res) {
  try {
    const {
      nombre,
      email,
      password,
      role,
      telefono,
      apellidos,
      matricula,
      carrera,
      cedula,
      especialidad,
      codigoAdmin
    } = req.body;

    if (!nombre || !email || !password || !role) {
      return res.status(400).json({
        ok: false,
        message: 'Todos los campos son obligatorios.',
      });
    }

    const allowedRoles = ['paciente', 'medico', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'Rol no válido.',
      });
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo ya está registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users (
        nombre,
        email,
        password,
        role,
        activo,
        telefono,
        apellidos,
        matricula,
        carrera,
        cedula,
        especialidad,
        codigoAdmin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        role,
        true,
        telefono || '',
        apellidos || '',
        matricula || '',
        carrera || '',
        cedula || '',
        especialidad || '',
        codigoAdmin || ''
      ]
    );

    const newUser = {
      id: result.insertId,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      activo: true,
      telefono: telefono || '',
      apellidos: apellidos || '',
      matricula: matricula || '',
      carrera: carrera || '',
      cedula: cedula || '',
      especialidad: especialidad || '',
      codigoAdmin: codigoAdmin || ''
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: sanitizeUser(newUser),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error interno al registrar usuario.',
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios.',
      });
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas.',
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        ok: false,
        message: 'Usuario inactivo.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      ok: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error interno al iniciar sesión.',
      error: error.message,
    });
  }
}

function me(req, res) {
  return res.status(200).json({
    ok: true,
    data: req.user,
  });
}

module.exports = {
  register,
  login,
  me,
};
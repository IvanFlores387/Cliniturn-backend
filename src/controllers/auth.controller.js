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

function normalizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
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
      codigoAdmin,
    } = req.body;

    const cleanNombre = normalizeString(nombre);
    const cleanEmail = normalizeString(email).toLowerCase();
    const cleanPassword = normalizeString(password);
    const cleanRole = normalizeString(role).toLowerCase();

    if (!cleanNombre || !cleanEmail || !cleanPassword || !cleanRole) {
      return res.status(400).json({
        ok: false,
        message: 'Todos los campos obligatorios deben ser completados.',
      });
    }

    const allowedRoles = ['paciente', 'medico', 'admin'];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        ok: false,
        message: 'Rol no válido.',
      });
    }

    if (cleanRole === 'paciente') {
      if (!normalizeString(matricula) || !normalizeString(carrera) || !normalizeString(apellidos)) {
        return res.status(400).json({
          ok: false,
          message: 'Para paciente debes capturar nombre, apellidos, matrícula y carrera.',
        });
      }
    }

    if (cleanRole === 'medico') {
      if (!normalizeString(cedula) || !normalizeString(especialidad) || !normalizeString(apellidos)) {
        return res.status(400).json({
          ok: false,
          message: 'Para médico debes capturar nombre, apellidos, cédula y especialidad.',
        });
      }
    }

    if (cleanRole === 'admin') {
      if (!normalizeString(codigoAdmin) || !normalizeString(apellidos)) {
        return res.status(400).json({
          ok: false,
          message: 'Para administrador debes capturar nombre, apellidos y código de administrador.',
        });
      }
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo ya está registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const fullUserData = {
      nombre: cleanNombre,
      email: cleanEmail,
      password: hashedPassword,
      role: cleanRole,
      activo: 1,
      telefono: normalizeString(telefono),
      apellidos: normalizeString(apellidos),
      matricula: normalizeString(matricula),
      carrera: normalizeString(carrera),
      cedula: normalizeString(cedula),
      especialidad: normalizeString(especialidad),
      codigoAdmin: normalizeString(codigoAdmin),
    };

    let result;

    try {
      const columns = [
        'nombre',
        'email',
        'password',
        'role',
        'activo',
        'telefono',
        'apellidos',
        'matricula',
        'carrera',
        'cedula',
        'especialidad',
        'codigoAdmin',
      ];

      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((column) => fullUserData[column]);

      const [insertResult] = await db.execute(
        `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      result = insertResult;
    } catch (insertError) {
      const badFieldErrors = [
        'ER_BAD_FIELD_ERROR',
        'ER_NO_DEFAULT_FOR_FIELD',
        'ER_TRUNCATED_WRONG_VALUE',
      ];

      if (!badFieldErrors.includes(insertError.code)) {
        throw insertError;
      }

      const fallbackColumns = ['nombre', 'email', 'password', 'role', 'activo'];
      const fallbackPlaceholders = fallbackColumns.map(() => '?').join(', ');
      const fallbackValues = fallbackColumns.map((column) => fullUserData[column]);

      const [fallbackResult] = await db.execute(
        `INSERT INTO users (${fallbackColumns.join(', ')}) VALUES (${fallbackPlaceholders})`,
        fallbackValues
      );

      result = fallbackResult;
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const savedUser = rows[0];

    if (!savedUser) {
      return res.status(201).json({
        ok: true,
        message: 'Usuario registrado correctamente.',
      });
    }

    const token = generateToken(savedUser);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: sanitizeUser(savedUser),
      },
    });
  } catch (error) {
    console.error('Error en register:', error);

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

    const cleanEmail = normalizeString(email).toLowerCase();
    const cleanPassword = normalizeString(password);

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios.',
      });
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
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

    const isValidPassword = await bcrypt.compare(cleanPassword, user.password);

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
    console.error('Error en login:', error);

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
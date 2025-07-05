const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolConnect, pool, sql } = require('../db/connection');

// 🔐 Registro
const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    await poolConnect;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .query('INSERT INTO users (username, email, password) VALUES (@username, @email, @password)');

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
};

// 🔐 Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({ message: 'Login exitoso', token });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { register, login };

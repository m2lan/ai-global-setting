const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度3-20'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // 检查用户名是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
  const userId = result.lastInsertRowid;

  // 创建默认账户
  db.prepare('INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)').run(userId, '现金', 'cash', 0);
  db.prepare('INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)').run(userId, '银行卡', 'bank', 0);

  const token = generateToken(userId);

  res.json({
    token,
    user: { id: userId, username }
  });
});

// 登录
router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: { id: user.id, username: user.username }
  });
});

// 获取当前用户
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

module.exports = router;

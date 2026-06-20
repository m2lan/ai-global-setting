const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// 获取分类列表
router.get('/', (req, res) => {
  const { type } = req.query;

  let categories;
  if (type) {
    categories = db.prepare(
      'SELECT * FROM categories WHERE (user_id = ? OR is_default = 1) AND type = ? ORDER BY is_default DESC, id ASC'
    ).all(req.userId, type);
  } else {
    categories = db.prepare(
      'SELECT * FROM categories WHERE user_id = ? OR is_default = 1 ORDER BY is_default DESC, type, id ASC'
    ).all(req.userId);
  }

  res.json(categories);
});

// 创建分类
router.post('/', [
  body('name').notEmpty().withMessage('分类名不能为空'),
  body('type').isIn(['income', 'expense']).withMessage('类型必须是income或expense')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, type, icon } = req.body;

  // 检查是否重名
  const existing = db.prepare(
    'SELECT id FROM categories WHERE name = ? AND type = ? AND (user_id = ? OR is_default = 1)'
  ).get(name, type, req.userId);

  if (existing) {
    return res.status(400).json({ error: '分类名已存在' });
  }

  const result = db.prepare(
    'INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)'
  ).run(req.userId, name, type, icon || null);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.json(category);
});

// 更新分类
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, icon } = req.body;

  const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!category) {
    return res.status(404).json({ error: '分类不存在或无权修改' });
  }

  if (category.is_default) {
    return res.status(400).json({ error: '默认分类不能修改' });
  }

  if (name) {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
  }
  if (icon !== undefined) {
    db.prepare('UPDATE categories SET icon = ? WHERE id = ?').run(icon, id);
  }

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(updated);
});

// 删除分类
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!category) {
    return res.status(404).json({ error: '分类不存在或无权删除' });
  }

  if (category.is_default) {
    return res.status(400).json({ error: '默认分类不能删除' });
  }

  // 检查是否有关联的交易
  const hasTransactions = db.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?'
  ).get(id);

  if (hasTransactions.count > 0) {
    return res.status(400).json({ error: '该分类存在交易记录，无法删除' });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

module.exports = router;

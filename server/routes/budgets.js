const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// 获取预算列表
router.get('/', (req, res) => {
  const { month } = req.query;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const budgets = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon as category_icon
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ?
    ORDER BY b.category_id
  `).all(req.userId, currentMonth);

  res.json(budgets);
});

// 设置预算
router.post('/', [
  body('category_id').notEmpty().withMessage('请选择分类'),
  body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于0'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('月份格式不正确')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category_id, amount, month } = req.body;

  // 验证分类
  const category = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR is_default = 1) AND type = ?'
  ).get(category_id, req.userId, 'expense');

  if (!category) {
    return res.status(404).json({ error: '支出分类不存在' });
  }

  // 使用 UPSERT
  const result = db.prepare(`
    INSERT INTO budgets (user_id, category_id, amount, month)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, category_id, month)
    DO UPDATE SET amount = excluded.amount
  `).run(req.userId, category_id, amount, month);

  const budget = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon as category_icon
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.category_id = ? AND b.month = ?
  `).get(req.userId, category_id, month);

  res.json(budget);
});

// 更新预算
router.put('/:id', [
  body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于0')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { amount } = req.body;

  const budget = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!budget) {
    return res.status(404).json({ error: '预算不存在' });
  }

  db.prepare('UPDATE budgets SET amount = ? WHERE id = ?').run(amount, id);

  const updated = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon as category_icon
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `).get(id);

  res.json(updated);
});

// 删除预算
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const budget = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!budget) {
    return res.status(404).json({ error: '预算不存在' });
  }

  db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

module.exports = router;

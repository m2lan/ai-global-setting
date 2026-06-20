const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// 获取账单列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, type, category_id, account_id, start_date, end_date, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE t.user_id = ?';
  let params = [req.userId];

  if (type) {
    where += ' AND t.type = ?';
    params.push(type);
  }
  if (category_id) {
    where += ' AND t.category_id = ?';
    params.push(category_id);
  }
  if (account_id) {
    where += ' AND t.account_id = ?';
    params.push(account_id);
  }
  if (start_date) {
    where += ' AND t.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND t.date <= ?';
    params.push(end_date);
  }
  if (keyword) {
    where += ' AND t.note LIKE ?';
    params.push(`%${keyword}%`);
  }

  const countSql = `SELECT COUNT(*) as total FROM transactions t ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const sql = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    ${where}
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const transactions = db.prepare(sql).all(...params, parseInt(pageSize), parseInt(offset));

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

// 创建账单
router.post('/', [
  body('account_id').notEmpty().withMessage('请选择账户'),
  body('category_id').notEmpty().withMessage('请选择分类'),
  body('type').isIn(['income', 'expense']).withMessage('类型必须是income或expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于0'),
  body('date').isDate().withMessage('日期格式不正确')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { account_id, category_id, type, amount, note, date } = req.body;

  // 验证账户归属
  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(account_id, req.userId);
  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  // 验证分类
  const category = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR is_default = 1)'
  ).get(category_id, req.userId);
  if (!category) {
    return res.status(404).json({ error: '分类不存在' });
  }

  // 使用事务更新余额和创建交易
  const createTransaction = db.transaction(() => {
    const balanceChange = type === 'income' ? amount : -amount;
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(balanceChange, account_id);

    const result = db.prepare(
      'INSERT INTO transactions (user_id, account_id, category_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, account_id, category_id, type, amount, note || '', date);

    return result.lastInsertRowid;
  });

  const transactionId = createTransaction();

  const transaction = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `).get(transactionId);

  res.json(transaction);
});

// 更新账单
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { account_id, category_id, type, amount, note, date } = req.body;

  const oldTransaction = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!oldTransaction) {
    return res.status(404).json({ error: '账单不存在' });
  }

  const updateTransaction = db.transaction(() => {
    // 还原旧账户余额
    const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(oldBalanceChange, oldTransaction.account_id);

    // 使用新账户（如果有的话）
    const newAccountId = account_id || oldTransaction.account_id;
    const newType = type || oldTransaction.type;
    const newAmount = amount || oldTransaction.amount;

    // 更新新账户余额
    const newBalanceChange = newType === 'income' ? newAmount : -newAmount;
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(newBalanceChange, newAccountId);

    // 更新交易记录
    const updates = [];
    const params = [];

    if (account_id) { updates.push('account_id = ?'); params.push(account_id); }
    if (category_id) { updates.push('category_id = ?'); params.push(category_id); }
    if (type) { updates.push('type = ?'); params.push(type); }
    if (amount) { updates.push('amount = ?'); params.push(amount); }
    if (note !== undefined) { updates.push('note = ?'); params.push(note); }
    if (date) { updates.push('date = ?'); params.push(date); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
  });

  updateTransaction();

  const transaction = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `).get(id);

  res.json(transaction);
});

// 删除账单
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!transaction) {
    return res.status(404).json({ error: '账单不存在' });
  }

  const deleteTransaction = db.transaction(() => {
    // 还原账户余额
    const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(balanceChange, transaction.account_id);

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  });

  deleteTransaction();

  res.json({ message: '删除成功' });
});

module.exports = router;

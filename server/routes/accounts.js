const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由需要认证
router.use(authMiddleware);

// 获取账户列表
router.get('/', (req, res) => {
  const accounts = db.prepare(
    'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId);
  res.json(accounts);
});

// 创建账户
router.post('/', [
  body('name').notEmpty().withMessage('账户名不能为空'),
  body('type').isIn(['cash', 'bank', 'alipay', 'wechat', 'credit', 'other']).withMessage('无效的账户类型')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, type, balance = 0 } = req.body;

  const result = db.prepare(
    'INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)'
  ).run(req.userId, name, type, balance);

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
  res.json(account);
});

// 更新账户
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('账户名不能为空')
], (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;

  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  if (name) {
    db.prepare('UPDATE accounts SET name = ? WHERE id = ?').run(name, id);
  }
  if (type) {
    db.prepare('UPDATE accounts SET type = ? WHERE id = ?').run(type, id);
  }

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  res.json(updated);
});

// 删除账户
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  // 检查是否有关联的交易
  const hasTransactions = db.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?'
  ).get(id);

  if (hasTransactions.count > 0) {
    return res.status(400).json({ error: '该账户存在交易记录，无法删除' });
  }

  db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
});

// 账户间转账
router.post('/transfer', [
  body('fromAccountId').notEmpty().withMessage('转出账户不能为空'),
  body('toAccountId').notEmpty().withMessage('转入账户不能为空'),
  body('amount').isFloat({ gt: 0 }).withMessage('金额必须大于0')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fromAccountId, toAccountId, amount, note } = req.body;

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: '转出和转入账户不能相同' });
  }

  const fromAccount = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(fromAccountId, req.userId);
  const toAccount = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(toAccountId, req.userId);

  if (!fromAccount || !toAccount) {
    return res.status(404).json({ error: '账户不存在' });
  }

  if (fromAccount.balance < amount) {
    return res.status(400).json({ error: '余额不足' });
  }

  // 使用事务
  const transfer = db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, fromAccountId);
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, toAccountId);

    // 获取"转账"分类
    let transferCategory = db.prepare("SELECT id FROM categories WHERE name = '转账' AND is_default = 1").get();
    if (!transferCategory) {
      const result = db.prepare("INSERT INTO categories (name, type, icon, is_default) VALUES ('转账', 'expense', '🔄', 1)").run();
      transferCategory = { id: result.lastInsertRowid };
    }

    const today = new Date().toISOString().split('T')[0];

    // 记录转出
    db.prepare(
      'INSERT INTO transactions (user_id, account_id, category_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, fromAccountId, transferCategory.id, 'expense', amount, note || `转账到${toAccount.name}`, today);

    // 记录转入
    db.prepare(
      'INSERT INTO transactions (user_id, account_id, category_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, toAccountId, transferCategory.id, 'income', amount, note || `从${fromAccount.name}转入`, today);
  });

  transfer();

  res.json({ message: '转账成功' });
});

module.exports = router;

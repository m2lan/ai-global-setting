const express = require('express');
const db = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// 收支概览
router.get('/summary', (req, res) => {
  const { month } = req.query;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  // 本月收支
  const monthStats = db.prepare(`
    SELECT
      type,
      COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ? AND date LIKE ?
    GROUP BY type
  `).all(req.userId, `${currentMonth}%`);

  const income = monthStats.find(s => s.type === 'income')?.total || 0;
  const expense = monthStats.find(s => s.type === 'expense')?.total || 0;

  // 总资产
  const totalBalance = db.prepare(
    'SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = ?'
  ).get(req.userId).total;

  // 本月每日收支
  const dailyStats = db.prepare(`
    SELECT
      date,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND date LIKE ?
    GROUP BY date, type
    ORDER BY date
  `).all(req.userId, `${currentMonth}%`);

  res.json({
    month: currentMonth,
    income,
    expense,
    balance: income - expense,
    totalBalance,
    dailyStats
  });
});

// 趋势数据
router.get('/trend', (req, res) => {
  const { months = 6 } = req.query;

  const trend = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND date >= date('now', '-' || ? || ' months')
    GROUP BY month, type
    ORDER BY month
  `).all(req.userId, months);

  // 整理数据格式
  const monthMap = {};
  trend.forEach(item => {
    if (!monthMap[item.month]) {
      monthMap[item.month] = { month: item.month, income: 0, expense: 0 };
    }
    monthMap[item.month][item.type] = item.total;
  });

  res.json(Object.values(monthMap));
});

// 分类统计
router.get('/category', (req, res) => {
  const { month, type = 'expense' } = req.query;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const stats = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.icon,
      SUM(t.amount) as total,
      COUNT(*) as count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = ? AND t.date LIKE ?
    GROUP BY c.id
    ORDER BY total DESC
  `).all(req.userId, type, `${currentMonth}%`);

  // 计算百分比
  const total = stats.reduce((sum, s) => sum + s.total, 0);
  const result = stats.map(s => ({
    ...s,
    percentage: total > 0 ? Math.round(s.total / total * 100) : 0
  }));

  res.json({
    month: currentMonth,
    type,
    total,
    categories: result
  });
});

// 预算执行情况
router.get('/budget-progress', (req, res) => {
  const { month } = req.query;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const budgets = db.prepare(`
    SELECT
      b.id,
      b.amount,
      b.category_id,
      c.name as category_name,
      c.icon as category_icon,
      COALESCE(SUM(t.amount), 0) as spent
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t ON t.category_id = b.category_id
      AND t.user_id = b.user_id
      AND t.type = 'expense'
      AND t.date LIKE ?
    WHERE b.user_id = ? AND b.month = ?
    GROUP BY b.id
  `).all(`${currentMonth}%`, req.userId, currentMonth);

  const result = budgets.map(b => ({
    ...b,
    remaining: b.amount - b.spent,
    percentage: Math.round(b.spent / b.amount * 100)
  }));

  res.json(result);
});

module.exports = router;

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'accounting.db');
const db = new Database(dbPath);

// 启用WAL模式提升性能
db.pragma('journal_mode = WAL');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash',
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    is_default BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    amount REAL NOT NULL,
    month TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(user_id, category_id, month)
  );
`);

// 插入默认分类
const defaultCategories = [
  // 支出分类
  { name: '餐饮', type: 'expense', icon: '🍜' },
  { name: '交通', type: 'expense', icon: '🚗' },
  { name: '购物', type: 'expense', icon: '🛒' },
  { name: '住房', type: 'expense', icon: '🏠' },
  { name: '娱乐', type: 'expense', icon: '🎮' },
  { name: '医疗', type: 'expense', icon: '💊' },
  { name: '教育', type: 'expense', icon: '📚' },
  { name: '通讯', type: 'expense', icon: '📱' },
  { name: '其他', type: 'expense', icon: '📦' },
  // 收入分类
  { name: '工资', type: 'income', icon: '💰' },
  { name: '奖金', type: 'income', icon: '🎁' },
  { name: '投资', type: 'income', icon: '📈' },
  { name: '兼职', type: 'income', icon: '💼' },
  { name: '其他', type: 'income', icon: '💵' }
];

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (name, type, icon, is_default) VALUES (?, ?, ?, 1)'
);

const existingDefaults = db.prepare(
  'SELECT COUNT(*) as count FROM categories WHERE is_default = 1'
).get();

if (existingDefaults.count === 0) {
  const insertMany = db.transaction((categories) => {
    for (const cat of categories) {
      insertCategory.run(cat.name, cat.type, cat.icon);
    }
  });
  insertMany(defaultCategories);
}

module.exports = db;

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>首页概览</h1>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon income">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">¥{{ summary.income.toFixed(2) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon expense">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            <polyline points="17 18 23 18 23 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">¥{{ summary.expense.toFixed(2) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon balance">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月结余</div>
          <div class="stat-value">¥{{ summary.balance.toFixed(2) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-label">总资产</div>
          <div class="stat-value">¥{{ summary.totalBalance.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 最近账单 -->
      <div class="grid-main">
        <div class="card">
          <div class="card-header">
            <h3>最近账单</h3>
            <router-link to="/transactions" class="link-btn">查看全部</router-link>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>备注</th>
                  <th>金额</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in recentTransactions" :key="item.id">
                  <td>
                    <span class="category-tag">{{ item.category_icon }} {{ item.category_name }}</span>
                  </td>
                  <td class="text-muted">{{ item.note || '-' }}</td>
                  <td>
                    <span :class="item.type === 'income' ? 'amount-income' : 'amount-expense'">
                      {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toFixed(2) }}
                    </span>
                  </td>
                  <td class="text-muted">{{ item.date }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="recentTransactions.length === 0" class="empty-state">
              暂无账单记录
            </div>
          </div>
        </div>
      </div>

      <!-- 预算提醒 -->
      <div class="grid-side">
        <div class="card">
          <div class="card-header">
            <h3>预算提醒</h3>
            <router-link to="/budgets" class="link-btn">管理</router-link>
          </div>
          <div class="card-body">
            <div v-if="budgetProgress.length === 0" class="empty-state">
              暂无预算设置
            </div>
            <div v-for="item in budgetProgress" :key="item.id" class="budget-item">
              <div class="budget-top">
                <span class="budget-name">{{ item.category_icon }} {{ item.category_name }}</span>
                <span class="budget-amount">¥{{ item.spent.toFixed(0) }} / ¥{{ item.amount.toFixed(0) }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="{ warning: item.percentage >= 80, danger: item.percentage >= 100 }"
                  :style="{ width: Math.min(item.percentage, 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const summary = ref({
  income: 0,
  expense: 0,
  balance: 0,
  totalBalance: 0
})

const recentTransactions = ref([])
const budgetProgress = ref([])

onMounted(async () => {
  await Promise.all([
    fetchSummary(),
    fetchRecentTransactions(),
    fetchBudgetProgress()
  ])
})

async function fetchSummary() {
  try {
    const data = await api.get('/stats/summary')
    summary.value = data
  } catch (err) {
    console.error('获取概览失败', err)
  }
}

async function fetchRecentTransactions() {
  try {
    const data = await api.get('/transactions', { params: { pageSize: 5 } })
    recentTransactions.value = data.transactions
  } catch (err) {
    console.error('获取账单失败', err)
  }
}

async function fetchBudgetProgress() {
  try {
    const data = await api.get('/stats/budget-progress')
    budgetProgress.value = data
  } catch (err) {
    console.error('获取预算失败', err)
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.income {
  background: #ecfdf5;
  color: #10b981;
}

.stat-icon.expense {
  background: #fef2f2;
  color: #ef4444;
}

.stat-icon.balance {
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.total {
  background: #eef2ff;
  color: #4F46E5;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

/* 网格布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}

/* 卡片 */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.link-btn {
  font-size: 13px;
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
}

.link-btn:hover {
  color: #4338ca;
}

.card-body {
  padding: 16px 20px;
}

/* 表格 */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0 12px;
  border-bottom: 1px solid #f1f5f9;
}

.data-table td {
  padding: 12px 0;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f8fafc;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.category-tag {
  font-size: 13px;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: #94a3b8;
}

.amount-income {
  color: #10b981;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.amount-expense {
  color: #ef4444;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 32px 0;
  font-size: 14px;
}

/* 预算项 */
.budget-item {
  margin-bottom: 16px;
}

.budget-item:last-child {
  margin-bottom: 0;
}

.budget-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.budget-name {
  color: #334155;
  font-weight: 500;
}

.budget-amount {
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4F46E5;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.danger {
  background: #ef4444;
}

/* 响应式 */
@media (max-width: 1100px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
}
</style>

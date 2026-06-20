<template>
  <div class="dashboard">
    <h2>首页概览</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon income">📈</div>
            <div class="stat-info">
              <div class="stat-label">本月收入</div>
              <div class="stat-value">¥{{ summary.income.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon expense">📉</div>
            <div class="stat-info">
              <div class="stat-label">本月支出</div>
              <div class="stat-value">¥{{ summary.expense.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon balance">💰</div>
            <div class="stat-info">
              <div class="stat-label">本月结余</div>
              <div class="stat-value">¥{{ summary.balance.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon total">🏦</div>
            <div class="stat-info">
              <div class="stat-label">总资产</div>
              <div class="stat-value">¥{{ summary.totalBalance.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 最近账单 -->
      <el-col :span="14">
        <el-card class="recent-transactions">
          <template #header>
            <div class="card-header">
              <span>最近账单</span>
              <router-link to="/transactions">
                <el-button text>查看全部</el-button>
              </router-link>
            </div>
          </template>

          <el-table :data="recentTransactions" style="width: 100%">
            <el-table-column label="分类" width="100">
              <template #default="{ row }">
                <span>{{ row.category_icon }} {{ row.category_name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="note" label="备注" />
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.type === 'income' ? 'income-text' : 'expense-text'">
                  {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 预算提醒 -->
      <el-col :span="10">
        <el-card class="budget-alerts">
          <template #header>
            <div class="card-header">
              <span>预算提醒</span>
              <router-link to="/budgets">
                <el-button text>管理预算</el-button>
              </router-link>
            </div>
          </template>

          <div v-if="budgetProgress.length === 0" class="empty-tip">
            暂无预算设置
          </div>

          <div v-for="item in budgetProgress" :key="item.id" class="budget-item">
            <div class="budget-header">
              <span>{{ item.category_icon }} {{ item.category_name }}</span>
              <span>¥{{ item.spent.toFixed(0) }} / ¥{{ item.budget_amount.toFixed(0) }}</span>
            </div>
            <el-progress
              :percentage="Math.min(item.percentage, 100)"
              :status="item.percentage >= 100 ? 'exception' : item.percentage >= 80 ? 'warning' : ''"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
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
.dashboard h2 {
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.income { background: #f0f9eb; }
.stat-icon.expense { background: #fef0f0; }
.stat-icon.balance { background: #fdf6ec; }
.stat-icon.total { background: #ecf5ff; }

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-transactions,
.budget-alerts {
  margin-bottom: 20px;
}

.income-text {
  color: #67c23a;
}

.expense-text {
  color: #f56c6c;
}

.budget-item {
  margin-bottom: 15px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>

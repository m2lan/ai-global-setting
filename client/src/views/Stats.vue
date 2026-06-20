<template>
  <div class="stats">
    <div class="page-header">
      <h1>统计分析</h1>
      <el-date-picker
        v-model="currentMonth"
        type="month"
        placeholder="选择月份"
        value-format="YYYY-MM"
        @change="fetchAllStats"
      />
    </div>

    <!-- 收支概览 -->
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-label">收入</div>
        <div class="summary-value income">¥{{ summary.income.toFixed(2) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">支出</div>
        <div class="summary-value expense">¥{{ summary.expense.toFixed(2) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">结余</div>
        <div :class="['summary-value', summary.balance >= 0 ? 'income' : 'expense']">
          ¥{{ summary.balance.toFixed(2) }}
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <!-- 支出分类饼图 -->
      <div class="card">
        <div class="card-header">
          <h3>支出分类</h3>
        </div>
        <div class="card-body">
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="card">
        <div class="card-header">
          <h3>收支趋势（近6个月）</h3>
        </div>
        <div class="card-body">
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 分类明细 -->
    <div class="card">
      <div class="card-header">
        <h3>分类明细</h3>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>分类</th>
              <th class="text-right">金额</th>
              <th class="text-right">占比</th>
              <th class="text-right">笔数</th>
              <th style="width: 200px">进度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categoryStats.categories" :key="cat.name">
              <td>
                <span class="category-tag">{{ cat.icon }} {{ cat.name }}</span>
              </td>
              <td class="text-right">
                <span class="amount-expense">¥{{ cat.total.toFixed(2) }}</span>
              </td>
              <td class="text-right text-muted">{{ cat.percentage }}%</td>
              <td class="text-right text-muted">{{ cat.count }}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: cat.percentage + '%' }"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="categoryStats.categories.length === 0" class="empty-state">
          暂无数据
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '../api'
import dayjs from 'dayjs'

const currentMonth = ref(dayjs().format('YYYY-MM'))

const summary = ref({ income: 0, expense: 0, balance: 0 })
const categoryStats = ref({ categories: [], total: 0 })
const trendData = ref([])

const pieChartRef = ref()
const trendChartRef = ref()

let pieChart = null
let trendChart = null

onMounted(async () => {
  await fetchAllStats()
  await nextTick()
  initCharts()
})

onUnmounted(() => {
  pieChart?.dispose()
  trendChart?.dispose()
})

async function fetchAllStats() {
  await Promise.all([
    fetchSummary(),
    fetchCategoryStats(),
    fetchTrend()
  ])
  updateCharts()
}

async function fetchSummary() {
  try {
    const data = await api.get('/stats/summary', { params: { month: currentMonth.value } })
    summary.value = data
  } catch (err) {
    console.error(err)
  }
}

async function fetchCategoryStats() {
  try {
    const data = await api.get('/stats/category', { params: { month: currentMonth.value } })
    categoryStats.value = data
  } catch (err) {
    console.error(err)
  }
}

async function fetchTrend() {
  try {
    const data = await api.get('/stats/trend')
    trendData.value = data
  } catch (err) {
    console.error(err)
  }
}

function initCharts() {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  updateCharts()
}

function updateCharts() {
  if (pieChart && categoryStats.value.categories.length > 0) {
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      color: ['#4F46E5', '#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#818CF8', '#6366F1'],
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '50%'],
        data: categoryStats.value.categories.map(c => ({
          name: c.name,
          value: c.total
        })),
        label: { fontSize: 12, color: '#64748b' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.15)' }
        }
      }]
    })
  }

  if (trendChart && trendData.value.length > 0) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['收入', '支出'],
        right: 0,
        top: 0,
        textStyle: { fontSize: 12, color: '#64748b' }
      },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: trendData.value.map(d => d.month),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          data: trendData.value.map(d => d.income),
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 2.5 },
          areaStyle: { color: 'rgba(16, 185, 129, 0.08)' }
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          data: trendData.value.map(d => d.expense),
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2.5 },
          areaStyle: { color: 'rgba(239, 68, 68, 0.08)' }
        }
      ]
    })
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
}

/* 概览卡片 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.summary-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.summary-value.income {
  color: #10b981;
}

.summary-value.expense {
  color: #ef4444;
}

/* 图表网格 */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
}

/* 卡片 */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  padding: 20px;
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
  padding: 14px 0;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f8fafc;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: #94a3b8;
}

.amount-expense {
  color: #ef4444;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.category-tag {
  font-size: 13px;
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
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 32px 0;
  font-size: 14px;
}

@media (max-width: 860px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
  .summary-row {
    grid-template-columns: 1fr;
  }
}
</style>

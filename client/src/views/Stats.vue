<template>
  <div class="stats">
    <h2>统计分析</h2>

    <!-- 月份选择 -->
    <el-card class="filter-card">
      <el-date-picker
        v-model="currentMonth"
        type="month"
        placeholder="选择月份"
        value-format="YYYY-MM"
        @change="fetchAllStats"
      />
    </el-card>

    <el-row :gutter="20">
      <!-- 收支概览 -->
      <el-col :span="8">
        <el-card>
          <template #header>本月概览</template>
          <div class="summary-list">
            <div class="summary-item">
              <span>收入</span>
              <span class="income-text">¥{{ summary.income.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span>支出</span>
              <span class="expense-text">¥{{ summary.expense.toFixed(2) }}</span>
            </div>
            <el-divider />
            <div class="summary-item">
              <span>结余</span>
              <span :class="summary.balance >= 0 ? 'income-text' : 'expense-text'">
                ¥{{ summary.balance.toFixed(2) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 支出分类饼图 -->
      <el-col :span="16">
        <el-card>
          <template #header>支出分类</template>
          <div ref="pieChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card style="margin-top: 20px">
      <template #header>收支趋势（近6个月）</template>
      <div ref="trendChartRef" style="height: 300px"></div>
    </el-card>

    <!-- 分类明细 -->
    <el-card style="margin-top: 20px">
      <template #header>分类明细</template>
      <el-table :data="categoryStats.categories" style="width: 100%">
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <span>{{ row.icon }} {{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="expense-text">¥{{ row.total.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" width="100">
          <template #default="{ row }">
            <span>{{ row.percentage }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="笔数" width="80" prop="count" />
        <el-table-column label="进度">
          <template #default="{ row }">
            <el-progress :percentage="row.percentage" :show-text="false" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
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
  // 更新饼图
  if (pieChart && categoryStats.value.categories.length > 0) {
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: categoryStats.value.categories.map(c => ({
          name: c.name,
          value: c.total
        })),
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    })
  }

  // 更新趋势图
  if (trendChart && trendData.value.length > 0) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出'] },
      xAxis: { type: 'category', data: trendData.value.map(d => d.month) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '收入',
          type: 'line',
          data: trendData.value.map(d => d.income),
          itemStyle: { color: '#67c23a' }
        },
        {
          name: '支出',
          type: 'line',
          data: trendData.value.map(d => d.expense),
          itemStyle: { color: '#f56c6c' }
        }
      ]
    })
  }
}
</script>

<style scoped>
.stats h2 {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-list {
  padding: 10px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 16px;
}

.income-text {
  color: #67c23a;
  font-weight: bold;
}

.expense-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>

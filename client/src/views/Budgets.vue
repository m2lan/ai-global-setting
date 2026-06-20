<template>
  <div class="budgets">
    <div class="page-header">
      <h2>预算管理</h2>
      <el-button type="primary" @click="openDialog()">+ 设置预算</el-button>
    </div>

    <!-- 月份选择 -->
    <el-card class="filter-card">
      <el-date-picker
        v-model="currentMonth"
        type="month"
        placeholder="选择月份"
        value-format="YYYY-MM"
        @change="fetchBudgets"
      />
    </el-card>

    <!-- 预算列表 -->
    <el-row :gutter="20">
      <el-col :span="8" v-for="budget in budgets" :key="budget.id">
        <el-card class="budget-card" shadow="hover">
          <div class="budget-header">
            <span class="budget-category">
              {{ budget.category_icon }} {{ budget.category_name }}
            </span>
            <div class="budget-actions">
              <el-button text type="primary" size="small" @click="openDialog(budget)">编辑</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(budget.id)">
                <template #reference>
                  <el-button text type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div class="budget-amount">
            <span class="spent">¥{{ budget.spent?.toFixed(0) || 0 }}</span>
            <span class="separator"> / </span>
            <span class="total">¥{{ budget.amount.toFixed(0) }}</span>
          </div>
          <el-progress
            :percentage="Math.min(budget.percentage || 0, 100)"
            :status="getProgressStatus(budget.percentage)"
          />
          <div class="budget-remaining">
            剩余: ¥{{ budget.remaining?.toFixed(0) || budget.amount.toFixed(0) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="budgets.length === 0" description="暂无预算设置" />

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑预算' : '设置预算'" width="400">
      <el-form :model="dialog.form" label-width="80px">
        <el-form-item label="分类">
          <el-select
            v-model="dialog.form.category_id"
            placeholder="选择支出分类"
            style="width: 100%"
            :disabled="!!dialog.id"
          >
            <el-option
              v-for="cat in expenseCategories"
              :key="cat.id"
              :label="`${cat.icon} ${cat.name}`"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input v-model="dialog.form.amount" type="number">
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'
import dayjs from 'dayjs'

const currentMonth = ref(dayjs().format('YYYY-MM'))
const budgets = ref([])
const expenseCategories = ref([])

const dialog = reactive({
  visible: false,
  id: null,
  form: { category_id: '', amount: '' }
})

onMounted(async () => {
  await Promise.all([fetchBudgets(), fetchCategories()])
})

async function fetchBudgets() {
  try {
    const data = await api.get('/stats/budget-progress', { params: { month: currentMonth.value } })
    budgets.value = data
  } catch (err) {
    console.error(err)
  }
}

async function fetchCategories() {
  try {
    expenseCategories.value = await api.get('/categories', { params: { type: 'expense' } })
  } catch (err) {
    console.error(err)
  }
}

function getProgressStatus(percentage) {
  if (percentage >= 100) return 'exception'
  if (percentage >= 80) return 'warning'
  return ''
}

function openDialog(budget = null) {
  if (budget) {
    dialog.id = budget.id
    dialog.form = { category_id: budget.category_id, amount: budget.amount }
  } else {
    dialog.id = null
    dialog.form = { category_id: '', amount: '' }
  }
  dialog.visible = true
}

async function handleSave() {
  if (!dialog.form.category_id || !dialog.form.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    const data = { ...dialog.form, month: currentMonth.value }

    if (dialog.id) {
      await api.put(`/budgets/${dialog.id}`, { amount: dialog.form.amount })
    } else {
      await api.post('/budgets', data)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    fetchBudgets()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

async function handleDelete(id) {
  try {
    await api.delete(`/budgets/${id}`)
    ElMessage.success('删除成功')
    fetchBudgets()
  } catch (err) {
    ElMessage.error(err.error || '删除失败')
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.budget-card {
  margin-bottom: 20px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.budget-category {
  font-size: 16px;
  font-weight: bold;
}

.budget-actions {
  display: flex;
  gap: 5px;
}

.budget-amount {
  margin-bottom: 10px;
  font-size: 18px;
}

.budget-amount .spent {
  color: #f56c6c;
  font-weight: bold;
}

.budget-amount .separator {
  color: #909399;
}

.budget-amount .total {
  color: #303133;
}

.budget-remaining {
  margin-top: 10px;
  font-size: 14px;
  color: #67c23a;
}
</style>

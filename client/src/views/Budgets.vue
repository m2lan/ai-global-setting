<template>
  <div class="budgets">
    <div class="page-header">
      <div>
        <h1>预算管理</h1>
        <p class="page-desc">设定每月预算，控制开支</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="currentMonth"
          type="month"
          placeholder="选择月份"
          value-format="YYYY-MM"
          @change="fetchBudgets"
        />
        <button class="btn btn-primary" @click="openDialog()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          设置预算
        </button>
      </div>
    </div>

    <!-- 预算列表 -->
    <div v-if="budgets.length > 0" class="budget-grid">
      <div v-for="budget in budgets" :key="budget.id" class="budget-card">
        <div class="budget-card-header">
          <div class="budget-category">
            <span class="budget-icon">{{ budget.category_icon }}</span>
            <span class="budget-name">{{ budget.category_name }}</span>
          </div>
          <div class="budget-actions">
            <button class="btn-link" @click="openDialog(budget)">编辑</button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(budget.id)">
              <template #reference>
                <button class="btn-link danger">删除</button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <div class="budget-amounts">
          <span class="amount-spent">¥{{ budget.spent?.toFixed(0) || 0 }}</span>
          <span class="amount-sep"> / </span>
          <span class="amount-total">¥{{ budget.amount.toFixed(0) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="{ warning: budget.percentage >= 80 && budget.percentage < 100, danger: budget.percentage >= 100 }"
            :style="{ width: Math.min(budget.percentage || 0, 100) + '%' }"
          ></div>
        </div>
        <div class="budget-remaining">
          剩余 ¥{{ budget.remaining?.toFixed(0) || budget.amount.toFixed(0) }}
        </div>
      </div>
    </div>

    <div v-else class="card">
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
        <p>暂无预算设置</p>
        <button class="btn btn-primary" @click="openDialog()">设置预算</button>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑预算' : '设置预算'" width="440" class="custom-dialog">
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
          <el-input v-model="dialog.form.amount" type="number" placeholder="请输入金额">
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-ghost" @click="dialog.visible = false">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
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
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}

.page-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #4F46E5;
  color: #fff;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-ghost {
  background: #fff;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover {
  background: #f8fafc;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #4F46E5;
  font-weight: 500;
  padding: 0;
}

.btn-link:hover {
  color: #4338ca;
}

.btn-link.danger {
  color: #ef4444;
}

.btn-link.danger:hover {
  color: #dc2626;
}

/* 预算网格 */
.budget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.budget-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.budget-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.budget-category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.budget-icon {
  font-size: 20px;
}

.budget-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.budget-actions {
  display: flex;
  gap: 10px;
}

.budget-amounts {
  margin-bottom: 12px;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.amount-spent {
  font-weight: 700;
  color: #ef4444;
}

.amount-sep {
  color: #cbd5e1;
}

.amount-total {
  color: #334155;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
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

.budget-remaining {
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}

/* 空状态 */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state svg {
  margin-bottom: 16px;
}

.empty-state p {
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 20px;
}

/* 弹窗 */
.custom-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 20px;
  margin: 0;
}

.custom-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

.custom-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid #f1f5f9;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 960px) {
  .budget-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .budget-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>

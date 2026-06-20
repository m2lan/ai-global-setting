<template>
  <div class="transactions">
    <div class="page-header">
      <h1>账单列表</h1>
      <router-link to="/add">
        <button class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记一笔
        </button>
      </router-link>
    </div>

    <!-- 筛选条件 -->
    <div class="card filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label>账户</label>
          <select v-model="filter.account_id" class="input">
            <option value="">全部</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>关键词</label>
          <input v-model="filter.keyword" type="text" class="input" placeholder="搜索备注" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="fetchTransactions">查询</button>
          <button class="btn btn-ghost" @click="resetFilter">重置</button>
        </div>
      </div>
    </div>

    <!-- 账单列表 -->
    <div class="card">
      <div class="card-tabs">
        <button
          :class="['type-tab', { active: filter.type === '' }]"
          @click="filter.type = ''; fetchTransactions()"
        >全部</button>
        <button
          :class="['type-tab', { active: filter.type === 'expense' }]"
          @click="filter.type = 'expense'; fetchTransactions()"
        >支出</button>
        <button
          :class="['type-tab', { active: filter.type === 'income' }]"
          @click="filter.type = 'income'; fetchTransactions()"
        >收入</button>
      </div>
      <div class="card-body" v-loading="loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>分类</th>
              <th>备注</th>
              <th>账户</th>
              <th>金额</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in transactions" :key="item.id">
              <td>
                <span :class="['type-tag', item.type === 'income' ? 'type-income' : 'type-expense']">
                  {{ item.type === 'income' ? '收入' : '支出' }}
                </span>
              </td>
              <td>
                <span class="category-tag">{{ item.category_icon }} {{ item.category_name }}</span>
              </td>
              <td class="text-muted">{{ item.note || '-' }}</td>
              <td class="text-muted">{{ item.account_name }}</td>
              <td>
                <span :class="item.type === 'income' ? 'amount-income' : 'amount-expense'">
                  {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toFixed(2) }}
                </span>
              </td>
              <td class="text-muted">{{ item.date }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-link" @click="handleEdit(item)">编辑</button>
                  <el-popconfirm title="确定删除？" @confirm="handleDelete(item.id)">
                    <template #reference>
                      <button class="btn-link danger">删除</button>
                    </template>
                  </el-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="transactions.length === 0 && !loading" class="empty-state">
          暂无账单记录
        </div>
      </div>
      <div class="card-footer" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchTransactions"
          @current-change="fetchTransactions"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialog.visible" title="编辑账单" width="480" class="custom-dialog">
      <el-form :model="editDialog.form" label-width="70px">
        <el-form-item label="类型">
          <el-radio-group v-model="editDialog.form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="editDialog.form.amount" type="number">
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editDialog.form.note" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="editDialog.form.date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-ghost" @click="editDialog.visible = false">取消</button>
        <button class="btn btn-primary" @click="handleUpdate">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const loading = ref(false)
const transactions = ref([])
const accounts = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const filter = reactive({
  type: '',
  account_id: '',
  keyword: ''
})

const editDialog = reactive({
  visible: false,
  id: null,
  form: {}
})

onMounted(async () => {
  await fetchAccounts()
  await fetchTransactions()
})

async function fetchAccounts() {
  try {
    accounts.value = await api.get('/accounts')
  } catch (err) {
    console.error('获取账户失败', err)
  }
}

async function fetchTransactions() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: filter.type || undefined,
      account_id: filter.account_id || undefined,
      keyword: filter.keyword || undefined
    }
    const data = await api.get('/transactions', { params })
    transactions.value = data.transactions
    pagination.total = data.pagination.total
  } catch (err) {
    ElMessage.error('获取账单失败')
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filter.type = ''
  filter.account_id = ''
  filter.keyword = ''
  pagination.page = 1
  fetchTransactions()
}

function handleEdit(row) {
  editDialog.id = row.id
  editDialog.form = {
    type: row.type,
    amount: row.amount,
    note: row.note,
    date: row.date
  }
  editDialog.visible = true
}

async function handleUpdate() {
  try {
    await api.put(`/transactions/${editDialog.id}`, editDialog.form)
    ElMessage.success('更新成功')
    editDialog.visible = false
    fetchTransactions()
  } catch (err) {
    ElMessage.error(err.error || '更新失败')
  }
}

async function handleDelete(id) {
  try {
    await api.delete(`/transactions/${id}`)
    ElMessage.success('删除成功')
    fetchTransactions()
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
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
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
  border-color: #cbd5e1;
}

/* 卡片 */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.card-body {
  padding: 20px;
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

/* 卡片内 tabs */
.card-tabs {
  display: flex;
  gap: 0;
  padding: 0 20px;
  border-bottom: 1px solid #f1f5f9;
}

.type-tab {
  padding: 14px 18px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}

.type-tab:hover {
  color: #334155;
}

.type-tab.active {
  color: #4F46E5;
}

.type-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 18px;
  height: 2px;
  background: #4F46E5;
  border-radius: 1px;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-income {
  background: #ecfdf5;
  color: #10b981;
}

.type-expense {
  background: #fef2f2;
  color: #ef4444;
}

/* 筛选 */
.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  background: #fff;
  outline: none;
  transition: border-color 0.15s ease;
  min-width: 140px;
}

.input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
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

.category-tag {
  font-size: 13px;
}

.action-btns {
  display: flex;
  gap: 12px;
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

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 48px 0;
  font-size: 14px;
}

/* 弹窗覆盖 */
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
</style>

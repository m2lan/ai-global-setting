<template>
  <div class="transactions">
    <div class="page-header">
      <h2>账单列表</h2>
      <router-link to="/add">
        <el-button type="primary">+ 记一笔</el-button>
      </router-link>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="类型">
          <el-select v-model="filter.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户">
          <el-select v-model="filter.account_id" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="搜索备注" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchTransactions">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账单列表 -->
    <el-card>
      <el-table :data="transactions" style="width: 100%" v-loading="loading">
        <el-table-column label="分类" min-width="100">
          <template #default="{ row }">
            <span>{{ row.category_icon }} {{ row.category_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="account_name" label="账户" min-width="80" />
        <el-table-column label="金额" min-width="100" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-text' : 'expense-text'">
              {{ row.type === 'income' ? '+' : '-' }}{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" min-width="100" />
        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialog.visible" title="编辑账单" width="500">
      <el-form :model="editDialog.form" label-width="80px">
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
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">保存</el-button>
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
  dateRange: null,
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
      keyword: filter.keyword || undefined,
      start_date: filter.dateRange?.[0] || undefined,
      end_date: filter.dateRange?.[1] || undefined
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
  filter.dateRange = null
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
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

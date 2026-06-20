<template>
  <div class="add-transaction">
    <div class="page-header">
      <h1>记一笔</h1>
    </div>

    <div class="card">
      <div class="card-body">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="70px"
          @submit.prevent="handleSubmit"
        >
          <!-- 类型切换 -->
          <el-form-item label="类型">
            <el-radio-group v-model="form.type" @change="handleTypeChange">
              <el-radio-button value="expense">支出</el-radio-button>
              <el-radio-button value="income">收入</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 金额 -->
          <el-form-item label="金额" prop="amount">
            <el-input
              v-model="form.amount"
              type="number"
              placeholder="请输入金额"
              size="large"
            >
              <template #prefix>¥</template>
            </el-input>
          </el-form-item>

          <!-- 分类 -->
          <el-form-item label="分类" prop="category_id">
            <div class="category-grid">
              <div
                v-for="cat in categories"
                :key="cat.id"
                :class="['category-item', { active: form.category_id === cat.id }]"
                @click="form.category_id = cat.id"
              >
                <span class="category-icon">{{ cat.icon }}</span>
                <span class="category-name">{{ cat.name }}</span>
              </div>
            </div>
          </el-form-item>

          <!-- 账户 -->
          <el-form-item label="账户" prop="account_id">
            <el-select v-model="form.account_id" placeholder="选择账户" style="width: 100%">
              <el-option
                v-for="account in accounts"
                :key="account.id"
                :label="`${account.name} (¥${account.balance.toFixed(2)})`"
                :value="account.id"
              />
            </el-select>
          </el-form-item>

          <!-- 日期 -->
          <el-form-item label="日期" prop="date">
            <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <!-- 备注 -->
          <el-form-item label="备注">
            <el-input
              v-model="form.note"
              placeholder="添加备注（可选）"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <button
              type="button"
              class="btn-submit"
              :disabled="loading"
              @click="handleSubmit"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import dayjs from 'dayjs'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const categories = ref([])
const accounts = ref([])

const form = reactive({
  type: 'expense',
  amount: '',
  category_id: '',
  account_id: '',
  date: dayjs().format('YYYY-MM-DD'),
  note: ''
})

const rules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '金额格式不正确', trigger: 'blur' }
  ],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  account_id: [{ required: true, message: '请选择账户', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchAccounts()])
})

async function fetchCategories() {
  try {
    const data = await api.get('/categories', { params: { type: form.type } })
    categories.value = data
  } catch (err) {
    console.error('获取分类失败', err)
  }
}

async function fetchAccounts() {
  try {
    const data = await api.get('/accounts')
    accounts.value = data
    if (data.length > 0 && !form.account_id) {
      form.account_id = data[0].id
    }
  } catch (err) {
    console.error('获取账户失败', err)
  }
}

function handleTypeChange() {
  form.category_id = ''
  fetchCategories()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await api.post('/transactions', form)
    ElMessage.success('记账成功')
    router.push('/transactions')
  } catch (err) {
    ElMessage.error(err.error || '记账失败')
  } finally {
    loading.value = false
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

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  max-width: 640px;
}

.card-body {
  padding: 28px;
}

/* 分类选择 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 14px;
  min-width: 72px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.category-item:hover {
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.category-item.active {
  border-color: #4F46E5;
  background: #eef2ff;
}

.category-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.category-name {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.category-item.active .category-name {
  color: #4F46E5;
}

/* 提交按钮 */
.btn-submit {
  width: 100%;
  height: 44px;
  background: #4F46E5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-submit:hover {
  background: #4338ca;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

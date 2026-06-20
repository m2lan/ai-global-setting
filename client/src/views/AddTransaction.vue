<template>
  <div class="add-transaction">
    <h2>记一笔</h2>

    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
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
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleSubmit"
          >
            保存
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
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
.add-transaction h2 {
  margin-bottom: 20px;
}

.category-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  min-width: 70px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.category-item:hover {
  border-color: #409eff;
}

.category-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.category-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.category-name {
  font-size: 12px;
}
</style>

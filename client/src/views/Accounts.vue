<template>
  <div class="accounts">
    <div class="page-header">
      <h2>账户管理</h2>
      <el-button type="primary" @click="openDialog()">+ 添加账户</el-button>
    </div>

    <!-- 总资产 -->
    <el-card class="total-card">
      <div class="total-balance">
        <span>总资产</span>
        <span class="amount">¥{{ totalBalance.toFixed(2) }}</span>
      </div>
    </el-card>

    <!-- 账户列表 -->
    <el-row :gutter="20">
      <el-col :span="8" v-for="account in accounts" :key="account.id">
        <el-card class="account-card" shadow="hover">
          <div class="account-info">
            <div class="account-icon">{{ getAccountIcon(account.type) }}</div>
            <div class="account-detail">
              <div class="account-name">{{ account.name }}</div>
              <div class="account-type">{{ getAccountTypeName(account.type) }}</div>
            </div>
          </div>
          <div class="account-balance">
            ¥{{ account.balance.toFixed(2) }}
          </div>
          <div class="account-actions">
            <el-button text type="primary" size="small" @click="openDialog(account)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(account.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 转账卡片 -->
    <el-card style="margin-top: 20px">
      <template #header>账户转账</template>
      <el-form :inline="true" :model="transferForm">
        <el-form-item label="从">
          <el-select v-model="transferForm.fromAccountId" placeholder="转出账户">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到">
          <el-select v-model="transferForm.toAccountId" placeholder="转入账户">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="transferForm.amount" type="number" placeholder="金额">
            <template #prefix>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleTransfer">转账</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑账户' : '添加账户'" width="400">
      <el-form :model="dialog.form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="dialog.form.name" placeholder="账户名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="dialog.form.type" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="银行卡" value="bank" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
            <el-option label="信用卡" value="credit" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始余额" v-if="!dialog.id">
          <el-input v-model="dialog.form.balance" type="number">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const accounts = ref([])

const totalBalance = computed(() => {
  return accounts.value.reduce((sum, a) => sum + a.balance, 0)
})

const dialog = reactive({
  visible: false,
  id: null,
  form: { name: '', type: 'cash', balance: 0 }
})

const transferForm = reactive({
  fromAccountId: '',
  toAccountId: '',
  amount: ''
})

onMounted(() => {
  fetchAccounts()
})

async function fetchAccounts() {
  try {
    accounts.value = await api.get('/accounts')
  } catch (err) {
    console.error(err)
  }
}

function getAccountIcon(type) {
  const icons = { cash: '💵', bank: '🏦', alipay: '💙', wechat: '💚', credit: '💳', other: '📁' }
  return icons[type] || '📁'
}

function getAccountTypeName(type) {
  const names = { cash: '现金', bank: '银行卡', alipay: '支付宝', wechat: '微信', credit: '信用卡', other: '其他' }
  return names[type] || '其他'
}

function openDialog(account = null) {
  if (account) {
    dialog.id = account.id
    dialog.form = { name: account.name, type: account.type }
  } else {
    dialog.id = null
    dialog.form = { name: '', type: 'cash', balance: 0 }
  }
  dialog.visible = true
}

async function handleSave() {
  if (!dialog.form.name) {
    ElMessage.warning('请输入账户名称')
    return
  }

  try {
    if (dialog.id) {
      await api.put(`/accounts/${dialog.id}`, dialog.form)
    } else {
      await api.post('/accounts', dialog.form)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    fetchAccounts()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

async function handleDelete(id) {
  try {
    await api.delete(`/accounts/${id}`)
    ElMessage.success('删除成功')
    fetchAccounts()
  } catch (err) {
    ElMessage.error(err.error || '删除失败')
  }
}

async function handleTransfer() {
  if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
    ElMessage.warning('请填写完整的转账信息')
    return
  }

  try {
    await api.post('/accounts/transfer', transferForm)
    ElMessage.success('转账成功')
    transferForm.fromAccountId = ''
    transferForm.toAccountId = ''
    transferForm.amount = ''
    fetchAccounts()
  } catch (err) {
    ElMessage.error(err.error || '转账失败')
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

.total-card {
  margin-bottom: 20px;
}

.total-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
}

.total-balance .amount {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.account-card {
  margin-bottom: 20px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.account-icon {
  font-size: 36px;
}

.account-name {
  font-size: 16px;
  font-weight: bold;
}

.account-type {
  font-size: 12px;
  color: #909399;
}

.account-balance {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.account-actions {
  display: flex;
  gap: 10px;
}
</style>

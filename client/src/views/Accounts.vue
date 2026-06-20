<template>
  <div class="accounts">
    <div class="page-header">
      <div>
        <h1>账户管理</h1>
        <p class="page-desc">管理你的所有资金账户</p>
      </div>
      <button class="btn btn-primary" @click="openDialog()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加账户
      </button>
    </div>

    <!-- 总资产 -->
    <div class="total-card">
      <div class="total-label">总资产</div>
      <div class="total-amount">¥{{ totalBalance.toFixed(2) }}</div>
    </div>

    <!-- 账户列表 -->
    <div class="account-grid">
      <div v-for="account in accounts" :key="account.id" class="account-card">
        <div class="account-card-top">
          <div class="account-icon-box">
            <span class="account-emoji">{{ getAccountIcon(account.type) }}</span>
          </div>
          <div class="account-info">
            <div class="account-name">{{ account.name }}</div>
            <div class="account-type">{{ getAccountTypeName(account.type) }}</div>
          </div>
        </div>
        <div class="account-balance">¥{{ account.balance.toFixed(2) }}</div>
        <div class="account-actions">
          <button class="btn-link" @click="openDialog(account)">编辑</button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(account.id)">
            <template #reference>
              <button class="btn-link danger">删除</button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 转账 -->
    <div class="card transfer-card">
      <div class="card-header">
        <h3>账户转账</h3>
      </div>
      <div class="card-body">
        <div class="transfer-row">
          <div class="transfer-field">
            <label>转出账户</label>
            <select v-model="transferForm.fromAccountId" class="input">
              <option value="">请选择</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div class="transfer-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div class="transfer-field">
            <label>转入账户</label>
            <select v-model="transferForm.toAccountId" class="input">
              <option value="">请选择</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>
          <div class="transfer-field">
            <label>金额</label>
            <input v-model="transferForm.amount" type="number" class="input" placeholder="¥ 0.00" />
          </div>
          <button class="btn btn-primary" @click="handleTransfer">转账</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑账户' : '添加账户'" width="440" class="custom-dialog">
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
        <button class="btn btn-ghost" @click="dialog.visible = false">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
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

/* 总资产 */
.total-card {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
}

.total-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.total-amount {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

/* 账户网格 */
.account-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.account-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.account-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.account-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-emoji {
  font-size: 22px;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.account-type {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.account-balance {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 14px;
  font-variant-numeric: tabular-nums;
}

.account-actions {
  display: flex;
  gap: 12px;
}

/* 转账卡片 */
.transfer-card {
  margin-top: 0;
}

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

.transfer-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.transfer-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 140px;
}

.transfer-field label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.transfer-arrow {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
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
}

.input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
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
  .account-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  .transfer-row {
    flex-direction: column;
    align-items: stretch;
  }
  .transfer-arrow {
    transform: rotate(90deg);
    justify-content: center;
    padding: 0;
  }
}
</style>

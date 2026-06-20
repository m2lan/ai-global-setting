<template>
  <div class="categories">
    <div class="page-header">
      <div>
        <h1>分类管理</h1>
        <p class="page-desc">自定义收入和支出分类</p>
      </div>
      <button class="btn btn-primary" @click="openDialog()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加分类
      </button>
    </div>

    <div class="category-columns">
      <!-- 支出分类 -->
      <div class="card">
        <div class="card-header">
          <h3>支出分类</h3>
          <span class="badge">{{ expenseCategories.length }}</span>
        </div>
        <div class="card-body category-list">
          <div
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-icon">{{ cat.icon }}</span>
              <span class="category-name">{{ cat.name }}</span>
              <span v-if="cat.is_default" class="tag">默认</span>
            </div>
            <div class="category-actions" v-if="!cat.is_default">
              <button class="btn-link" @click="openDialog(cat)">编辑</button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(cat.id)">
                <template #reference>
                  <button class="btn-link danger">删除</button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="expenseCategories.length === 0" class="empty-tip">暂无分类</div>
        </div>
      </div>

      <!-- 收入分类 -->
      <div class="card">
        <div class="card-header">
          <h3>收入分类</h3>
          <span class="badge">{{ incomeCategories.length }}</span>
        </div>
        <div class="card-body category-list">
          <div
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-icon">{{ cat.icon }}</span>
              <span class="category-name">{{ cat.name }}</span>
              <span v-if="cat.is_default" class="tag">默认</span>
            </div>
            <div class="category-actions" v-if="!cat.is_default">
              <button class="btn-link" @click="openDialog(cat)">编辑</button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(cat.id)">
                <template #reference>
                  <button class="btn-link danger">删除</button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="incomeCategories.length === 0" class="empty-tip">暂无分类</div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑分类' : '添加分类'" width="440" class="custom-dialog">
      <el-form :model="dialog.form" label-width="70px">
        <el-form-item label="类型">
          <el-radio-group v-model="dialog.form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="dialog.form.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-grid">
            <span
              v-for="icon in icons"
              :key="icon"
              :class="['icon-item', { active: dialog.form.icon === icon }]"
              @click="dialog.form.icon = icon"
            >
              {{ icon }}
            </span>
          </div>
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

const categories = ref([])

const icons = ['🍜', '🚗', '🛒', '🏠', '🎮', '💊', '📚', '📱', '📦', '💰', '🎁', '📈', '💼', '💵', '🍕', '☕', '🎬', '✈️', '🏋️', '🎵']

const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'))
const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'))

const dialog = reactive({
  visible: false,
  id: null,
  form: { name: '', type: 'expense', icon: '' }
})

onMounted(() => {
  fetchCategories()
})

async function fetchCategories() {
  try {
    categories.value = await api.get('/categories')
  } catch (err) {
    console.error(err)
  }
}

function openDialog(category = null) {
  if (category) {
    dialog.id = category.id
    dialog.form = { name: category.name, type: category.type, icon: category.icon }
  } else {
    dialog.id = null
    dialog.form = { name: '', type: 'expense', icon: '📦' }
  }
  dialog.visible = true
}

async function handleSave() {
  if (!dialog.form.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  try {
    if (dialog.id) {
      await api.put(`/categories/${dialog.id}`, dialog.form)
    } else {
      await api.post('/categories', dialog.form)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    fetchCategories()
  } catch (err) {
    ElMessage.error(err.error || '保存失败')
  }
}

async function handleDelete(id) {
  try {
    await api.delete(`/categories/${id}`)
    ElMessage.success('删除成功')
    fetchCategories()
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

/* 页面容器撑满屏幕 */
.categories {
  min-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
}

/* 双列布局 */
.category-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

/* 卡片 */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-body {
  padding: 0;
  flex: 1;
}

/* 分类列表撑满卡片，超出滚动 */
.category-list {
  flex: 1;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s ease;
}

.category-item:last-child {
  border-bottom: none;
}

.category-item:hover {
  background: #f8fafc;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  font-size: 22px;
}

.category-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-actions {
  display: flex;
  gap: 12px;
}

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
  font-size: 14px;
}

/* 图标选择 */
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-item {
  font-size: 22px;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
}

.icon-item:hover {
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.icon-item.active {
  border-color: #4F46E5;
  background: #eef2ff;
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

@media (max-width: 768px) {
  .category-columns {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>

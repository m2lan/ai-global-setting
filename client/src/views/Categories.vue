<template>
  <div class="categories">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openDialog()">+ 添加分类</el-button>
    </div>

    <el-row :gutter="20">
      <!-- 支出分类 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>支出分类</span>
          </template>
          <div class="category-list">
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              class="category-item"
            >
              <div class="category-info">
                <span class="category-icon">{{ cat.icon }}</span>
                <span class="category-name">{{ cat.name }}</span>
                <el-tag v-if="cat.is_default" size="small" type="info">默认</el-tag>
              </div>
              <div class="category-actions" v-if="!cat.is_default">
                <el-button text type="primary" size="small" @click="openDialog(cat)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="handleDelete(cat.id)">
                  <template #reference>
                    <el-button text type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 收入分类 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>收入分类</span>
          </template>
          <div class="category-list">
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              class="category-item"
            >
              <div class="category-info">
                <span class="category-icon">{{ cat.icon }}</span>
                <span class="category-name">{{ cat.name }}</span>
                <el-tag v-if="cat.is_default" size="small" type="info">默认</el-tag>
              </div>
              <div class="category-actions" v-if="!cat.is_default">
                <el-button text type="primary" size="small" @click="openDialog(cat)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="handleDelete(cat.id)">
                  <template #reference>
                    <el-button text type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑分类' : '添加分类'" width="400">
      <el-form :model="dialog.form" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="dialog.form.type">
            <el-radio value="expense">支出</el-radio>
            <el-radio value="income">收入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="dialog.form.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-select">
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
  align-items: center;
  margin-bottom: 20px;
}

.category-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-size: 14px;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.icon-select {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-item {
  font-size: 24px;
  padding: 8px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
}

.icon-item:hover {
  border-color: #409eff;
}

.icon-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}
</style>

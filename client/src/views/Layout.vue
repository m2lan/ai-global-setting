<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">💰 记账本</div>
      <div class="user-info">
        <span>{{ userStore.user?.username }}</span>
        <el-button text @click="handleLogout">退出</el-button>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="route.path"
          router
          class="side-menu"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/add">
            <el-icon><Plus /></el-icon>
            <span>记账</span>
          </el-menu-item>
          <el-menu-item index="/transactions">
            <el-icon><List /></el-icon>
            <span>账单</span>
          </el-menu-item>
          <el-menu-item index="/stats">
            <el-icon><DataAnalysis /></el-icon>
            <span>统计</span>
          </el-menu-item>
          <el-menu-item index="/accounts">
            <el-icon><Wallet /></el-icon>
            <span>账户</span>
          </el-menu-item>
          <el-menu-item index="/categories">
            <el-icon><Grid /></el-icon>
            <span>分类</span>
          </el-menu-item>
          <el-menu-item index="/budgets">
            <el-icon><Money /></el-icon>
            <span>预算</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import {
  House, Plus, List, DataAnalysis,
  Wallet, Grid, Money
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  userStore.fetchUser()
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aside {
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.side-menu {
  border-right: none;
}

.main {
  background: #f5f7fa;
  padding: 20px;
}
</style>

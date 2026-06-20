<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <div class="auth-left-content">
        <div class="auth-brand">
          <div class="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5"/>
              <path d="M8 12h16M8 16h16M8 20h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="auth-brand-name">EasyBooks</span>
        </div>
        <h1 class="auth-headline">智能记账<br/>轻松理财</h1>
        <p class="auth-subtitle">简洁高效的个人财务管理工具，帮你掌控每一笔收支。</p>
        <div class="auth-features">
          <div class="auth-feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.18 18.02L10 15.77L5.82 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="#4F46E5"/>
              </svg>
            </div>
            <div>
              <div class="feature-title">多账本管理</div>
              <div class="feature-desc">支持现金、银行卡等多种账户</div>
            </div>
          </div>
          <div class="auth-feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V7l7-5 7 5v10a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke="#4F46E5" stroke-width="1.5" fill="none"/>
                <path d="M8 17v-5h4v5" stroke="#4F46E5" stroke-width="1.5"/>
              </svg>
            </div>
            <div>
              <div class="feature-title">分类统计</div>
              <div class="feature-desc">清晰的收支分类与图表分析</div>
            </div>
          </div>
          <div class="auth-feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#4F46E5" stroke-width="1.5" fill="none"/>
                <path d="M10 6v4l3 3" stroke="#4F46E5" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <div class="feature-title">快速记录</div>
              <div class="feature-desc">三秒完成一笔记账</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-right">
      <div class="auth-form-wrapper">
        <div class="auth-form-header">
          <h2>{{ title }}</h2>
          <p class="auth-form-desc">{{ subtitle }}</p>
        </div>
        <slot />
        <div class="auth-link">
          <span class="auth-link-hint">{{ linkHint }}</span>
          <router-link :to="linkTo">{{ linkText }}</router-link>
        </div>
      </div>
      <div class="auth-footer">
        <span>&copy; {{ year }} EasyBooks. All rights reserved.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  linkTo: { type: String, required: true },
  linkText: { type: String, required: true },
  linkHint: { type: String, default: '' }
})

const year = new Date().getFullYear()
</script>

<style scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* 左侧品牌区 */
.auth-left {
  flex: 1;
  background: #4F46E5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.auth-left::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.auth-left::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
}

.auth-left-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 48px;
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.auth-headline {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 0 0 16px;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0 0 48px;
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon svg path,
.feature-icon svg circle,
.feature-icon svg rect {
  fill: #fff;
  stroke: #fff;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* 右侧表单区 */
.auth-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 380px;
}

.auth-form-header {
  margin-bottom: 32px;
}

.auth-form-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.auth-form-desc {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.auth-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #94a3b8;
}

.auth-link-hint {
  margin-right: 4px;
}

.auth-link a {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.auth-link a:hover {
  color: #4338ca;
}

.auth-footer {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

/* 响应式 */
@media (max-width: 860px) {
  .auth-page {
    flex-direction: column;
  }
  .auth-left {
    padding: 40px 24px;
  }
  .auth-left-content {
    max-width: 100%;
  }
  .auth-headline {
    font-size: 28px;
  }
  .auth-features {
    display: none;
  }
  .auth-right {
    padding: 40px 24px;
  }
  .auth-footer {
    position: static;
    margin-top: 40px;
  }
}
</style>

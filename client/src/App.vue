<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8fafc;
  color: #334155;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Element Plus 全局覆盖 */
.el-button--primary {
  background-color: #4F46E5 !important;
  border-color: #4F46E5 !important;
}

.el-button--primary:hover,
.el-button--primary:focus {
  background-color: #4338ca !important;
  border-color: #4338ca !important;
}

.el-radio-button__original-radio:checked + .el-radio-button__inner {
  background-color: #4F46E5 !important;
  border-color: #4F46E5 !important;
}

.el-pagination.is-background .el-pager li.is-active {
  background-color: #4F46E5 !important;
}

.el-tag--info {
  --el-tag-bg-color: #f1f5f9;
  --el-tag-border-color: #e2e8f0;
  --el-tag-text-color: #64748b;
}

.el-message-box__headerbtn:focus .el-message-box__close,
.el-message-box__headerbtn:hover .el-message-box__close {
  color: #4F46E5 !important;
}

/* 日期选择器弹窗全局覆盖 */
.el-picker-panel {
  border-color: #e2e8f0 !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.el-date-picker__header-label:hover,
.el-date-picker__header .el-icon:hover {
  color: #4F46E5 !important;
}

.el-picker-panel__icon-btn:hover {
  color: #4F46E5 !important;
}

.el-date-table td.today .el-date-table-cell__text {
  color: #4F46E5 !important;
}

.el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background-color: #4F46E5 !important;
  color: #fff !important;
}

.el-date-table td.available:hover .el-date-table-cell__text {
  background-color: #eef2ff !important;
  color: #4F46E5 !important;
}

.el-date-table td.in-range .el-date-table-cell {
  background-color: #eef2ff !important;
}

.el-date-table td.start-date .el-date-table-cell,
.el-date-table td.end-date .el-date-table-cell {
  background-color: #4F46E5 !important;
  color: #fff !important;
}

.el-month-table td.today .el-date-table-cell__text {
  color: #4F46E5 !important;
}

.el-month-table td.current .el-date-table-cell__text {
  background-color: #4F46E5 !important;
  color: #fff !important;
}

.el-month-table td:hover .el-date-table-cell__text {
  background-color: #eef2ff !important;
  color: #4F46E5 !important;
}

.el-year-table td.today .el-date-table-cell__text {
  color: #4F46E5 !important;
}

.el-year-table td.current .el-date-table-cell__text {
  background-color: #4F46E5 !important;
  color: #fff !important;
}

.el-year-table td:hover .el-date-table-cell__text {
  background-color: #eef2ff !important;
  color: #4F46E5 !important;
}

.el-picker-panel__footer .el-button--primary {
  background-color: #4F46E5 !important;
  border-color: #4F46E5 !important;
}

.el-picker-panel__shortcut:hover {
  color: #4F46E5 !important;
}

.el-date-range-picker__content {
  border-color: #f1f5f9 !important;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

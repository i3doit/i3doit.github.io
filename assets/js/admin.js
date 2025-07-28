// 管理员认证
const ADMIN_TOKEN = 'SECURE_ADMIN_TOKEN';

// 检查权限
function checkAdminAuth() {
  const token = localStorage.getItem('admin_token');
  if (token !== ADMIN_TOKEN) {
    window.location.href = 'unauthorized.html';
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  
  // 返回按钮
  document.getElementById('back-to-main').addEventListener('click', () => {
    window.location.href = 'https://i3doit.github.io/AI_Tools.html';
  });
  
  // 加载工具数据
  loadTools();
});

// Google Apps Script部署步骤：
// 1. 创建Google Apps Script
// 2. 部署为Web应用（执行权限：我，访问权限：任何人）
// 3. 使用以下代码处理请求
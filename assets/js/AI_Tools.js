// 安全增强函数：防止XSS攻击
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// URL安全验证
function isValidURL(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

// 分类关键字映射
const categoryKeywords = {
    '写作': ['写作', '文案', '文章', '内容', '生成', 'grammar', 'copy', 'write', '文本'],
    '设计': ['设计', '图片', '图像', '绘图', '视觉', 'art', 'design', 'draw', '画', '图'],
    '编程': ['编程', '代码', '开发', '程序员', '技术', 'code', 'dev', '编程', '开发'],
    '研究': ['研究', '分析', '数据', '科学', '搜索', 'research', 'analy', 'data', '科学'],
    '视频': ['视频', '剪辑', '制作', '动画', 'movie', 'video', '剪辑', '动画'],
    '音乐': ['音乐', '音频', '声音', 'sound', 'music', '音效', '作曲'],
    '其他': []
};

// 分类颜色映射
const categoryColors = {
    '写作': 'category-writing',
    '设计': 'category-design',
    '编程': 'category-coding',
    '研究': 'category-research',
    '视频': 'category-video',
    '音乐': 'category-music',
    '其他': 'category-other'
};

// Google Sheets配置
const GOOGLE_SHEETS_API_KEY = 'AKfycbxrBw6eYu7YV1VOMhDgFDP01QjvzKnO7kFTUHZmbWuqB8yRMMtA1-mvfv9PkpJfOgDxvw'; // 替换为你的API密钥
const SPREADSHEET_ID = '1-WO9PGnJOZDlR38OZW_l96Sv3brp2AT5CwMI4bFdg5U'; // 替换为你的电子表格ID

// 工具数组（从Google Sheets加载）
let tools = [];
// 分类数组（从Google Sheets加载）
let categories = [];
// 互动数据（从Google Sheets加载）
let interactions = [];

let currentPage = 1;
let currentCategory = 'all';
const toolsPerPage = 8;

// 用户状态（模拟管理员）
let isAdminMode = false;

// DOM元素
const toolsContainer = document.getElementById('tools-container');
const paginationContainer = document.getElementById('pagination');
const categoriesContainer = document.getElementById('categories-container');
const statsContainer = document.getElementById('stats-container');
const addToolBtn = document.getElementById('add-tool-btn');
const toolNameInput = document.getElementById('tool-name');
const toolUrlInput = document.getElementById('tool-url');
const toolDescInput = document.getElementById('tool-description');
const toolCategorySelect = document.getElementById('tool-category');
const newCategoryInput = document.getElementById('new-category');
const editModal = document.getElementById('edit-modal');
const editToolName = document.getElementById('edit-tool-name');
const editToolUrl = document.getElementById('edit-tool-url');
const editToolDesc = document.getElementById('edit-tool-description');
const editToolCategory = document.getElementById('edit-tool-category');
const editToolId = document.getElementById('edit-tool-id');
const saveEditBtn = document.getElementById('save-edit-btn');
const closeEditModal = document.getElementById('close-edit-modal');
const headerTrigger = document.getElementById('header-trigger');
const footerTrigger = document.getElementById('footer-trigger');
const addToolForm = document.getElementById('add-tool-form');
const closeFormBtn = document.getElementById('close-form-btn');
const uploadForm = document.getElementById('upload-form');
const fileUpload = document.getElementById('file-upload');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const authorName = document.getElementById('author-name');
const authorWechat = document.getElementById('author-wechat');
const fileDescription = document.getElementById('file-description');
const uploadBtn = document.getElementById('upload-btn');
const closeUploadBtn = document.getElementById('close-upload-btn');
const addToolTip = document.getElementById('add-tool-tip');
const statsSection = document.getElementById('stats-section');
const closeStatsBtn = document.getElementById('close-stats');
const refreshStatsBtn = document.getElementById('refresh-stats');
const rankingModal = document.getElementById('ranking-modal');
const rankingTitle = document.getElementById('ranking-title');
const rankingList = document.getElementById('ranking-list');
const closeRanking = document.getElementById('close-ranking');
const shareModal = document.getElementById('share-modal');
const shareTitle = document.getElementById('share-title');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link');
const closeShare = document.getElementById('close-share');
const copyright = document.getElementById('copyright');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 更新版权年份
    const year = new Date().getFullYear();
    copyright.textContent = `© ${year} 艾兜兜儿AI工具箱 | 让AI工具触手可及`;
    
    // 从Google Sheets加载数据
    await loadDataFromSheets();
    
    // 渲染页面
    renderCategories();
    renderCategoryOptions();
    renderTools();
    setupEventListeners();
});

// 从Google Sheets加载数据
async function loadDataFromSheets() {
    try {
        // 1. 加载工具数据
        const toolsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/AI_Tools!A1:I?key=${GOOGLE_SHEETS_API_KEY}`
        );
        const toolsData = await toolsRes.json();
        
        // 2. 加载分类数据
        const catsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Categories!A1:C?key=${GOOGLE_SHEETS_API_KEY}`
        );
        const catsData = await catsRes.json();
        
        // 3. 加载互动数据
        const interRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Interactions!A1:D?key=${GOOGLE_SHEETS_API_KEY}`
        );
        const interData = await interRes.json();
        
        // 处理数据
        tools = processSheetData(toolsData.values);
        categories = processCategories(catsData.values);
        interactions = processSheetData(interData.values);
        
        console.log('Data loaded from Google Sheets:', { tools, categories, interactions });
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        // 如果加载失败，使用本地存储作为后备
        loadToolsFromLocalStorage();
    }
}

// 处理表单数据（转换为对象数组）
function processSheetData(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            obj[header] = row[index] || '';
            return obj;
        }, {});
    });
}

// 处理分类数据并构建分类树
function processCategories(rows) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0].map(h => h.trim());
    const categories = rows.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            obj[header] = row[index] || '';
            return obj;
        }, {});
    });
    
    // 构建分类树
    const map = {};
    const tree = [];
    
    categories.forEach(cat => {
        map[cat.ID] = { ...cat, children: [] };
    });
    
    categories.forEach(cat => {
        if (cat.ParentID && map[cat.ParentID]) {
            map[cat.ParentID].children.push(map[cat.ID]);
        } else {
            tree.push(map[cat.ID]);
        }
    });
    
    // 提取分类名称
    return tree.map(cat => cat.CategoryName);
}

// 从本地存储加载工具（后备方案）
function loadToolsFromLocalStorage() {
    const savedTools = localStorage.getItem('aiTools');
    const savedCategories = localStorage.getItem('aiCategories');
    
    if (savedTools) {
        tools = JSON.parse(savedTools);
    }
    
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    } else {
        categories = Object.keys(categoryColors);
    }
}

// 渲染分类
function renderCategories() {
    categoriesContainer.innerHTML = '';
    
    // 添加"全部"分类
    const allBtn = document.createElement('button');
    allBtn.className = `category-btn ${currentCategory === 'all' ? 'active' : ''}`;
    allBtn.textContent = '全部';
    allBtn.dataset.category = 'all';
    allBtn.addEventListener('click', () => {
        currentCategory = 'all';
        currentPage = 1;
        renderTools();
        renderCategories();
    });
    categoriesContainer.appendChild(allBtn);
    
    // 添加各分类按钮
    categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = `category-btn ${currentCategory === category ? 'active' : ''}`;
        categoryBtn.textContent = category;
        categoryBtn.dataset.category = category;
        categoryBtn.addEventListener('click', () => {
            currentCategory = category;
            currentPage = 1;
            renderTools();
            renderCategories();
        });
        categoriesContainer.appendChild(categoryBtn);
    });
}

// 渲染分类选项
function renderCategoryOptions() {
    toolCategorySelect.innerHTML = '';
    editToolCategory.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        toolCategorySelect.appendChild(option.cloneNode(true));
        editToolCategory.appendChild(option.cloneNode(true));
    });
    
    const otherOption = document.createElement('option');
    otherOption.value = "其他";
    otherOption.textContent = "其他";
    toolCategorySelect.appendChild(otherOption.cloneNode(true));
    editToolCategory.appendChild(otherOption.cloneNode(true));
}

// 渲染统计信息
function renderStats() {
    statsContainer.innerHTML = '';
    
    // 总工具数
    const totalTools = document.createElement('div');
    totalTools.className = 'stat-card';
    totalTools.innerHTML = `
        <i class="fas fa-tools" style="color: var(--primary-color); font-size: 1.5rem;"></i>
        <div class="stat-value">${tools.length}</div>
        <div class="stat-label">总工具数</div>
    `;
    statsContainer.appendChild(totalTools);
    
    // 总点击量
    const totalClicks = tools.reduce((sum, tool) => sum + (parseInt(tool.Views) || 0), 0);
    if (totalClicks > 0) {
        const clicksCard = document.createElement('div');
        clicksCard.className = 'stat-card';
        clicksCard.dataset.type = 'clicks';
        clicksCard.innerHTML = `
            <i class="fas fa-mouse-pointer" style="color: var(--primary-color); font-size: 1.5rem;"></i>
            <div class="stat-value">${totalClicks}</div>
            <div class="stat-label">总点击量</div>
        `;
        statsContainer.appendChild(clicksCard);
    }
    
    // 总收藏数
    const totalFavorites = tools.reduce((sum, tool) => sum + (parseInt(tool.Saves) || 0), 0);
    if (totalFavorites > 0) {
        const favoritesCard = document.createElement('div');
        favoritesCard.className = 'stat-card';
        favoritesCard.dataset.type = 'favorites';
        favoritesCard.innerHTML = `
            <i class="fas fa-star" style="color: var(--warning-color); font-size: 1.5rem;"></i>
            <div class="stat-value">${totalFavorites}</div>
            <div class="stat-label">总收藏数</div>
        `;
        statsContainer.appendChild(favoritesCard);
    }
}

// 渲染排行榜（使用Google Sheets互动数据）
function renderRanking(type, title) {
    rankingTitle.textContent = title;
    rankingList.innerHTML = '';
    
    // 从互动数据中统计每个工具的互动次数
    const toolStats = {};
    
    interactions.forEach(inter => {
        if (inter.Action === type) {
            if (!toolStats[inter.ToolID]) toolStats[inter.ToolID] = 0;
            toolStats[inter.ToolID]++;
        }
    });
    
    // 转换为数组并排序
    const sortedStats = Object.entries(toolStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sortedStats.length === 0) {
        rankingList.innerHTML = '<li class="ranking-item">暂无数据</li>';
        return;
    }
    
    // 渲染排行榜
    sortedStats.forEach(([toolId, count], index) => {
        const tool = tools.find(t => t.ID == toolId);
        if (tool) {
            const rankingItem = document.createElement('li');
            rankingItem.className = 'ranking-item';
            
            // 检查是否是24小时内新增（如果工具有Created字段）
            const isNew = tool.Created && (Date.now() - new Date(tool.Created).getTime()) < 24 * 60 * 60 * 1000;
            
            rankingItem.innerHTML = `
                <div class="ranking-position ${index === 0 ? 'position-1' : index === 1 ? 'position-2' : index === 2 ? 'position-3' : 'position-other'}">${index + 1}</div>
                <div class="ranking-name" data-url="${tool.URL}">${tool.Name}${isNew ? '<span class="new-badge">🆕</span>' : ''}</div>
                <div class="ranking-value">${count}</div>
            `;
            rankingList.appendChild(rankingItem);
        }
    });
    
    // 添加点击事件
    rankingList.querySelectorAll('.ranking-name').forEach(name => {
        name.addEventListener('click', (e) => {
            const url = e.currentTarget.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
    
    rankingModal.style.display = 'flex';
}

// 渲染工具
function renderTools() {
    toolsContainer.innerHTML = '';
    
    // 根据当前分类筛选工具
    let filteredTools = tools;
    if (currentCategory !== 'all') {
        filteredTools = tools.filter(tool => tool.Categories === currentCategory);
    }
    
    if (filteredTools.length === 0) {
        toolsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>当前分类没有工具</h3>
                <p>请尝试其他分类</p>
            </div>
        `;
        paginationContainer.innerHTML = '';
        return;
    }
    
    // 计算分页
    const totalPages = Math.ceil(filteredTools.length / toolsPerPage);
    const startIndex = (currentPage - 1) * toolsPerPage;
    const endIndex = Math.min(startIndex + toolsPerPage, filteredTools.length);
    const toolsToShow = filteredTools.slice(startIndex, endIndex);
    
    // 渲染工具卡片
    toolsToShow.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.dataset.id = tool.ID;
        
        // 安全处理：对名称和描述进行消毒
        const safeName = sanitizeInput(tool.Name);
        const safeDesc = sanitizeInput(tool.Description);
        
        toolCard.innerHTML = `
            <div class="tool-content">
                <div class="tool-name">
                    <span>${safeName}</span>
                    <span class="tool-admin-badge">管理员</span>
                </div>
                <div class="tool-description">${safeDesc}</div>
                <div class="card-stats">
                    <div class="clicks-count">
                        <i class="fas fa-mouse-pointer"></i> ${parseInt(tool.Views) || 0} 次点击
                    </div>
                    <span class="tool-category ${categoryColors[tool.Categories] || 'category-other'}">${tool.Categories}</span>
                </div>
                <div class="card-actions">
                    <a href="${tool.URL}" target="_blank" class="action-btn visit-btn" data-id="${tool.ID}">
                        <i class="fas fa-rocket"></i> 去使用
                    </a>
                    <button class="action-btn edit-btn" data-id="${tool.ID}">
                        <i class="fas fa-edit"></i> 修改
                    </button>
                </div>
                <div class="action-buttons">
                    <div class="action-icon like-btn" data-id="${tool.ID}" data-type="like">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="action-count">${parseInt(tool.Likes) || 0}</span>
                    </div>
                    <div class="action-icon favorite-btn" data-id="${tool.ID}" data-type="save">
                        <i class="fas fa-star"></i>
                        <span class="action-count">${parseInt(tool.Saves) || 0}</span>
                    </div>
                    <div class="action-icon share-btn" data-id="${tool.ID}" data-type="share">
                        <i class="fas fa-share-alt"></i>
                        <span class="action-count">${parseInt(tool.Shares) || 0}</span>
                    </div>
                </div>
            </div>
        `;
        toolsContainer.appendChild(toolCard);
    });
    
    // 渲染分页
    renderPagination(totalPages);
}

// 渲染分页控件
function renderPagination(totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // 添加上一页按钮
    const prevBtn = document.createElement('div');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTools();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // 添加页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTools();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // 添加下一页按钮
    const nextBtn = document.createElement('div');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTools();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// 自动分类工具
function categorizeTool(name) {
    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
            return category;
        }
    }
    
    return '其他';
}

// 触发管理员模式
function activateAdminMode() {
    isAdminMode = true;
    document.querySelectorAll('.tool-admin-badge').forEach(badge => {
        badge.style.display = 'inline-block';
    });
    addToolTip.innerHTML = `<i class="fas fa-user-shield"></i> 管理员模式已激活！`;
    addToolTip.style.display = 'block';
    addToolTip.style.background = 'var(--primary-color)';
    setTimeout(() => {
        addToolTip.style.display = 'none';
    }, 3000);
}
// 管理员登录逻辑
document.getElementById('admin-login').addEventListener('click', () => {
  const password = prompt('请输入管理员密码:');
  if (password === 'ADMIN_PASSWORD') {
    localStorage.setItem('admin_token', 'SECURE_ADMIN_TOKEN');
    window.location.href = 'admin.html';
  } else {
    alert('密码错误');
  }
});

// 设置事件监听
function setupEventListeners() {
    // 添加工具按钮
    addToolBtn.addEventListener('click', addNewTool);
    
    // 编辑按钮（事件委托）
    toolsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn') && isAdminMode) {
            const toolId = e.target.closest('.edit-btn').dataset.id;
            openEditModal(toolId);
        }
    });
    
    // 访问工具按钮（事件委托）
    toolsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.visit-btn')) {
            const toolId = e.target.closest('.visit-btn').dataset.id;
            recordToolClick(toolId);
        }
    });
    
    // 互动按钮（事件委托）
    toolsContainer.addEventListener('click', (e) => {
        const interactionBtn = e.target.closest('.action-icon');
        if (interactionBtn) {
            const toolId = interactionBtn.dataset.id;
            const type = interactionBtn.dataset.type;
            
            if (type === 'share') {
                openShareModal(toolId);
            } else {
                updateInteractionCount(toolId, type, interactionBtn);
            }
        }
    });
    
    // 保存编辑
    saveEditBtn.addEventListener('click', saveEditedTool);
    
    // 关闭模态框
    closeEditModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
        if (e.target === rankingModal) {
            rankingModal.style.display = 'none';
        }
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
    
    // 支持按Enter键添加工具
    toolNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTool();
    });
    
    toolUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTool();
    });
    
    // 顶部触发区域（显示统计）
    let headerClickCount = 0;
    let headerLastClickTime = 0;
    const clickThreshold = 5;
    const timeThreshold = 2000;
    
    headerTrigger.addEventListener('click', () => {
        const now = Date.now();
        
        if (now - headerLastClickTime > timeThreshold) {
            headerClickCount = 0;
        }
        
        headerClickCount++;
        headerLastClickTime = now;
        
        if (headerClickCount >= clickThreshold) {
            statsSection.style.display = 'block';
            renderStats();
            headerClickCount = 0;
        }
    });
    
    // 底部触发区域（显示添加表单）
    let footerClickCount = 0;
    let footerLastClickTime = 0;
    
    footerTrigger.addEventListener('click', () => {
        const now = Date.now();
        
        if (now - footerLastClickTime > timeThreshold) {
            footerClickCount = 0;
        }
        
        footerClickCount++;
        footerLastClickTime = now;
        
        if (footerClickCount >= clickThreshold) {
            addToolForm.style.display = 'block';
            addToolTip.style.display = 'block';
            setTimeout(() => {
                addToolTip.style.display = 'none';
            }, 3000);
            footerClickCount = 0;
            addToolForm.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // 卡片触发区域（显示编辑和统计）
    toolsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.tool-card');
        if (!card) return;
        
        const toolId = card.dataset.id;
        const tool = tools.find(t => t.ID === toolId);
        if (!tool) return;
        
        if (!tool.clickCount) tool.clickCount = 0;
        if (!tool.lastClickTime) tool.lastClickTime = 0;
        
        const now = Date.now();
        
        if (now - tool.lastClickTime > timeThreshold) {
            tool.clickCount = 0;
        }
        
        tool.clickCount++;
        tool.lastClickTime = now;
        
        if (tool.clickCount >= clickThreshold) {
            // 显示编辑按钮和统计信息
            const editBtn = card.querySelector('.edit-btn');
            const stats = card.querySelector('.card-stats');
            
            if (editBtn) editBtn.style.display = 'block';
            if (stats) stats.style.display = 'flex';
            
            tool.clickCount = 0;
            
            // 激活管理员模式
            if (!isAdminMode) activateAdminMode();
        }
    });
    
    // 关闭表单按钮
    closeFormBtn.addEventListener('click', () => {
        addToolForm.style.display = 'none';
    });
    
    // 关闭统计按钮
    closeStatsBtn.addEventListener('click', () => {
        statsSection.style.display = 'none';
    });
    
    // 刷新统计按钮
    refreshStatsBtn.addEventListener('click', () => {
        renderStats();
    });
    
    // 文件上传处理
    fileUpload.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName.textContent = file.name;
        }
    });
    
    // 上传按钮
    uploadBtn.addEventListener('click', uploadFile);
    
    // 关闭上传表单
    closeUploadBtn.addEventListener('click', () => {
        uploadForm.style.display = 'none';
    });
    
    // 关闭排行榜
    closeRanking.addEventListener('click', () => {
        rankingModal.style.display = 'none';
    });
    
    // 统计卡片点击事件
    statsContainer.addEventListener('click', (e) => {
        const statCard = e.target.closest('.stat-card');
        if (statCard) {
            const type = statCard.dataset.type;
            let title = '';
            
            switch(type) {
                case 'clicks':
                    title = '点击量排行榜';
                    break;
                case 'favorites':
                    title = '收藏数排行榜';
                    break;
                default:
                    title = '排行榜';
            }
            
            renderRanking(type, title);
        }
    });
    
    // 分享功能
    copyLinkBtn.addEventListener('click', () => {
        shareLink.select();
        document.execCommand('copy');
        addToolTip.innerHTML = `<i class="fas fa-check"></i> 链接已复制到剪贴板！`;
        addToolTip.style.display = 'block';
        addToolTip.style.background = 'var(--primary-color)';
        setTimeout(() => {
            addToolTip.style.display = 'none';
        }, 2000);
    });
    
    // 关闭分享模态框
    closeShare.addEventListener('click', () => {
        shareModal.style.display = 'none';
    });
}

// 添加新工具（暂存到本地存储，后续添加API写入）
function addNewTool() {
    const name = toolNameInput.value.trim();
    const url = toolUrlInput.value.trim();
    const description = toolDescInput.value.trim();
    let category = toolCategorySelect.value;
    
    // 处理新分类
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
        category = newCategory;
        categories.push(newCategory);
        renderCategories();
        renderCategoryOptions();
    }
    
    if (!name || !url || !description) {
        alert('请填写所有字段');
        return;
    }
    
    // 安全增强：验证URL格式和协议
    if (!isValidURL(url)) {
        alert('请输入有效的网址（必须以http://或https://开头）');
        return;
    }
    
    // 自动分类
    if (!category || category === "其他") {
        category = categorizeTool(name);
    }
    
    // 创建新工具对象
    const newTool = {
        ID: `local_${Date.now()}`,
        Name: sanitizeInput(name),
        URL: sanitizeInput(url),
        Description: sanitizeInput(description),
        Categories: category,
        Views: 0,
        Saves: 0,
        Shares: 0,
        Created: new Date().toISOString()
    };
    
    // 添加到工具数组
    tools.unshift(newTool);
    
    // 更新UI
    renderCategories();
    renderTools();
    
    // 重置表单
    toolNameInput.value = '';
    toolUrlInput.value = '';
    toolDescInput.value = '';
    newCategoryInput.value = '';
    
    // 显示成功提示
    addToolTip.innerHTML = `<i class="fas fa-check-circle"></i> ${sanitizeInput(name)} 添加成功！`;
    addToolTip.style.display = 'block';
    addToolTip.style.background = 'var(--success-color)';
    setTimeout(() => {
        addToolTip.style.display = 'none';
    }, 3000);
}

// 上传文件
function uploadFile() {
    const name = fileName.textContent.replace('.html', '');
    const author = authorName.value.trim();
    const wechat = authorWechat.value.trim();
    const description = fileDescription.value.trim();
    
    if (!fileInput.files.length || !author) {
        alert('请选择文件并填写作者昵称');
        return;
    }
    
    const file = fileInput.files[0];
    
    // 创建新工具对象
    const newTool = {
        ID: `local_${Date.now()}`,
        Name: sanitizeInput(name),
        URL: URL.createObjectURL(file),
        Description: description || `由 ${author} 上传的HTML工具`,
        Categories: categorizeTool(name),
        Views: 0,
        Saves: 0,
        Shares: 0,
        Author: `${author}${wechat ? ` (微信: ${wechat})` : ''}`,
        Created: new Date().toISOString()
    };
    
    // 添加到工具数组
    tools.unshift(newTool);
    
    // 更新UI
    renderCategories();
    renderTools();
    
    // 重置表单
    fileInput.value = '';
    fileName.textContent = '尚未选择文件';
    authorName.value = '';
    authorWechat.value = '';
    fileDescription.value = '';
    uploadForm.style.display = 'none';
    
    // 显示成功提示
    addToolTip.innerHTML = `<i class="fas fa-check-circle"></i> ${sanitizeInput(name)} 上传成功！`;
    addToolTip.style.display = 'block';
    addToolTip.style.background = 'var(--success-color)';
    setTimeout(() => {
        addToolTip.style.display = 'none';
    }, 3000);
}

// 记录工具点击
function recordToolClick(toolId) {
    const toolIndex = tools.findIndex(t => t.ID === toolId);
    if (toolIndex !== -1) {
        // 更新本地视图计数
        tools[toolIndex].Views = (parseInt(tools[toolIndex].Views) || 0) + 1;
        
        // 如果统计面板已显示，则更新
        if (statsSection.style.display === 'block') {
            renderStats();
        }
        
        // 记录互动到Google Sheets（模拟）
        recordInteraction(toolId, 'view');
    }
}

// 记录互动到Google Sheets
async function recordInteraction(toolId, action) {
    // 这里应该调用Google Apps Script API
    console.log(`Recording interaction: ToolID=${toolId}, Action=${action}`);
    
    // 模拟API调用
    try {
        // 实际实现：
        // await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     ToolID: toolId,
        //     Action: action,
        //     Timestamp: new Date().toISOString(),
        //     UserID: localStorage.getItem('user_id') || generateUserId()
        //   })
        // });
        
        console.log(`Interaction recorded: ${action} for tool ${toolId}`);
    } catch (error) {
        console.error('Error recording interaction:', error);
    }
}

// 更新互动计数
function updateInteractionCount(toolId, type, interactionBtn) {
    const toolIndex = tools.findIndex(t => t.ID === toolId);
    if (toolIndex === -1) return;
    
    // 检查用户是否已经操作过
    const userKey = `user_${type}_${toolId}`;
    const hasInteracted = localStorage.getItem(userKey);
    
    // 获取当前计数
    let currentCount = parseInt(tools[toolIndex][type === 'like' ? 'Likes' : type === 'save' ? 'Saves' : 'Shares']) || 0;
    
    if (hasInteracted) {
        // 如果已经操作过，则取消操作
        currentCount = Math.max(0, currentCount - 1);
        localStorage.removeItem(userKey);
        
        // 移除激活状态
        interactionBtn.classList.remove('active');
    } else {
        // 如果未操作过，则增加计数
        currentCount++;
        localStorage.setItem(userKey, 'true');
        
        // 添加激活状态
        interactionBtn.classList.add('active');
    }
    
    // 更新工具对象
    if (type === 'like') {
        tools[toolIndex].Likes = currentCount;
    } else if (type === 'save') {
        tools[toolIndex].Saves = currentCount;
    } else if (type === 'share') {
        tools[toolIndex].Shares = currentCount;
    }
    
    // 更新UI
    const countElement = interactionBtn.querySelector('.action-count');
    if (countElement) {
        countElement.textContent = currentCount;
    }
    
    // 如果统计面板已显示，则更新
    if (statsSection.style.display === 'block') {
        renderStats();
    }
    
    // 记录互动
    recordInteraction(toolId, type);
}

// 打开分享模态框
function openShareModal(toolId) {
    const tool = tools.find(t => t.ID === toolId);
    if (!tool) return;
    
    shareTitle.textContent = `分享: ${tool.Name}`;
    shareLink.value = window.location.href.split('?')[0] + `?tool=${toolId}`;
    shareModal.style.display = 'flex';
    
    // 更新分享计数
    updateInteractionCount(toolId, 'share');
}

// 打开编辑模态框
function openEditModal(toolId) {
    const tool = tools.find(t => t.ID === toolId);
    if (!tool) return;
    
    // 显示消毒后的值
    editToolName.value = tool.Name.replace(/&amp;/g, '&')
                                   .replace(/&lt;/g, '<')
                                   .replace(/&gt;/g, '>');
    editToolUrl.value = tool.URL.replace(/&amp;/g, '&')
                               .replace(/&lt;/g, '<')
                               .replace(/&gt;/g, '>');
    editToolDesc.value = tool.Description.replace(/&amp;/g, '&')
                                       .replace(/&lt;/g, '<')
                                       .replace(/&gt;/g, '>');
    editToolId.value = toolId;
    
    // 设置分类选择
    editToolCategory.value = tool.Categories;
    
    editModal.style.display = 'flex';
}

// 保存编辑的工具
function saveEditedTool() {
    const toolId = editToolId.value;
    const name = editToolName.value.trim();
    const url = editToolUrl.value.trim();
    const description = editToolDesc.value.trim();
    const category = editToolCategory.value;
    
    if (!name || !url || !description || !category) {
        alert('请填写所有字段');
        return;
    }
    
    // 安全增强：验证URL格式和协议
    if (!isValidURL(url)) {
        alert('请输入有效的网址（必须以http://或https://开头）');
        return;
    }
    
    const toolIndex = tools.findIndex(t => t.ID === toolId);
    if (toolIndex !== -1) {
        // 保存消毒后的值
        tools[toolIndex].Name = sanitizeInput(name);
        tools[toolIndex].URL = sanitizeInput(url);
        tools[toolIndex].Description = sanitizeInput(description);
        tools[toolIndex].Categories = category;
        
        renderCategories();
        renderTools();
        editModal.style.display = 'none';
        
        // 显示成功提示
        addToolTip.innerHTML = `<i class="fas fa-check-circle"></i> ${sanitizeInput(name)} 更新成功！`;
        addToolTip.style.display = 'block';
        addToolTip.style.background = 'var(--success-color)';
        setTimeout(() => {
            addToolTip.style.display = 'none';
        }, 3000);
    }
}
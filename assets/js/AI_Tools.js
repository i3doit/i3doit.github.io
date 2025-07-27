// 配置Google Sheets
const SHEET_ID = '1v8l3onK9Zb1tXFfzFvF4W5l4Y6Xq7Z5bVdJ9e7jK7wE'; // 示例表格ID
const SHEET_NAME = 'tools';
const API_KEY = 'AIzaSyD4YkUfI-6JXqgJg7j5k8w9z0a1b2c3d4e5f6'; // 示例API密钥（需替换）

// DOM元素
const toolsContainer = document.getElementById('tools-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const refreshBtn = document.getElementById('refresh-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const toolCount = document.getElementById('tool-count');
const updateTime = document.getElementById('update-time');
const loadingContainer = document.getElementById('loading');

// 全局变量
let allTools = [];
let filteredTools = [];
let activeCategory = 'all';
let searchQuery = '';

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    // 显示加载状态
    loadingContainer.style.display = 'flex';
    toolsContainer.innerHTML = '';
    
    // 设置最后更新时间
    updateTime.textContent = new Date().toLocaleTimeString();
    
    try {
        // 从Google Sheets获取数据
        allTools = await fetchToolData();
        
        // 渲染工具列表
        renderToolList(allTools);
        
        // 更新工具计数
        updateToolCount(allTools.length);
        
        // 初始化事件监听器
        initEventListeners();
    } catch (error) {
        console.error('初始化失败:', error);
        toolsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>数据加载失败</h3>
                <p>无法从Google Sheets获取数据，请稍后再试</p>
                <button id="retry-btn">重新加载</button>
            </div>
        `;
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            location.reload();
        });
    } finally {
        // 隐藏加载状态
        loadingContainer.style.display = 'none';
    }
});

// 从Google Sheets获取数据
async function fetchToolData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheets API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        const tools = parseSheetData(data.values);
        
        // 缓存数据到localStorage
        localStorage.setItem('aiToolsData', JSON.stringify({
            data: tools,
            timestamp: new Date().getTime()
        }));
        
        return tools;
    } catch (error) {
        console.error('获取工具数据失败:', error);
        
        // 尝试从缓存中获取数据
        const cachedData = localStorage.getItem('aiToolsData');
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            
            // 检查缓存是否过期（1小时）
            const isCacheValid = new Date().getTime() - parsedData.timestamp < 3600000;
            if (isCacheValid && parsedData.data.length > 0) {
                console.log('使用缓存数据');
                return parsedData.data;
            }
        }
        
        throw error;
    }
}

// 解析Google Sheets数据
function parseSheetData(rows) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0].map(header => header.toLowerCase());
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => {
        const tool = {};
        headers.forEach((header, index) => {
            tool[header] = row[index] || '';
        });
        return tool;
    });
}

// 渲染工具列表
function renderToolList(tools) {
    toolsContainer.innerHTML = '';
    
    if (tools.length === 0) {
        toolsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>未找到匹配的工具</h3>
                <p>请尝试其他搜索词或筛选条件</p>
            </div>
        `;
        return;
    }
    
    tools.forEach(tool => {
        const toolCard = createToolCard(tool);
        toolsContainer.appendChild(toolCard);
    });
}

// 创建工具卡片
function createToolCard(tool) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">
                ${tool.icon ? `<img src="${tool.icon}" alt="${tool.name}">` : `<i class="fas fa-cube"></i>`}
            </div>
            <div class="card-info">
                <div class="card-title">${tool.name}</div>
                <span class="card-category">${tool.category || '通用'}</span>
            </div>
        </div>
        <div class="card-body">
            <p class="card-description">${tool.description || '暂无描述'}</p>
            <div class="card-tags">
                ${tool.tags ? tool.tags.split(',').map(tag => 
                    `<span class="card-tag">${tag.trim()}</span>`
                ).join('') : ''}
            </div>
        </div>
        <div class="card-footer">
            <a href="${tool.url}" class="card-link" target="_blank">
                <i class="fas fa-external-link-alt"></i> 访问工具
            </a>
        </div>
    `;
    
    return card;
}

// 筛选和搜索工具
function filterTools() {
    filteredTools = allTools.filter(tool => {
        // 类别筛选
        const categoryMatch = activeCategory === 'all' || 
                             (tool.category && tool.category.toLowerCase().includes(activeCategory));
        
        // 搜索匹配
        const searchMatch = searchQuery === '' || 
                           (tool.name && tool.name.toLowerCase().includes(searchQuery)) ||
                           (tool.description && tool.description.toLowerCase().includes(searchQuery)) ||
                           (tool.tags && tool.tags.toLowerCase().includes(searchQuery));
        
        return categoryMatch && searchMatch;
    });
    
    renderToolList(filteredTools);
    updateToolCount(filteredTools.length);
}

// 更新工具计数
function updateToolCount(count) {
    toolCount.textContent = `共找到 ${count} 个工具`;
}

// 初始化事件监听器
function initEventListeners() {
    // 搜索功能
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        filterTools();
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.trim().toLowerCase();
            filterTools();
        }
    });
    
    // 刷新按钮
    refreshBtn.addEventListener('click', async () => {
        loadingContainer.style.display = 'flex';
        toolsContainer.innerHTML = '';
        
        try {
            allTools = await fetchToolData();
            searchQuery = '';
            searchInput.value = '';
            activeCategory = 'all';
            
            // 重置激活的筛选按钮
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === 'all') {
                    btn.classList.add('active');
                }
            });
            
            filterTools();
            updateTime.textContent = new Date().toLocaleTimeString();
        } catch (error) {
            console.error('刷新数据失败:', error);
            alert('刷新数据失败，请检查控制台获取详细信息');
        } finally {
            loadingContainer.style.display = 'none';
        }
    });
    
    // 分类筛选
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新激活状态
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新筛选类别
            activeCategory = btn.dataset.category;
            filterTools();
        });
    });
}
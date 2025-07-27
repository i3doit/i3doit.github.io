    <script>
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
        
        // 示例数据（增强版）
        const sampleTools = [
            { 
                id: 1, 
                name: "ChatGPT", 
                url: "https://chat.openai.com", 
                description: "强大的AI对话模型，能回答各种问题、生成创意内容和协助完成复杂任务",
                clicks: 42, 
                likes: 35,
                affections: 28,
                favorites: 45,
                shares: 18,
                category: "写作",
                author: "OpenAI",
                created: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2天前
            },
            { 
                id: 2, 
                name: "Midjourney", 
                url: "https://www.midjourney.com", 
                description: "AI图像生成工具，通过文本描述创建令人惊叹的艺术作品和设计",
                clicks: 35, 
                likes: 28,
                affections: 32,
                favorites: 38,
                shares: 12,
                category: "设计",
                author: "Midjourney团队",
                created: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1天前
            },
            { 
                id: 3, 
                name: "GitHub Copilot", 
                url: "https://github.com/features/copilot", 
                description: "AI编程助手，帮助开发者更快地编写代码，提供智能代码补全建议",
                clicks: 38, 
                likes: 42,
                affections: 37,
                favorites: 52,
                shares: 22,
                category: "编程",
                author: "GitHub",
                created: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3天前
            }
        ];
        
        // 工具数组
        let tools = [];
        let currentPage = 1;
        let currentCategory = 'all';
        const toolsPerPage = 8;
        let categories = Object.keys(categoryColors);
        
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
        document.addEventListener('DOMContentLoaded', () => {
            // 更新版权年份
            const year = new Date().getFullYear();
            copyright.textContent = `© ${year} 艾兜兜儿AI工具箱 | 让AI工具触手可及`;
            
            loadTools();
            renderCategories();
            renderCategoryOptions();
            renderTools();
            setupEventListeners();
        });
        
        // 加载工具
        function loadTools() {
            const savedTools = localStorage.getItem('aiTools');
            const savedCategories = localStorage.getItem('aiCategories');
            
            if (savedTools) {
                tools = JSON.parse(savedTools);
            } else {
                // 如果没有保存的数据，使用示例数据
                tools = [...sampleTools];
                saveTools();
            }
            
            if (savedCategories) {
                categories = JSON.parse(savedCategories);
            }
        }
        
        // 保存工具
        function saveTools() {
            localStorage.setItem('aiTools', JSON.stringify(tools));
            localStorage.setItem('aiCategories', JSON.stringify(categories));
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
            const totalClicks = tools.reduce((sum, tool) => sum + (tool.clicks || 0), 0);
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
            
            // 总点赞数
            const totalLikes = tools.reduce((sum, tool) => sum + (tool.likes || 0), 0);
            if (totalLikes > 0) {
                const likesCard = document.createElement('div');
                likesCard.className = 'stat-card';
                likesCard.dataset.type = 'likes';
                likesCard.innerHTML = `
                    <i class="fas fa-thumbs-up" style="color: var(--primary-color); font-size: 1.5rem;"></i>
                    <div class="stat-value">${totalLikes}</div>
                    <div class="stat-label">总点赞数</div>
                `;
                statsContainer.appendChild(likesCard);
            }
            
            // 总喜欢数
            const totalAffections = tools.reduce((sum, tool) => sum + (tool.affections || 0), 0);
            if (totalAffections > 0) {
                const affectionsCard = document.createElement('div');
                affectionsCard.className = 'stat-card';
                affectionsCard.dataset.type = 'affections';
                affectionsCard.innerHTML = `
                    <i class="fas fa-heart" style="color: var(--danger-color); font-size: 1.5rem;"></i>
                    <div class="stat-value">${totalAffections}</div>
                    <div class="stat-label">总喜欢数</div>
                `;
                statsContainer.appendChild(affectionsCard);
            }
            
            // 总收藏数
            const totalFavorites = tools.reduce((sum, tool) => sum + (tool.favorites || 0), 0);
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
            
            // 总分享数
            const totalShares = tools.reduce((sum, tool) => sum + (tool.shares || 0), 0);
            if (totalShares > 0) {
                const sharesCard = document.createElement('div');
                sharesCard.className = 'stat-card';
                sharesCard.dataset.type = 'shares';
                sharesCard.innerHTML = `
                    <i class="fas fa-share-alt" style="color: var(--success-color); font-size: 1.5rem;"></i>
                    <div class="stat-value">${totalShares}</div>
                    <div class="stat-label">总分享数</div>
                `;
                statsContainer.appendChild(sharesCard);
            }
        }
        
        // 渲染排行榜
        function renderRanking(type, title) {
            rankingTitle.textContent = title;
            rankingList.innerHTML = '';
            
            // 过滤掉没有数据的工具
            const validTools = tools.filter(tool => tool[type] > 0);
            
            if (validTools.length === 0) {
                rankingList.innerHTML = '<li class="ranking-item">暂无数据</li>';
                return;
            }
            
            // 排序工具
            const sortedTools = [...validTools].sort((a, b) => b[type] - a[type]).slice(0, 10);
            
            sortedTools.forEach((tool, index) => {
                const rankingItem = document.createElement('li');
                rankingItem.className = 'ranking-item';
                
                // 检查是否是24小时内新增
                const isNew = (Date.now() - tool.created) < 24 * 60 * 60 * 1000;
                
                rankingItem.innerHTML = `
                    <div class="ranking-position ${index === 0 ? 'position-1' : index === 1 ? 'position-2' : index === 2 ? 'position-3' : 'position-other'}">${index + 1}</div>
                    <div class="ranking-name" data-url="${tool.url}">${tool.name}${isNew ? '<span class="new-badge">🆕</span>' : ''}</div>
                    <div class="ranking-value">${tool[type]}</div>
                `;
                rankingList.appendChild(rankingItem);
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
                filteredTools = tools.filter(tool => tool.category === currentCategory);
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
                toolCard.dataset.id = tool.id;
                
                // 安全处理：对名称和描述进行消毒
                const safeName = sanitizeInput(tool.name);
                const safeDesc = sanitizeInput(tool.description);
                const safeAuthor = tool.author ? sanitizeInput(tool.author) : '';
                
                toolCard.innerHTML = `
                    <div class="tool-content">
                        <div class="tool-name">
                            <span>${safeName}</span>
                            <span class="tool-admin-badge">管理员</span>
                        </div>
                        ${safeAuthor ? `<div class="tool-author"><i class="fas fa-user"></i> 作者: ${safeAuthor}</div>` : ''}
                        <div class="tool-description">${safeDesc}</div>
                        <div class="card-stats">
                            <div class="clicks-count">
                                <i class="fas fa-mouse-pointer"></i> ${tool.clicks || 0} 次点击
                            </div>
                            <span class="tool-category ${categoryColors[tool.category] || 'category-other'}">${tool.category}</span>
                        </div>
                        <div class="card-actions">
                            <a href="${tool.url}" target="_blank" class="action-btn visit-btn" data-id="${tool.id}">
                                <i class="fas fa-rocket"></i> 去使用
                            </a>
                            <button class="action-btn edit-btn" data-id="${tool.id}">
                                <i class="fas fa-edit"></i> 修改
                            </button>
                        </div>
                        <div class="action-buttons">
                            <div class="action-icon like-btn ${tool.userLiked ? 'liked active' : ''}" data-id="${tool.id}" data-type="likes">
                                <i class="fas fa-thumbs-up"></i>
                                <span class="action-count">${tool.likes || 0}</span>
                            </div>
                            <div class="action-icon affection-btn ${tool.userAffection ? 'favorited active' : ''}" data-id="${tool.id}" data-type="affections">
                                <i class="fas fa-heart"></i>
                                <span class="action-count">${tool.affections || 0}</span>
                            </div>
                            <div class="action-icon favorite-btn ${tool.userFavorited ? 'favorited active' : ''}" data-id="${tool.id}" data-type="favorites">
                                <i class="fas fa-star"></i>
                                <span class="action-count">${tool.favorites || 0}</span>
                            </div>
                            <div class="action-icon share-btn" data-id="${tool.id}" data-type="shares">
                                <i class="fas fa-share-alt"></i>
                                <span class="action-count">${tool.shares || 0}</span>
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
        
        // 设置事件监听
        function setupEventListeners() {
            // 添加工具按钮
            addToolBtn.addEventListener('click', addNewTool);
            
            // 编辑按钮（事件委托）
            toolsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.edit-btn') && isAdminMode) {
                    const toolId = parseInt(e.target.closest('.edit-btn').dataset.id);
                    openEditModal(toolId);
                }
            });
            
            // 访问工具按钮（事件委托）
            toolsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.visit-btn')) {
                    const toolId = parseInt(e.target.closest('.visit-btn').dataset.id);
                    recordToolClick(toolId);
                }
            });
            
            // 互动按钮（事件委托）
            toolsContainer.addEventListener('click', (e) => {
                const interactionBtn = e.target.closest('.action-icon');
                if (interactionBtn) {
                    const toolId = parseInt(interactionBtn.dataset.id);
                    const type = interactionBtn.dataset.type;
                    
                    if (type === 'shares') {
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
                
                const toolId = parseInt(card.dataset.id);
                const tool = tools.find(t => t.id === toolId);
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
                        case 'likes':
                            title = '点赞数排行榜';
                            break;
                        case 'affections':
                            title = '喜欢数排行榜';
                            break;
                        case 'favorites':
                            title = '收藏数排行榜';
                            break;
                        case 'shares':
                            title = '分享数排行榜';
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
        
        // 添加新工具
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
                saveTools();
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
            
            const newTool = {
                id: Date.now(),
                name: sanitizeInput(name),
                url: sanitizeInput(url),
                description: sanitizeInput(description),
                clicks: 0,
                likes: 0,
                affections: 0,
                favorites: 0,
                shares: 0,
                category: category,
                created: Date.now()
            };
            
            tools.unshift(newTool);
            saveTools();
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
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // 这里可以处理文件内容，但为了简化，我们只使用文件名
                const category = categorizeTool(name);
                
                const newTool = {
                    id: Date.now(),
                    name: sanitizeInput(name),
                    url: URL.createObjectURL(file),
                    description: description || `由 ${author} 上传的HTML工具`,
                    clicks: 0,
                    likes: 0,
                    affections: 0,
                    favorites: 0,
                    shares: 0,
                    category: category,
                    author: `${author}${wechat ? ` (微信: ${wechat})` : ''}`,
                    created: Date.now()
                };
                
                tools.unshift(newTool);
                saveTools();
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
            };
            
            reader.readAsText(file);
        }
        
        // 记录工具点击
        function recordToolClick(toolId) {
            const toolIndex = tools.findIndex(t => t.id === toolId);
            if (toolIndex !== -1) {
                tools[toolIndex].clicks = (tools[toolIndex].clicks || 0) + 1;
                saveTools();
                
                // 如果统计面板已显示，则更新
                if (statsSection.style.display === 'block') {
                    renderStats();
                }
            }
        }
        
        // 更新互动计数
        function updateInteractionCount(toolId, type, interactionBtn) {
            const toolIndex = tools.findIndex(t => t.id === toolId);
            if (toolIndex === -1) return;
            
            // 检查用户是否已经操作过
            const userKey = `user_${type}_${toolId}`;
            const hasInteracted = localStorage.getItem(userKey);
            
            if (hasInteracted) {
                // 如果已经操作过，则取消操作
                tools[toolIndex][type] = Math.max(0, (tools[toolIndex][type] || 0) - 1);
                localStorage.removeItem(userKey);
                
                // 移除激活状态
                interactionBtn.classList.remove('active');
                if (type === 'affections' || type === 'favorites') {
                    interactionBtn.classList.remove('favorited');
                } else if (type === 'likes') {
                    interactionBtn.classList.remove('liked');
                }
            } else {
                // 如果未操作过，则增加计数
                tools[toolIndex][type] = (tools[toolIndex][type] || 0) + 1;
                localStorage.setItem(userKey, 'true');
                
                // 添加激活状态
                interactionBtn.classList.add('active');
                if (type === 'affections' || type === 'favorites') {
                    interactionBtn.classList.add('favorited');
                } else if (type === 'likes') {
                    interactionBtn.classList.add('liked');
                }
            }
            
            saveTools();
            
            // 更新UI
            const countElement = interactionBtn.querySelector('.action-count');
            if (countElement) {
                countElement.textContent = tools[toolIndex][type] || 0;
            }
            
            // 如果统计面板已显示，则更新
            if (statsSection.style.display === 'block') {
                renderStats();
            }
        }
        
        // 打开分享模态框
        function openShareModal(toolId) {
            const tool = tools.find(t => t.id === toolId);
            if (!tool) return;
            
            shareTitle.textContent = `分享: ${tool.name}`;
            shareLink.value = window.location.href.split('?')[0] + `?tool=${toolId}`;
            shareModal.style.display = 'flex';
            
            // 更新分享计数
            updateInteractionCount(toolId, 'shares');
        }
        
        // 打开编辑模态框
        function openEditModal(toolId) {
            const tool = tools.find(t => t.id === toolId);
            if (!tool) return;
            
            // 显示消毒后的值
            editToolName.value = tool.name.replace(/&amp;/g, '&')
                                           .replace(/&lt;/g, '<')
                                           .replace(/&gt;/g, '>');
            editToolUrl.value = tool.url.replace(/&amp;/g, '&')
                                       .replace(/&lt;/g, '<')
                                       .replace(/&gt;/g, '>');
            editToolDesc.value = tool.description.replace(/&amp;/g, '&')
                                               .replace(/&lt;/g, '<')
                                               .replace(/&gt;/g, '>');
            editToolId.value = toolId;
            
            // 设置分类选择
            editToolCategory.value = tool.category;
            
            editModal.style.display = 'flex';
        }
        
        // 保存编辑的工具
        function saveEditedTool() {
            const toolId = parseInt(editToolId.value);
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
            
            const toolIndex = tools.findIndex(t => t.id === toolId);
            if (toolIndex !== -1) {
                // 保存消毒后的值
                tools[toolIndex].name = sanitizeInput(name);
                tools[toolIndex].url = sanitizeInput(url);
                tools[toolIndex].description = sanitizeInput(description);
                tools[toolIndex].category = category;
                
                saveTools();
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
    </script>
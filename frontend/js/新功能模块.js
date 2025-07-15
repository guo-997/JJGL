// 新功能模块 - 扩展NFC家庭管理系统功能

class AdvancedFeatures {
  constructor(mainApp) {
    this.app = mainApp;
    this.selectedItems = new Set();
    this.init();
  }

  init() {
    this.initBatchOperations();
    this.initDataExport();
    this.initAdvancedSearch();
    this.initDataVisualization();
    this.initImageUpload();
  }

  // 1. 批量操作功能
  initBatchOperations() {
    this.addBatchUI();
    this.initBatchEvents();
  }

  addBatchUI() {
    const batchToolbar = document.createElement('div');
    batchToolbar.id = 'batch-toolbar';
    batchToolbar.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-white/30 z-40 hidden';
    batchToolbar.innerHTML = `
      <div class="flex items-center space-x-4">
        <span class="text-sm font-medium text-dark-700">已选择 <span id="selected-count">0</span> 项</span>
        <div class="flex space-x-2">
          <button id="batch-move-btn" class="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-all">
            移动到
          </button>
          <button id="batch-delete-btn" class="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all">
            删除
          </button>
          <button id="batch-export-btn" class="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all">
            导出
          </button>
          <button id="cancel-batch-btn" class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all">
            取消
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(batchToolbar);
  }

  initBatchEvents() {
    document.addEventListener('change', (e) => {
      if (e.target.matches('.item-checkbox')) {
        this.toggleItemSelection(e.target.dataset.id, e.target.checked);
      }
    });

    document.getElementById('batch-move-btn')?.addEventListener('click', () => {
      this.showBatchMoveModal();
    });

    document.getElementById('batch-delete-btn')?.addEventListener('click', () => {
      this.confirmBatchDelete();
    });

    document.getElementById('batch-export-btn')?.addEventListener('click', () => {
      this.exportSelectedItems();
    });

    document.getElementById('cancel-batch-btn')?.addEventListener('click', () => {
      this.cancelBatchSelection();
    });
  }

  toggleItemSelection(itemId, selected) {
    if (selected) {
      this.selectedItems.add(itemId);
    } else {
      this.selectedItems.delete(itemId);
    }
    this.updateBatchUI();
  }

  updateBatchUI() {
    const toolbar = document.getElementById('batch-toolbar');
    const countElement = document.getElementById('selected-count');
    
    if (this.selectedItems.size > 0) {
      toolbar.classList.remove('hidden');
      countElement.textContent = this.selectedItems.size;
    } else {
      toolbar.classList.add('hidden');
    }
  }

  // 2. 数据导出功能
  initDataExport() {
    this.addExportButton();
  }

  addExportButton() {
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m3 5.5V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-1.5"></path>
      </svg>
      导出数据
    `;
    exportBtn.className = 'flex items-center px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all';
    exportBtn.addEventListener('click', () => this.showExportModal());
    
    // 添加到操作区域
    const actionsArea = document.querySelector('.flex.space-x-3');
    if (actionsArea) {
      actionsArea.appendChild(exportBtn);
    }
  }

  showExportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">导出数据</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">导出格式</label>
            <select id="export-format" class="w-full p-3 border rounded-lg">
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="pdf">PDF报告</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">导出内容</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" checked class="mr-2" value="boxes"> 储物盒信息
              </label>
              <label class="flex items-center">
                <input type="checkbox" checked class="mr-2" value="items"> 物品详情
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="mr-2" value="images"> 包含图片
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="mr-2" value="stats"> 统计数据
              </label>
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button onclick="this.closest('.fixed').remove()" class="flex-1 py-2 border rounded-lg hover:bg-gray-50">取消</button>
            <button onclick="advancedFeatures.executeExport(this)" class="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">导出</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async executeExport(button) {
    const modal = button.closest('.fixed');
    const format = document.getElementById('export-format').value;
    const options = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    try {
      button.textContent = '导出中...';
      button.disabled = true;
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, options })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `家庭物品数据_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.app.showNotification('数据导出成功！', 'success');
      } else {
        throw new Error('导出失败');
      }
    } catch (error) {
      this.app.showNotification('导出失败: ' + error.message, 'error');
    } finally {
      modal.remove();
    }
  }

  // 3. 高级搜索功能
  initAdvancedSearch() {
    this.addAdvancedSearchButton();
  }

  addAdvancedSearchButton() {
    const searchContainer = document.querySelector('.relative.w-full');
    if (searchContainer) {
      const advancedBtn = document.createElement('button');
      advancedBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
        </svg>
      `;
      advancedBtn.className = 'absolute right-12 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-500 transition-colors p-1';
      advancedBtn.title = '高级搜索';
      advancedBtn.addEventListener('click', () => this.showAdvancedSearchModal());
      searchContainer.appendChild(advancedBtn);
    }
  }

  showAdvancedSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">高级搜索</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">物品名称</label>
            <input type="text" id="search-name" class="w-full p-3 border rounded-lg" placeholder="输入物品名称">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">所在盒子</label>
            <select id="search-box" class="w-full p-3 border rounded-lg">
              <option value="">所有盒子</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">物品类别</label>
            <select id="search-category" class="w-full p-3 border rounded-lg">
              <option value="">所有类别</option>
              <option value="electronics">电子产品</option>
              <option value="clothing">服装</option>
              <option value="books">书籍</option>
              <option value="tools">工具</option>
              <option value="documents">文档</option>
              <option value="others">其他</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">位置</label>
            <input type="text" id="search-location" class="w-full p-3 border rounded-lg" placeholder="输入位置">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">添加日期</label>
            <div class="flex space-x-2">
              <input type="date" id="search-date-from" class="flex-1 p-3 border rounded-lg">
              <input type="date" id="search-date-to" class="flex-1 p-3 border rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">标签</label>
            <input type="text" id="search-tags" class="w-full p-3 border rounded-lg" placeholder="输入标签，用逗号分隔">
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button onclick="this.closest('.fixed').remove()" class="flex-1 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button onclick="advancedFeatures.executeAdvancedSearch(this)" class="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">搜索</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.loadBoxesForSearch();
  }

  async loadBoxesForSearch() {
    try {
      const response = await fetch('/api/boxes');
      const data = await response.json();
      const select = document.getElementById('search-box');
      
      if (select && data.success) {
        data.data.forEach(box => {
          const option = document.createElement('option');
          option.value = box.id;
          option.textContent = box.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('加载盒子列表失败:', error);
    }
  }

  // 4. 数据可视化
  initDataVisualization() {
    this.addVisualizationButton();
  }

  addVisualizationButton() {
    // 在快速操作区域添加数据报表按钮的点击事件
    document.addEventListener('click', (e) => {
      if (e.target.closest('button')?.textContent.includes('数据报表')) {
        this.showVisualizationModal();
      }
    });
  }

  showVisualizationModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold">数据可视化分析</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold mb-3">物品分布统计</h4>
            <canvas id="items-distribution-chart" width="300" height="200"></canvas>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold mb-3">盒子使用率</h4>
            <canvas id="box-usage-chart" width="300" height="200"></canvas>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold mb-3">月度添加趋势</h4>
            <canvas id="monthly-trend-chart" width="300" height="200"></canvas>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-semibold mb-3">类别分析</h4>
            <canvas id="category-analysis-chart" width="300" height="200"></canvas>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.loadCharts();
  }

  async loadCharts() {
    try {
      const response = await fetch('/api/analytics/charts');
      const data = await response.json();
      
      if (data.success) {
        this.renderCharts(data.data);
      }
    } catch (error) {
      console.error('加载图表数据失败:', error);
    }
  }

  renderCharts(data) {
    // 物品分布饼图
    new Chart(document.getElementById('items-distribution-chart'), {
      type: 'doughnut',
      data: {
        labels: data.distribution?.labels || [],
        datasets: [{
          data: data.distribution?.values || [],
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // 盒子使用率柱状图
    new Chart(document.getElementById('box-usage-chart'), {
      type: 'bar',
      data: {
        labels: data.boxUsage?.labels || [],
        datasets: [{
          label: '使用率 (%)',
          data: data.boxUsage?.values || [],
          backgroundColor: '#4F46E5'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });

    // 其他图表...
  }

  // 5. 图片上传优化
  initImageUpload() {
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.target.matches('.drag-drop-area')) {
        e.target.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (e.target.matches('.drag-drop-area')) {
        e.target.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.target.matches('.drag-drop-area')) {
        e.target.classList.remove('drag-over');
        this.handleImageUpload(e.dataTransfer.files);
      }
    });
  }

  async handleImageUpload(files) {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size < 5 * 1024 * 1024 // 5MB限制
    );

    if (validFiles.length === 0) {
      this.app.showNotification('请选择有效的图片文件（小于5MB）', 'error');
      return;
    }

    for (const file of validFiles) {
      await this.uploadSingleImage(file);
    }
  }

  async uploadSingleImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        this.app.showNotification('图片上传成功', 'success');
        return result.data.url;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      this.app.showNotification('图片上传失败: ' + error.message, 'error');
    }
  }
}

// 全局初始化
window.addEventListener('DOMContentLoaded', () => {
  if (window.nfcApp) {
    window.advancedFeatures = new AdvancedFeatures(window.nfcApp);
  }
}); 
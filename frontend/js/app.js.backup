class NFCHomeManager {
  constructor() {
    this.apiBase = '/api';
    this.currentBox = null;
    this.nfcSupported = 'NDEFReader' in window;
    this.currentPage = 1;
    this.isLoading = false;
    this.init();
  }

  async init() {
    console.log('🚀 NFC家庭物品管理系统初始化...');
    this.initEventListeners();
    this.initNFC();
    await this.loadDashboard();
    this.checkURLParams();
  }

  initEventListeners() {
    // NFC扫描按钮
    document.getElementById('nfc-scan-btn')?.addEventListener('click', () => {
      this.startNFCScan();
    });

    document.getElementById('mobile-nfc-btn')?.addEventListener('click', () => {
      this.startNFCScan();
    });

    // 搜索功能
    document.getElementById('search-box')?.addEventListener('input', (e) => {
      this.debounce(this.searchItems.bind(this), 300)(e.target.value);
    });

    document.getElementById('mobile-search-box')?.addEventListener('input', (e) => {
      this.debounce(this.searchItems.bind(this), 300)(e.target.value);
    });

    // 添加盒子按钮
    document.getElementById('add-box-btn')?.addEventListener('click', () => {
      this.showAddBoxModal();
    });

    // 加载更多按钮
    document.getElementById('load-more-btn')?.addEventListener('click', () => {
      this.loadMoreBoxes();
    });
  }

  // NFC功能
  async initNFC() {
    if (!this.nfcSupported) {
      console.log('❌ 此设备不支持NFC功能');
      this.updateNFCStatus('不支持NFC', 'error');
      return;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      
      console.log('✅ NFC扫描已启动');
      this.updateNFCStatus('NFC就绪，等待扫描...', 'ready');
      
      ndef.addEventListener("reading", ({ message, serialNumber }) => {
        console.log(`📱 NFC标签检测到: ${serialNumber}`);
        this.handleNFCRead(serialNumber);
      });

      ndef.addEventListener("readingerror", () => {
        console.error('❌ NFC读取错误');
        this.showNotification('NFC读取失败', 'error');
      });

    } catch (error) {
      console.error('❌ NFC初始化失败:', error);
      this.updateNFCStatus('NFC启动失败', 'error');
    }
  }

  async startNFCScan() {
    if (!this.nfcSupported) {
      this.showNotification('您的设备不支持NFC功能', 'warning');
      return;
    }

    this.updateNFCStatus('请将NFC标签靠近设备...', 'scanning');
    this.showNotification('请将NFC标签靠近设备背面', 'info');
  }

  async handleNFCRead(nfcId) {
    try {
      this.updateNFCStatus('正在加载盒子信息...', 'loading');
      this.showNotification('正在读取NFC标签...', 'info');
      
      const response = await fetch(`${this.apiBase}/boxes/nfc/${nfcId}`);
      const result = await response.json();

      if (result.success) {
        this.currentBox = result.data;
        this.showBoxDetail(result.data._id);
        this.showNotification('盒子信息加载成功！', 'success');
        this.updateNFCStatus('扫描成功！', 'success');
      } else {
        this.showNotification('未找到对应的盒子', 'warning');
        this.showCreateBoxModal(nfcId);
        this.updateNFCStatus('未找到对应盒子', 'warning');
      }
    } catch (error) {
      console.error('❌ 处理NFC读取失败:', error);
      this.showNotification('加载盒子信息失败', 'error');
      this.updateNFCStatus('加载失败', 'error');
    }
  }

  // 数据加载
  async loadDashboard() {
    try {
      this.showLoading();
      
      const [statsResponse, boxesResponse] = await Promise.all([
        fetch(`${this.apiBase}/dashboard/stats`),
        fetch(`${this.apiBase}/boxes?limit=8`)
      ]);

      const statsResult = await statsResponse.json();
      const boxesResult = await boxesResponse.json();

      if (statsResult.success) {
        this.updateStatsCards(statsResult.data);
        this.renderRecentActivity(statsResult.data.recentActivity || []);
      }

      if (boxesResult.success) {
        this.renderBoxList(boxesResult.data);
      }

      this.hideLoading();
    } catch (error) {
      console.error('❌ 加载仪表板失败:', error);
      this.showNotification('加载数据失败', 'error');
      this.hideLoading();
    }
  }

  // 更新统计卡片
  updateStatsCards(stats) {
    const container = document.getElementById('stats-cards');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-card p-6 scale-hover">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-dark-3 text-sm font-medium">总盒子数</p>
            <h3 class="text-3xl font-bold mt-1 mb-2">${stats.totalBoxes}</h3>
            <p class="text-${stats.boxGrowth >= 0 ? 'success' : 'danger'} text-sm flex items-center">
              <i class="fa fa-arrow-${stats.boxGrowth >= 0 ? 'up' : 'down'} mr-1"></i> 
              ${Math.abs(stats.boxGrowth)}% <span class="text-dark-3 ml-1">较上月</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <i class="fa fa-cube text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-card p-6 scale-hover">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-dark-3 text-sm font-medium">总物品数</p>
            <h3 class="text-3xl font-bold mt-1 mb-2">${stats.totalItems}</h3>
            <p class="text-${stats.itemGrowth >= 0 ? 'success' : 'danger'} text-sm flex items-center">
              <i class="fa fa-arrow-${stats.itemGrowth >= 0 ? 'up' : 'down'} mr-1"></i> 
              ${Math.abs(stats.itemGrowth)}% <span class="text-dark-3 ml-1">较上月</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            <i class="fa fa-cubes text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-card p-6 scale-hover">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-dark-3 text-sm font-medium">已扫描</p>
            <h3 class="text-3xl font-bold mt-1 mb-2">${stats.scannedBoxes}</h3>
            <p class="text-dark-3 text-sm flex items-center">
              <i class="fa fa-credit-card mr-1"></i> NFC扫描
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <i class="fa fa-check-square text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-card p-6 scale-hover">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-dark-3 text-sm font-medium">待补货</p>
            <h3 class="text-3xl font-bold mt-1 mb-2">${stats.lowStockItems}</h3>
            <p class="text-warning text-sm flex items-center">
              <i class="fa fa-exclamation-triangle mr-1"></i> 需要注意
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
            <i class="fa fa-shopping-cart text-xl"></i>
          </div>
        </div>
      </div>
    `;
  }

  // 渲染盒子列表
  renderBoxList(boxes) {
    const container = document.getElementById('boxes-container');
    if (!container) return;

    container.innerHTML = boxes.map(box => `
      <div class="bg-white rounded-xl shadow-card overflow-hidden transition-custom hover:shadow-card-hover border-l-4 border-${this.getStatusColor(box.status)}" 
           data-box-id="${box._id}">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="px-2 py-1 bg-${this.getStatusColor(box.status)}/10 text-${this.getStatusColor(box.status)} text-xs font-medium rounded-full">
                ${this.getStatusText(box.status)}
              </span>
              <h3 class="text-lg font-semibold mt-2">${box.name}</h3>
              <p class="text-dark-3 text-sm">最后扫描: ${this.formatDate(box.lastScanned)}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-${this.getStatusColor(box.status)}/10 flex items-center justify-center text-${this.getStatusColor(box.status)}">
              <i class="fa ${box.icon} text-xl"></i>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-dark-3">容量</span>
              <span class="font-medium">${box.capacityPercentage}%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-${this.getStatusColor(box.status)} h-2 rounded-full" style="width: ${box.capacityPercentage}%"></div>
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-dark-3 text-sm">
              <i class="fa fa-cubes mr-1"></i> ${box.itemCount || 0} 件物品
            </span>
            <button class="text-primary hover:text-primary/80 transition-all flex items-center text-sm font-medium"
                    onclick="app.showBoxDetail('${box._id}')">
              查看详情 <i class="fa fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 渲染最近活动
  renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-dark-3 text-sm text-center">暂无活动记录</p>';
      return;
    }

    container.innerHTML = activities.map((activity, index) => `
      <div class="flex">
        <div class="relative mr-4">
          <div class="w-8 h-8 rounded-full bg-${activity.color}/10 flex items-center justify-center text-${activity.color}">
            <i class="fa ${activity.icon}"></i>
          </div>
          ${index < activities.length - 1 ? '<div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-0.5 h-full bg-gray-200"></div>' : ''}
        </div>
        <div>
          <p class="text-sm font-medium">${activity.message}</p>
          <p class="text-dark-3 text-xs mt-1">${this.formatDate(activity.time)}</p>
        </div>
      </div>
    `).join('');
  }

  // 显示盒子详情
  async showBoxDetail(boxId) {
    try {
      const response = await fetch(`${this.apiBase}/boxes/${boxId}`);
      const result = await response.json();

      if (result.success) {
        this.currentBox = result.data;
        this.renderBoxDetailModal(result.data);
        this.showModal('box-detail-modal');
        
        // 加载盒子中的物品
        await this.loadBoxItems(boxId);
      }
    } catch (error) {
      console.error('❌ 加载盒子详情失败:', error);
      this.showNotification('加载盒子详情失败', 'error');
    }
  }

  // 搜索功能
  async searchItems(query) {
    if (!query.trim()) {
      this.loadDashboard();
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/boxes?search=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (result.success) {
        this.renderBoxList(result.data);
      }
    } catch (error) {
      console.error('❌ 搜索失败:', error);
      this.showNotification('搜索失败', 'error');
    }
  }

  // 通知系统
  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const colors = {
      success: 'bg-success text-white',
      error: 'bg-danger text-white',
      warning: 'bg-warning text-white',
      info: 'bg-primary text-white'
    };

    const icons = {
      success: 'fa-check',
      error: 'fa-times',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const notification = document.createElement('div');
    notification.className = `${colors[type]} p-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-full opacity-0`;
    notification.innerHTML = `
      <i class="fa ${icons[type]}"></i>
      <span>${message}</span>
      <button class="ml-auto" onclick="this.parentElement.remove()">
        <i class="fa fa-times"></i>
      </button>
    `;

    container.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // 自动消失
    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // 工具函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  getStatusColor(status) {
    const colors = {
      'active': 'primary',
      'inactive': 'gray',
      'maintenance': 'warning'
    };
    return colors[status] || 'gray';
  }

  getStatusText(status) {
    const texts = {
      'active': '已扫描',
      'inactive': '未扫描',
      'maintenance': '维护中'
    };
    return texts[status] || status;
  }

  formatDate(date) {
    if (!date) return '未扫描';
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return target.toLocaleDateString();
  }

  updateNFCStatus(message, status) {
    const messageEl = document.getElementById('nfc-message');
    const statusEl = document.getElementById('nfc-status');
    
    if (messageEl) messageEl.textContent = message;
    
    if (statusEl) {
      statusEl.className = 'w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 border-2 border-dashed';
      
      switch (status) {
        case 'ready':
          statusEl.className += ' bg-primary/5 border-primary/30';
          break;
        case 'scanning':
          statusEl.className += ' bg-warning/5 border-warning/30 animate-pulse';
          break;
        case 'success':
          statusEl.className += ' bg-success/5 border-success/30';
          break;
        case 'error':
          statusEl.className += ' bg-danger/5 border-danger/30';
          break;
        default:
          statusEl.className += ' bg-gray-100 border-gray-300';
      }
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showLoading() {
    // 实现加载状态
  }

  hideLoading() {
    // 隐藏加载状态
  }

  checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const nfcId = urlParams.get('nfc');
    
    if (nfcId) {
      this.handleNFCRead(nfcId);
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NFCHomeManager();
});

// 注册Service Worker (PWA支持)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('❌ SW registration failed: ', registrationError);
      });
  });
} 
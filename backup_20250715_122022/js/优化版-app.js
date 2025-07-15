class NFCHomeManagerOptimized {
  constructor() {
    this.apiBase = '/api';
    this.currentBox = null;
    this.nfcSupported = 'NDEFReader' in window;
    this.currentPage = 1;
    this.isLoading = false;
    this.cache = new Map(); // 添加缓存机制
    this.debounceTimers = new Map(); // 防抖计时器
    this.observers = new Map(); // 观察者模式
    this.init();
  }

  async init() {
    console.log('🚀 NFC智能家居管理系统初始化...');
    this.showLoadingSkeleton();
    this.initEventListeners();
    this.initIntersectionObserver(); // 懒加载
    this.initNFC();
    this.initServiceWorker(); // PWA优化
    await this.loadDashboard();
    this.checkURLParams();
    this.hideLoadingSkeleton();
  }

  // 骨架屏加载效果
  showLoadingSkeleton() {
    const container = document.getElementById('boxes-container');
    if (container) {
      container.innerHTML = Array(6).fill(0).map(() => `
        <div class="animate-pulse">
          <div class="bg-gray-200 rounded-2xl h-48 mb-4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      `).join('');
    }
  }

  hideLoadingSkeleton() {
    // 延迟隐藏确保数据加载完成
    setTimeout(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      skeletons.forEach(skeleton => skeleton.remove());
    }, 500);
  }

  // 懒加载优化
  initIntersectionObserver() {
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('opacity-0');
            img.classList.add('opacity-100');
            this.imageObserver.unobserve(img);
          }
        }
      });
    });
  }

  // 增强的防抖函数
  debounce(func, delay, immediate = false) {
    const key = func.toString();
    return (...args) => {
      const callNow = immediate && !this.debounceTimers.get(key);
      clearTimeout(this.debounceTimers.get(key));
      
      this.debounceTimers.set(key, setTimeout(() => {
        this.debounceTimers.delete(key);
        if (!immediate) func.apply(this, args);
      }, delay));
      
      if (callNow) func.apply(this, args);
    };
  }

  // 增强的缓存机制
  async fetchWithCache(url, options = {}, cacheTime = 5 * 60 * 1000) { // 5分钟缓存
    const cacheKey = url + JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      this.showNotification('网络请求失败，请检查连接', 'error');
      throw error;
    }
  }

  // 优化的搜索功能
  initEventListeners() {
    // 使用事件委托提升性能
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    document.addEventListener('input', this.handleGlobalInput.bind(this));

    // NFC扫描按钮
    const nfcButtons = ['nfc-scan-btn', 'mobile-nfc-btn'];
    nfcButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', this.startNFCScan.bind(this), { passive: true });
      }
    });

    // 搜索功能（优化防抖）
    const searchBoxes = ['search-box', 'mobile-search-box'];
    searchBoxes.forEach(id => {
      const searchBox = document.getElementById(id);
      if (searchBox) {
        searchBox.addEventListener('input', 
          this.debounce(this.searchItems.bind(this), 300)
        );
      }
    });
  }

  handleGlobalClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    switch (action) {
      case 'add-box':
        this.showAddBoxModal();
        break;
      case 'view-box':
        this.showBoxDetail(id);
        break;
      case 'edit-box':
        this.editBox(id);
        break;
      case 'delete-box':
        this.deleteBox(id);
        break;
      case 'load-more':
        this.loadMoreBoxes();
        break;
    }
  }

  handleGlobalInput(event) {
    if (event.target.matches('[data-search]')) {
      const query = event.target.value.trim();
      this.debounce(this.searchItems.bind(this), 300)(query);
    }
  }

  // Service Worker 初始化
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW注册成功:', registration.scope);
      } catch (error) {
        console.log('SW注册失败:', error);
      }
    }
  }

  // 增强的NFC功能
  async initNFC() {
    if (this.nfcSupported) {
      console.log('✅ NFC功能可用');
      this.updateNFCStatus('ready', 'NFC功能已准备就绪');
    } else {
      console.log('❌ 设备不支持NFC');
      this.updateNFCStatus('unavailable', '设备不支持NFC功能');
    }
  }

  updateNFCStatus(status, message) {
    const statusElement = document.getElementById('nfc-status');
    const messageElement = document.getElementById('nfc-message');
    
    if (statusElement && messageElement) {
      statusElement.className = `w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 border-2 border-dashed transition-all ${
        status === 'ready' ? 'bg-primary-50 border-primary-300' :
        status === 'scanning' ? 'bg-warning/10 border-warning animate-pulse-slow' :
        status === 'success' ? 'bg-success/10 border-success' :
        'bg-gray-100 border-gray-300'
      }`;
      
      messageElement.textContent = message;
      messageElement.className = `text-sm ${
        status === 'success' ? 'text-success' :
        status === 'error' ? 'text-danger' :
        'text-dark-600'
      }`;
    }
  }

  async startNFCScan() {
    if (!this.nfcSupported) {
      this.showNotification('设备不支持NFC功能', 'error');
      return;
    }

    try {
      this.updateNFCStatus('scanning', '正在扫描NFC标签...');
      
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', ({ message, serialNumber }) => {
        console.log('NFC标签读取成功:', { message, serialNumber });
        this.handleNFCRead(serialNumber);
      });

      // 10秒后自动停止扫描
      setTimeout(() => {
        this.updateNFCStatus('ready', '扫描已停止，可重新开始');
      }, 10000);

    } catch (error) {
      console.error('NFC扫描失败:', error);
      this.updateNFCStatus('error', 'NFC扫描失败，请重试');
      this.showNotification('NFC扫描失败: ' + error.message, 'error');
    }
  }

  async handleNFCRead(nfcId) {
    try {
      this.updateNFCStatus('success', '标签读取成功！');
      
      const box = await this.fetchWithCache(`${this.apiBase}/boxes/nfc/${nfcId}`);
      
      if (box.success) {
        this.showNotification(`发现盒子: ${box.data.name}`, 'success');
        this.showBoxDetail(box.data.id);
      } else {
        this.showNotification('未找到对应的盒子', 'warning');
        this.showBindNFCModal(nfcId);
      }
    } catch (error) {
      this.showNotification('查询NFC标签失败', 'error');
    }
  }

  // 优化的通知系统
  showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container') || this.createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `
      notification flex items-center p-4 rounded-lg shadow-lg border-l-4 transform translate-x-full transition-all duration-300
      ${type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
        type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
        type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
        'bg-blue-50 border-blue-500 text-blue-800'}
    `;

    const icon = {
      success: '✅',
      error: '❌', 
      warning: '⚠️',
      info: 'ℹ️'
    }[type];

    notification.innerHTML = `
      <span class="mr-3 text-lg">${icon}</span>
      <span class="flex-1">${message}</span>
      <button class="ml-3 text-lg hover:opacity-70" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(notification);

    // 动画进入
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 100);

    // 自动移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
  }

  // 优化的数据加载
  async loadDashboard() {
    try {
      const [boxesData, statsData] = await Promise.all([
        this.fetchWithCache(`${this.apiBase}/boxes?page=1&limit=6`),
        this.fetchWithCache(`${this.apiBase}/dashboard/stats`)
      ]);

      this.updateStats(statsData.data || {});
      this.renderBoxes(boxesData.data || []);
      this.loadRecentActivity();
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      this.showNotification('加载数据失败，请刷新页面重试', 'error');
    }
  }

  updateStats(stats) {
    const elements = {
      'total-boxes': stats.totalBoxes || 0,
      'total-items': stats.totalItems || 0,
      'today-scans': stats.todayScans || 0,
      'storage-rate': `${stats.storageRate || 0}%`
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        // 数字动画效果
        if (typeof value === 'number') {
          this.animateNumber(element, 0, value, 1000);
        } else {
          element.textContent = value;
        }
      }
    });
  }

  animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  // 优化的盒子渲染
  renderBoxes(boxes) {
    const container = document.getElementById('boxes-container');
    if (!container) return;

    container.innerHTML = boxes.map(box => this.createBoxCard(box)).join('');

    // 为图片添加懒加载
    container.querySelectorAll('img[data-src]').forEach(img => {
      this.imageObserver.observe(img);
    });
  }

  createBoxCard(box) {
    return `
      <div class="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="relative mb-4">
          <img data-src="${box.image || 'https://picsum.photos/400/200?random=' + box.id}" 
               alt="${box.name}" 
               class="w-full h-40 object-cover rounded-xl opacity-0 transition-opacity duration-300">
          <div class="absolute top-3 right-3">
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium ${box.items?.length > 0 ? 'text-green-600' : 'text-gray-500'}">
              ${box.items?.length || 0} 物品
            </span>
          </div>
        </div>
        
        <div class="space-y-2">
          <h3 class="font-semibold text-lg text-dark-900 group-hover:text-primary-600 transition-colors">${box.name}</h3>
          <p class="text-dark-600 text-sm line-clamp-2">${box.description || '暂无描述'}</p>
          <div class="flex items-center text-xs text-dark-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            ${box.location || '未设置位置'}
          </div>
        </div>
        
        <div class="mt-4 flex space-x-2">
          <button data-action="view-box" data-id="${box.id}" 
                  class="flex-1 py-2 px-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm font-medium">
            查看详情
          </button>
          <button data-action="edit-box" data-id="${box.id}"
                  class="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <svg class="w-4 h-4 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // 其他方法保持原有功能，但加入性能优化...
  async searchItems(query) {
    if (query.length < 2) {
      this.loadDashboard();
      return;
    }

    try {
      const results = await this.fetchWithCache(`${this.apiBase}/search?q=${encodeURIComponent(query)}`);
      this.renderSearchResults(results.data || []);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const activities = await this.fetchWithCache(`${this.apiBase}/activities/recent?limit=5`);
      this.renderRecentActivity(activities.data || []);
    } catch (error) {
      console.error('加载最近活动失败:', error);
    }
  }

  renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-dark-500 text-sm text-center py-4">暂无最近活动</p>';
      return;
    }

    container.innerHTML = activities.map(activity => `
      <div class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-dark-900 truncate">${activity.action}</p>
          <p class="text-xs text-dark-500">${this.formatTime(activity.createdAt)}</p>
        </div>
      </div>
    `).join('');
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.nfcApp = new NFCHomeManagerOptimized();
}); 
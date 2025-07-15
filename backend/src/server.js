const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 导入MySQL数据库配置
const { testConnection, syncDatabase } = require('./models/mysql');

// 导入路由
const boxRoutes = require('./routes/boxes');
const itemRoutes = require('./routes/items');
const nfcRoutes = require('./routes/nfc');
const fileRoutes = require('./routes/files');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件 - 优化的CSP配置
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.tailwindcss.com", 
        "https://cdn.jsdelivr.net", 
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // TailwindCSS需要
        "https://cdn.tailwindcss.com", 
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:",
        "https://picsum.photos",
        "https://images.unsplash.com", // 如果使用Unsplash图片
        "https://*.googleapis.com" // Google服务图片
      ],
      fontSrc: [
        "'self'", 
        "data:",
        "https://fonts.gstatic.com", 
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "https://api.unsplash.com", // 如果连接到Unsplash API
        "ws:", // WebSocket支持
        "wss:" // 安全WebSocket支持
      ],
      objectSrc: ["'none'"], // 阻止插件
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(compression());

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000 // 限制每个IP最多1000次请求
});
app.use('/api', limiter);

// 基础中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));

// 数据库连接和同步
const initDatabase = async () => {
  try {
    await testConnection();
    await syncDatabase();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

initDatabase();

// API路由
app.use('/api/health', healthRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 前端路由（SPA支持）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/sw.js'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📱 前端界面: http://101.35.16.205:${PORT}`);
  console.log(`🔌 API接口: http://101.35.16.205:${PORT}/api`);
});

module.exports = app; 
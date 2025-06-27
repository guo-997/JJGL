# 🏠 NFC家庭物品管理系统

一个基于NFC技术的智能家庭物品管理系统，帮助您轻松管理家中的各种物品。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-16%2B-green.svg)
![MongoDB](https://img.shields.io/badge/mongodb-4.4%2B-green.svg)

## ✨ 主要功能

- 🏷️ **NFC标签管理** - 为每个储物盒分配NFC标签，手机轻触即可查看内容
- 📦 **智能盒子管理** - 创建和管理不同类型的储物盒
- 📱 **物品详细信息** - 为每个物品添加照片、描述、文档等详细信息
- 🔍 **快速搜索** - 支持按名称、类别、标签等多维度搜索
- 📊 **统计报表** - 查看物品使用情况和库存状态
- 📱 **PWA支持** - 可安装到手机主屏幕，支持离线使用
- 📁 **文件管理** - 支持上传照片和PDF说明书
- 📈 **实时仪表板** - 显示盒子数量、物品统计、扫描记录等

## 🚀 快速开始

### 前置要求

- Node.js 16+
- MongoDB 4.4+
- 支持NFC的设备（用于扫描功能）

### 📥 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/guo-997/JJGL.git
cd JJGL
```

2. **快速启动（Windows）**
```bash
# 双击运行 start.bat 脚本，自动安装依赖并启动
start.bat

# 或者开发模式（自动重启）
dev.bat
```

3. **手动安装**
```bash
# 安装依赖
npm install

# 配置环境变量（创建 .env 文件）
MONGODB_URI=mongodb://localhost:27017/nfc-home-manager
PORT=3000
NODE_ENV=development

# 启动服务器
npm start
```

4. **访问应用**
- 📱 前端界面: http://localhost:3000
- 🔌 API接口: http://localhost:3000/api

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **MongoDB** + **Mongoose** - 数据库和ODM
- **Multer** - 文件上传处理
- **Helmet** - 安全中间件
- **JWT** - 身份验证（计划中）

### 前端
- **HTML5** + **CSS3** + **JavaScript** - 基础技术
- **Tailwind CSS** - 现代化UI框架
- **Chart.js** - 数据可视化
- **Font Awesome** - 图标库
- **Web NFC API** - NFC功能支持

### PWA特性
- **Service Worker** - 离线缓存
- **Web App Manifest** - 应用安装
- **响应式设计** - 多设备适配

## 📱 使用指南

### 🏷️ NFC使用流程

1. **创建储物盒**
   - 点击"新建盒子"按钮
   - 填写盒子名称、位置等信息

2. **绑定NFC标签**
   - 在盒子设置中添加NFC标签ID
   - 将物理NFC标签贴在储物盒上

3. **添加物品**
   - 进入盒子详情页
   - 添加物品信息、上传照片和文档

4. **NFC扫描**
   - 确保手机NFC功能已开启
   - 将NFC标签贴近手机背面
   - 系统自动打开对应盒子页面

5. **搜索管理**
   - 使用搜索框快速找到物品
   - 查看统计数据和使用情况

## 📁 项目结构

```
JJGL/
├── 📂 backend/              # 后端服务
│   ├── 📂 src/
│   │   ├── 📂 models/       # 数据模型
│   │   ├── 📂 routes/       # API路由
│   │   └── 📄 server.js     # 服务器入口
│   └── 📂 uploads/          # 文件上传目录
├── 📂 frontend/             # 前端应用
│   ├── 📄 index.html        # 主页面
│   ├── 📂 js/               # JavaScript文件
│   ├── 📄 manifest.json     # PWA配置
│   └── 📄 sw.js             # Service Worker
├── 📄 package.json          # 项目配置
├── 📄 start.bat             # Windows启动脚本
├── 📄 dev.bat               # 开发模式脚本
└── 📄 README.md             # 项目文档
```

## 🔧 API接口

### 盒子管理
- `GET /api/boxes` - 获取盒子列表
- `POST /api/boxes` - 创建新盒子
- `GET /api/boxes/:id` - 获取盒子详情
- `PUT /api/boxes/:id` - 更新盒子信息
- `DELETE /api/boxes/:id` - 删除盒子

### NFC功能
- `GET /api/boxes/nfc/:nfcId` - 根据NFC ID获取盒子
- `POST /api/nfc/bind` - 绑定NFC标签
- `POST /api/nfc/unbind` - 解绑NFC标签

### 物品管理
- `GET /api/items` - 获取物品列表
- `POST /api/items` - 添加新物品
- `GET /api/items/:id` - 获取物品详情
- `PUT /api/items/:id` - 更新物品信息
- `DELETE /api/items/:id` - 删除物品

### 文件上传
- `POST /api/files/photos/:itemId` - 上传物品照片
- `POST /api/files/documents/:itemId` - 上传物品文档

### 数据统计
- `GET /api/dashboard/stats` - 获取仪表板统计数据

## 🔒 安全特性

- ✅ Helmet安全中间件
- ✅ 请求速率限制
- ✅ 文件类型和大小验证
- ✅ 数据输入验证
- ⏳ JWT身份验证（开发中）

## 📱 PWA功能

- ✅ 可安装到手机主屏幕
- ✅ 离线缓存基础功能
- ✅ 响应式设计
- ✅ 自适应图标和启动画面
- ⏳ 后台同步（计划中）
- ⏳ 推送通知（计划中）

## 🚧 开发计划

### 即将推出
- 🔐 用户系统和权限管理
- 📊 数据导出（Excel/PDF）
- 📸 条形码支持
- 🗺️ 3D位置地图
- ⏰ 物品过期提醒
- 👥 家庭成员共享

### 长期规划
- 🤖 AI智能分类
- 🔗 物联网设备集成
- 📱 移动端原生应用
- ☁️ 云端同步

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看文件了解详情

## 📞 支持与反馈

- 🐛 [问题反馈](https://github.com/guo-997/JJGL/issues)
- 💡 [功能建议](https://github.com/guo-997/JJGL/discussions)
- 📧 邮箱联系: [your-email@example.com]

## 🙏 致谢

- [Tailwind CSS](https://tailwindcss.com/) - 优秀的CSS框架
- [Font Awesome](https://fontawesome.com/) - 图标支持
- [Chart.js](https://www.chartjs.org/) - 图表组件
- [Express.js](https://expressjs.com/) - 后端框架
- [MongoDB](https://www.mongodb.com/) - 数据库支持

---

**让家庭物品管理变得简单智能！** 🏠✨

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！ 
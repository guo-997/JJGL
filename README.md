# NFC家庭物品管理系统

一个基于NFC技术的智能家庭物品管理系统，帮助您轻松管理家中的各种物品。

## ✨ 主要功能

- 🏷️ **NFC标签管理**：为每个储物盒分配NFC标签，手机轻触即可查看内容
- 📦 **智能盒子管理**：创建和管理不同类型的储物盒
- 📱 **物品详细信息**：为每个物品添加照片、描述、文档等详细信息
- 🔍 **快速搜索**：支持按名称、类别、标签等多维度搜索
- 📊 **统计报表**：查看物品使用情况和库存状态
- 📱 **PWA支持**：可安装到手机主屏幕，支持离线使用
- 📁 **文件管理**：支持上传照片和PDF说明书

## 🚀 快速开始

### 前置要求

- Node.js 16+ 
- MongoDB 4.4+
- 支持NFC的设备（用于扫描功能）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd nfc-home-manager
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境**
```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等配置
```

4. **启动MongoDB**
```bash
# 如果使用本地MongoDB
mongod
```

5. **创建必要目录**
```bash
npm run setup
```

6. **启动开发服务器**
```bash
npm run dev
```

7. **访问应用**
- 打开浏览器访问: `http://localhost:3000`
- 使用支持NFC的手机访问以体验完整功能

## 📱 如何使用

### 1. 创建储物盒
- 点击"新建盒子"按钮
- 填写盒子名称、位置等信息
- 可选择绑定NFC标签

### 2. 添加物品
- 进入盒子详情页
- 点击"添加物品"
- 填写物品信息，上传照片和文档

### 3. NFC扫描
- 确保手机NFC功能已开启
- 将NFC标签贴近手机背面
- 系统会自动打开对应盒子的详情页

### 4. 搜索物品
- 使用顶部搜索框
- 支持模糊搜索物品名称、盒子名称等

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **MongoDB** + **Mongoose** - 数据库
- **Multer** - 文件上传处理
- **Helmet** - 安全中间件

### 前端
- **HTML5** + **CSS3** + **JavaScript** - 基础技术
- **Tailwind CSS** - UI框架
- **Chart.js** - 图表组件
- **Font Awesome** - 图标库

### PWA
- **Service Worker** - 离线缓存
- **Web App Manifest** - 应用安装
- **Web NFC API** - NFC功能

## 📁 项目结构

```
nfc-home-manager/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API路由
│   │   └── server.js      # 服务器入口
│   └── uploads/           # 文件上传目录
├── frontend/              # 前端代码
│   ├── index.html        # 主页面
│   ├── js/app.js         # 应用逻辑
│   ├── manifest.json     # PWA配置
│   └── sw.js             # Service Worker
├── package.json          # 项目配置
└── README.md            # 项目说明
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

## 🔒 安全考虑

- 使用Helmet中间件提供基础安全防护
- 实现请求速率限制
- 文件上传类型和大小限制
- 输入数据验证和清理

## 📱 PWA功能

- ✅ 可安装到手机主屏幕
- ✅ 离线缓存基础功能
- ✅ 自适应图标和启动画面
- ✅ 后台同步（计划中）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

## 🙏 致谢

- 感谢 Tailwind CSS 提供优秀的UI框架
- 感谢 Font Awesome 提供图标支持
- 感谢 Chart.js 提供图表组件

---

**享受智能的家庭物品管理体验！** 🏠✨ 
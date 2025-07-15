const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { Item } = require('../models/mysql');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subDir = file.fieldname === 'photos' ? 'photos' : 'documents';
    const fullPath = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photos') {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'), false);
    }
  } else if (file.fieldname === 'documents') {
    // 允许常见文档格式
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文档格式'), false);
    }
  } else {
    cb(new Error('未知的文件类型'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  }
});

// 上传物品照片
router.post('/photos/:itemId', upload.array('photos', 5), async (req, res) => {
  try {
    const { itemId } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有选择文件'
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      // 如果物品不存在，删除已上传的文件
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 处理上传的照片
    const photoData = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/photos/${file.filename}`,
      size: file.size,
      uploadDate: new Date()
    }));

    // 添加到物品的照片数组
    item.photos.push(...photoData);
    await item.save();

    res.json({
      success: true,
      data: photoData,
      message: '照片上传成功'
    });
  } catch (error) {
    // 出错时删除已上传的文件
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: '照片上传失败',
      error: error.message
    });
  }
});

// 上传物品文档
router.post('/documents/:itemId', upload.array('documents', 5), async (req, res) => {
  try {
    const { itemId } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有选择文件'
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      // 如果物品不存在，删除已上传的文件
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 处理上传的文档
    const documentData = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/documents/${file.filename}`,
      type: path.extname(file.originalname).toLowerCase(),
      size: file.size,
      uploadDate: new Date()
    }));

    // 添加到物品的文档数组
    item.documents.push(...documentData);
    await item.save();

    res.json({
      success: true,
      data: documentData,
      message: '文档上传成功'
    });
  } catch (error) {
    // 出错时删除已上传的文件
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: '文档上传失败',
      error: error.message
    });
  }
});

// 删除照片
router.delete('/photos/:itemId/:photoIndex', async (req, res) => {
  try {
    const { itemId, photoIndex } = req.params;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    const index = parseInt(photoIndex);
    if (index < 0 || index >= item.photos.length) {
      return res.status(400).json({
        success: false,
        message: '照片索引无效'
      });
    }

    const photo = item.photos[index];
    const filePath = path.join(uploadDir, 'photos', photo.filename);
    
    // 删除文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数组中移除
    item.photos.splice(index, 1);
    await item.save();

    res.json({
      success: true,
      message: '照片删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除照片失败',
      error: error.message
    });
  }
});

// 删除文档
router.delete('/documents/:itemId/:documentIndex', async (req, res) => {
  try {
    const { itemId, documentIndex } = req.params;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    const index = parseInt(documentIndex);
    if (index < 0 || index >= item.documents.length) {
      return res.status(400).json({
        success: false,
        message: '文档索引无效'
      });
    }

    const document = item.documents[index];
    const filePath = path.join(uploadDir, 'documents', document.filename);
    
    // 删除文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数组中移除
    item.documents.splice(index, 1);
    await item.save();

    res.json({
      success: true,
      message: '文档删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除文档失败',
      error: error.message
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    message: error.message || '文件上传失败'
  });
});

module.exports = router; 
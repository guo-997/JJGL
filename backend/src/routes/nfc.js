const express = require('express');
const router = express.Router();
// 使用兼容层来支持MySQL
const { Box } = require('../models/compat');

// 根据NFC ID获取盒子信息
router.get('/scan/:nfcId', async (req, res) => {
  try {
    const { nfcId } = req.params;
    
    // 查找对应的盒子
    const box = await Box.findOne({ nfcId });
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的NFC标签',
        nfcId
      });
    }

    // 更新扫描记录
    box.lastScanned = new Date();
    box.scanCount += 1;
    await box.save();

    res.json({
      success: true,
      data: box,
      message: 'NFC扫描成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'NFC扫描失败',
      error: error.message
    });
  }
});

// 绑定NFC标签到盒子
router.post('/bind', async (req, res) => {
  try {
    const { boxId, nfcId } = req.body;
    
    if (!boxId || !nfcId) {
      return res.status(400).json({
        success: false,
        message: '盒子ID和NFC ID不能为空'
      });
    }

    // 检查NFC ID是否已被使用
    const existingBox = await Box.findOne({ nfcId });
    if (existingBox && existingBox._id.toString() !== boxId) {
      return res.status(400).json({
        success: false,
        message: '该NFC标签已被其他盒子使用'
      });
    }

    // 更新盒子的NFC ID
    const box = await Box.findByIdAndUpdate(
      boxId,
      { nfcId },
      { new: true, runValidators: true }
    );

    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }

    res.json({
      success: true,
      data: box,
      message: 'NFC标签绑定成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'NFC绑定失败',
      error: error.message
    });
  }
});

// 解绑NFC标签
router.post('/unbind', async (req, res) => {
  try {
    const { boxId } = req.body;
    
    if (!boxId) {
      return res.status(400).json({
        success: false,
        message: '盒子ID不能为空'
      });
    }

    const box = await Box.findByIdAndUpdate(
      boxId,
      { $unset: { nfcId: 1 } },
      { new: true }
    );

    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }

    res.json({
      success: true,
      data: box,
      message: 'NFC标签解绑成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'NFC解绑失败',
      error: error.message
    });
  }
});

// 获取所有绑定的NFC标签
router.get('/bindings', async (req, res) => {
  try {
    const boxes = await Box.find({ 
      nfcId: { $exists: true, $ne: null } 
    }).select('name code nfcId lastScanned scanCount');

    res.json({
      success: true,
      data: boxes,
      count: boxes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取NFC绑定列表失败',
      error: error.message
    });
  }
});

// 验证NFC ID格式
router.post('/validate', async (req, res) => {
  try {
    const { nfcId } = req.body;
    
    if (!nfcId) {
      return res.status(400).json({
        success: false,
        message: 'NFC ID不能为空'
      });
    }

    // 简单的NFC ID格式验证
    const nfcPattern = /^[0-9A-Fa-f]+$/;
    if (!nfcPattern.test(nfcId)) {
      return res.status(400).json({
        success: false,
        message: 'NFC ID格式无效'
      });
    }

    // 检查是否已被使用
    const existingBox = await Box.findOne({ nfcId });
    
    res.json({
      success: true,
      data: {
        nfcId,
        available: !existingBox,
        boundTo: existingBox ? existingBox.name : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'NFC验证失败',
      error: error.message
    });
  }
});

module.exports = router; 
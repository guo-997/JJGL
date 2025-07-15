const express = require('express');
const router = express.Router();
// 直接使用MySQL模型
const { Box, Item } = require('../models/mysql');
const { Op } = require('sequelize');

// 获取所有盒子
router.get('/', async (req, res) => {
  try {
    const { search, status, limit = 20, page = 1 } = req.query;
    
    let where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const boxes = await Box.findAll({
      where,
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // 手动计算物品数量
    for (let box of boxes) {
      const itemCount = await Item.count({ where: { box_id: box.id } });
      box.dataValues.itemCount = itemCount;
    }

    const total = await Box.count({ where });

    res.json({
      success: true,
      data: boxes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取盒子列表失败',
      error: error.message
    });
  }
});

// 根据NFC ID获取盒子
router.get('/nfc/:nfcId', async (req, res) => {
  try {
    const { nfcId } = req.params;
    
    const box = await Box.findOne({ where: { nfc_id: nfcId } });
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的盒子'
      });
    }

    // 获取物品数量
    const itemCount = await Item.count({ where: { box_id: box.id } });
    
    // 添加物品数量到返回数据
    const boxData = box.toJSON();
    boxData.itemCount = itemCount;

    res.json({
      success: true,
      data: boxData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取盒子信息失败',
      error: error.message
    });
  }
});

// 获取单个盒子详情
router.get('/:id', async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }

    // 获取物品数量
    const itemCount = await Item.countDocuments({ boxId: box._id });
    box.itemCount = itemCount;

    res.json({
      success: true,
      data: box
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取盒子详情失败',
      error: error.message
    });
  }
});

// 创建新盒子
router.post('/', async (req, res) => {
  try {
    const box = await Box.create(req.body);
    
    res.status(201).json({
      success: true,
      data: box,
      message: '盒子创建成功'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: '盒子编码或NFC ID已存在'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '创建盒子失败',
        error: error.message
      });
    }
  }
});

// 更新盒子
router.put('/:id', async (req, res) => {
  try {
    const box = await Box.findByIdAndUpdate(
      req.params.id,
      req.body,
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
      message: '盒子更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新盒子失败',
      error: error.message
    });
  }
});

// 删除盒子
router.delete('/:id', async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }

    // 检查是否有物品
    const itemCount = await Item.countDocuments({ boxId: req.params.id });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: '盒子中还有物品，无法删除'
      });
    }

    await Box.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '盒子删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除盒子失败',
      error: error.message
    });
  }
});

// 获取盒子中的物品
router.get('/:id/items', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const items = await Item.find({ boxId: req.params.id })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Item.countDocuments({ boxId: req.params.id });

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取物品列表失败',
      error: error.message
    });
  }
});

module.exports = router; 
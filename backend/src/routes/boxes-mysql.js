const express = require('express');
const router = express.Router();
const { Box, Item } = require('../models/mysql');
const { Op } = require('sequelize');

// 获取所有盒子
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, location } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }
    
    const { count, rows: boxes } = await Box.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: Item,
        as: 'items',
        attributes: ['id']
      }]
    });
    
    res.json({
      success: true,
      data: boxes,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取盒子列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取盒子列表失败',
      error: error.message
    });
  }
});

// 根据ID获取盒子详情
router.get('/:id', async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id, {
      include: [{
        model: Item,
        as: 'items',
        order: [['name', 'ASC']]
      }]
    });
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }
    
    res.json({
      success: true,
      data: box
    });
  } catch (error) {
    console.error('获取盒子详情失败:', error);
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
    const { name, location, description, capacity, nfcId, imageUrl } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '盒子名称不能为空'
      });
    }
    
    // 检查NFC ID是否已存在
    if (nfcId) {
      const existingBox = await Box.findOne({ where: { nfcId } });
      if (existingBox) {
        return res.status(400).json({
          success: false,
          message: 'NFC标签已被其他盒子使用'
        });
      }
    }
    
    const box = await Box.create({
      name,
      location,
      description,
      capacity: capacity || 0,
      nfcId,
      imageUrl
    });
    
    res.status(201).json({
      success: true,
      data: box,
      message: '盒子创建成功'
    });
  } catch (error) {
    console.error('创建盒子失败:', error);
    res.status(500).json({
      success: false,
      message: '创建盒子失败',
      error: error.message
    });
  }
});

// 更新盒子
router.put('/:id', async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id);
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }
    
    const { name, location, description, capacity, nfcId, imageUrl } = req.body;
    
    // 如果修改了NFC ID，检查是否已被使用
    if (nfcId && nfcId !== box.nfcId) {
      const existingBox = await Box.findOne({ 
        where: { 
          nfcId,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (existingBox) {
        return res.status(400).json({
          success: false,
          message: 'NFC标签已被其他盒子使用'
        });
      }
    }
    
    await box.update({
      name: name || box.name,
      location: location !== undefined ? location : box.location,
      description: description !== undefined ? description : box.description,
      capacity: capacity !== undefined ? capacity : box.capacity,
      nfcId: nfcId !== undefined ? nfcId : box.nfcId,
      imageUrl: imageUrl !== undefined ? imageUrl : box.imageUrl
    });
    
    res.json({
      success: true,
      data: box,
      message: '盒子更新成功'
    });
  } catch (error) {
    console.error('更新盒子失败:', error);
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
    const box = await Box.findByPk(req.params.id);
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '盒子不存在'
      });
    }
    
    // 检查盒子是否有物品
    const itemCount = await Item.count({ where: { boxId: req.params.id } });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `盒子中还有 ${itemCount} 个物品，请先移除所有物品`
      });
    }
    
    await box.destroy();
    
    res.json({
      success: true,
      message: '盒子删除成功'
    });
  } catch (error) {
    console.error('删除盒子失败:', error);
    res.status(500).json({
      success: false,
      message: '删除盒子失败',
      error: error.message
    });
  }
});

// 根据NFC ID获取盒子
router.get('/nfc/:nfcId', async (req, res) => {
  try {
    const box = await Box.findOne({
      where: { nfcId: req.params.nfcId },
      include: [{
        model: Item,
        as: 'items',
        order: [['name', 'ASC']]
      }]
    });
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的盒子'
      });
    }
    
    res.json({
      success: true,
      data: box
    });
  } catch (error) {
    console.error('根据NFC ID获取盒子失败:', error);
    res.status(500).json({
      success: false,
      message: '获取盒子信息失败',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
// 直接使用MySQL模型
const { Box, Item } = require('../models/mysql');
const { Op } = require('sequelize');

// 获取仪表板统计数据
router.get('/stats', async (req, res) => {
  try {
    // 并行获取各种统计数据
    const [
      totalBoxes,
      totalItems,
      scannedBoxes,
      lowStockItems,
      recentActivity
    ] = await Promise.all([
      Box.count(),
      Item.count(),
      Box.count({ where: { nfc_id: { [Op.not]: null } } }),
      Item.count({ where: { condition_status: { [Op.in]: ['poor', 'fair'] } } }),
      getRecentActivity()
    ]);

    // 计算增长趋势（这里简化处理，实际可以根据时间范围计算）
    const boxGrowth = Math.floor(Math.random() * 10) - 5; // 模拟数据
    const itemGrowth = Math.floor(Math.random() * 10) - 5; // 模拟数据

    res.json({
      success: true,
      data: {
        totalBoxes,
        totalItems,
        scannedBoxes,
        lowStockItems,
        boxGrowth,
        itemGrowth,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

// 获取最近活动
async function getRecentActivity() {
  try {
    // 获取最近更新的盒子
    const recentBoxes = await Box.findAll({
      attributes: ['name', 'updated_at', 'nfc_id'],
      order: [['updated_at', 'DESC']],
      limit: 5
    });

    // 获取最近添加的物品
    const recentItems = await Item.findAll({
      attributes: ['name', 'box_id', 'created_at'],
      include: [{
        model: Box,
        as: 'box',
        attributes: ['name']
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const activities = [];

    // 处理盒子活动
    recentBoxes.forEach(box => {
      if (box.nfc_id) {
        activities.push({
          type: 'nfc',
          message: `配置了NFC标签的盒子 "${box.name}"`,
          time: box.updated_at,
          icon: 'fa-credit-card',
          color: 'primary'
        });
      }
    });

    // 处理物品活动
    recentItems.forEach(item => {
      activities.push({
        type: 'add',
        message: `添加了物品 "${item.name}" 到 "${item.box ? item.box.name : '未知盒子'}"`,
        time: item.created_at,
        icon: 'fa-plus',
        color: 'success'
      });
    });

    // 按时间排序并返回最近的10条
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  } catch (error) {
    console.error('获取最近活动失败:', error);
    return [];
  }
}

module.exports = router; 
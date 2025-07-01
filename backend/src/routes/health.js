const express = require('express');
const router = express.Router();
const { sequelize } = require('../models/mysql');

// 健康检查接口
router.get('/', async (req, res) => {
  try {
    // 检查数据库连接
    let dbConnected = false;
    let dbStatus = 'disconnected';
    
    try {
      await sequelize.authenticate();
      dbConnected = true;
      dbStatus = 'connected';
    } catch (error) {
      dbConnected = false;
      dbStatus = 'disconnected';
    }

    // 检查服务状态
    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: dbStatus,
        connected: dbConnected
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    // 如果数据库未连接，返回错误状态
    if (!dbConnected) {
      healthInfo.status = 'error';
      return res.status(503).json(healthInfo);
    }

    res.status(200).json(healthInfo);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Box = require('../models/Box');

// 获取所有物品
router.get('/', async (req, res) => {
  try {
    const { search, category, status, boxId, limit = 20, page = 1 } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (boxId) {
      query.boxId = boxId;
    }

    const items = await Item.find(query)
      .populate('boxId', 'name code')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Item.countDocuments(query);

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

// 获取单个物品详情
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('boxId', 'name code location');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取物品详情失败',
      error: error.message
    });
  }
});

// 创建新物品
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    
    // 更新盒子的当前容量
    await updateBoxCapacity(item.boxId);
    
    res.status(201).json({
      success: true,
      data: item,
      message: '物品添加成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加物品失败',
      error: error.message
    });
  }
});

// 更新物品
router.put('/:id', async (req, res) => {
  try {
    const oldItem = await Item.findById(req.params.id);
    if (!oldItem) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // 如果盒子发生变化，更新两个盒子的容量
    if (oldItem.boxId.toString() !== item.boxId.toString()) {
      await updateBoxCapacity(oldItem.boxId);
      await updateBoxCapacity(item.boxId);
    } else {
      await updateBoxCapacity(item.boxId);
    }

    res.json({
      success: true,
      data: item,
      message: '物品更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新物品失败',
      error: error.message
    });
  }
});

// 删除物品
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    const boxId = item.boxId;
    await Item.findByIdAndDelete(req.params.id);
    
    // 更新盒子容量
    await updateBoxCapacity(boxId);
    
    res.json({
      success: true,
      message: '物品删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除物品失败',
      error: error.message
    });
  }
});

// 搜索物品
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    const items = await Item.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .populate('boxId', 'name code location')
    .limit(parseInt(limit))
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message
    });
  }
});

// 获取物品分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const categories = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类统计失败',
      error: error.message
    });
  }
});

// 辅助函数：更新盒子容量
async function updateBoxCapacity(boxId) {
  try {
    const itemCount = await Item.countDocuments({ boxId });
    await Box.findByIdAndUpdate(boxId, {
      'capacity.current': itemCount
    });
  } catch (error) {
    console.error('更新盒子容量失败:', error);
  }
}

module.exports = router; 
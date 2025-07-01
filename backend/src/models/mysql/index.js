const { sequelize, testConnection, syncDatabase } = require('../../config/database');
const Box = require('./Box');
const Item = require('./Item');

// 定义模型关联
Box.hasMany(Item, {
  foreignKey: 'boxId',
  as: 'items',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Item.belongsTo(Box, {
  foreignKey: 'boxId',
  as: 'box'
});

// 创建钩子：当物品添加/删除时更新盒子的物品数量
Item.addHook('afterCreate', async (item, options) => {
  if (item.boxId) {
    const box = await Box.findByPk(item.boxId);
    if (box) {
      const count = await Item.count({ where: { boxId: item.boxId } });
      await box.update({ currentItems: count });
    }
  }
});

Item.addHook('afterDestroy', async (item, options) => {
  if (item.boxId) {
    const box = await Box.findByPk(item.boxId);
    if (box) {
      const count = await Item.count({ where: { boxId: item.boxId } });
      await box.update({ currentItems: count });
    }
  }
});

Item.addHook('afterUpdate', async (item, options) => {
  // 如果物品的boxId改变了
  if (options.fields && options.fields.includes('boxId')) {
    // 更新旧盒子的计数
    if (item._previousDataValues.boxId) {
      const oldBox = await Box.findByPk(item._previousDataValues.boxId);
      if (oldBox) {
        const count = await Item.count({ where: { boxId: item._previousDataValues.boxId } });
        await oldBox.update({ currentItems: count });
      }
    }
    
    // 更新新盒子的计数
    if (item.boxId) {
      const newBox = await Box.findByPk(item.boxId);
      if (newBox) {
        const count = await Item.count({ where: { boxId: item.boxId } });
        await newBox.update({ currentItems: count });
      }
    }
  }
});

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  Box,
  Item
}; 
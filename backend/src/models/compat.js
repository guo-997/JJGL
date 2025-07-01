// MongoDB到MySQL兼容层
// 提供与Mongoose相似的API，内部使用Sequelize

const { Box, Item } = require('./mysql');
const { Op } = require('sequelize');

// 创建兼容的Box模型
const BoxCompat = {
  // 模拟Mongoose的find方法
  find: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    return await Box.findAll({ where });
  },
  
  // 模拟Mongoose的findOne方法
  findOne: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    return await Box.findOne({ where });
  },
  
  // 模拟Mongoose的findById方法
  findById: async (id) => {
    return await Box.findByPk(id);
  },
  
  // 模拟Mongoose的create方法
  create: async (data) => {
    return await Box.create(data);
  },
  
  // 模拟Mongoose的findByIdAndUpdate方法
  findByIdAndUpdate: async (id, update, options = {}) => {
    const box = await Box.findByPk(id);
    if (!box) return null;
    await box.update(update);
    return options.new ? box : box._previousDataValues;
  },
  
  // 模拟Mongoose的findByIdAndDelete方法
  findByIdAndDelete: async (id) => {
    const box = await Box.findByPk(id);
    if (!box) return null;
    await box.destroy();
    return box;
  },
  
  // 模拟Mongoose的countDocuments方法
  countDocuments: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    return await Box.count({ where });
  },
  
  // 模拟populate方法
  populate: async (instance, path) => {
    if (!instance) return null;
    if (path === 'items' || path === 'items.box') {
      const items = await Item.findAll({ where: { boxId: instance.id } });
      instance.dataValues.items = items;
    }
    return instance;
  }
};

// 创建兼容的Item模型
const ItemCompat = {
  find: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    const options = { where };
    
    // 处理populate
    if (query._populate) {
      options.include = [{
        model: Box,
        as: 'box'
      }];
    }
    
    return await Item.findAll(options);
  },
  
  findOne: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    return await Item.findOne({ where });
  },
  
  findById: async (id) => {
    return await Item.findByPk(id);
  },
  
  create: async (data) => {
    // 转换字段名
    if (data.box) {
      data.boxId = data.box;
      delete data.box;
    }
    return await Item.create(data);
  },
  
  findByIdAndUpdate: async (id, update, options = {}) => {
    const item = await Item.findByPk(id);
    if (!item) return null;
    
    // 转换字段名
    if (update.box) {
      update.boxId = update.box;
      delete update.box;
    }
    
    await item.update(update);
    return options.new ? item : item._previousDataValues;
  },
  
  findByIdAndDelete: async (id) => {
    const item = await Item.findByPk(id);
    if (!item) return null;
    await item.destroy();
    return item;
  },
  
  countDocuments: async (query = {}) => {
    const where = convertMongoQueryToSequelize(query);
    return await Item.count({ where });
  },
  
  populate: async (instance, path) => {
    if (!instance) return null;
    if (path === 'box') {
      const box = await Box.findByPk(instance.boxId);
      instance.dataValues.box = box;
    }
    return instance;
  }
};

// 转换MongoDB查询为Sequelize查询
function convertMongoQueryToSequelize(mongoQuery) {
  const sequelizeWhere = {};
  
  for (const [key, value] of Object.entries(mongoQuery)) {
    // 处理特殊查询操作符
    if (key === '$or') {
      sequelizeWhere[Op.or] = value.map(q => convertMongoQueryToSequelize(q));
    } else if (key === '$and') {
      sequelizeWhere[Op.and] = value.map(q => convertMongoQueryToSequelize(q));
    } else if (key === '$regex' || (typeof value === 'object' && value.$regex)) {
      // 处理正则表达式查询
      const pattern = value.$regex || value;
      sequelizeWhere[key] = { [Op.like]: `%${pattern}%` };
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // 处理嵌套的查询操作符
      for (const [op, val] of Object.entries(value)) {
        switch (op) {
          case '$gt':
            sequelizeWhere[key] = { [Op.gt]: val };
            break;
          case '$gte':
            sequelizeWhere[key] = { [Op.gte]: val };
            break;
          case '$lt':
            sequelizeWhere[key] = { [Op.lt]: val };
            break;
          case '$lte':
            sequelizeWhere[key] = { [Op.lte]: val };
            break;
          case '$ne':
            sequelizeWhere[key] = { [Op.ne]: val };
            break;
          case '$in':
            sequelizeWhere[key] = { [Op.in]: val };
            break;
          case '$nin':
            sequelizeWhere[key] = { [Op.notIn]: val };
            break;
          default:
            sequelizeWhere[key] = value;
        }
      }
    } else {
      // 转换字段名
      if (key === 'nfc_id') {
        sequelizeWhere.nfcId = value;
      } else if (key === 'box') {
        sequelizeWhere.boxId = value;
      } else {
        sequelizeWhere[key] = value;
      }
    }
  }
  
  return sequelizeWhere;
}

// 添加查询构建器支持
BoxCompat.find = function(query = {}) {
  const builder = {
    _query: query,
    _sort: null,
    _limit: null,
    _skip: null,
    
    sort(sortObj) {
      this._sort = sortObj;
      return this;
    },
    
    limit(num) {
      this._limit = num;
      return this;
    },
    
    skip(num) {
      this._skip = num;
      return this;
    },
    
    async exec() {
      const where = convertMongoQueryToSequelize(this._query);
      const options = { where };
      
      if (this._sort) {
        options.order = Object.entries(this._sort).map(([key, val]) => 
          [key, val === 1 ? 'ASC' : 'DESC']
        );
      }
      
      if (this._limit) options.limit = this._limit;
      if (this._skip) options.offset = this._skip;
      
      return await Box.findAll(options);
    }
  };
  
  return builder;
};

ItemCompat.find = function(query = {}) {
  const builder = {
    _query: query,
    _sort: null,
    _limit: null,
    _skip: null,
    _populate: null,
    
    sort(sortObj) {
      this._sort = sortObj;
      return this;
    },
    
    limit(num) {
      this._limit = num;
      return this;
    },
    
    skip(num) {
      this._skip = num;
      return this;
    },
    
    populate(path) {
      this._populate = path;
      return this;
    },
    
    async exec() {
      const where = convertMongoQueryToSequelize(this._query);
      const options = { where };
      
      if (this._populate) {
        options.include = [{
          model: Box,
          as: 'box'
        }];
      }
      
      if (this._sort) {
        options.order = Object.entries(this._sort).map(([key, val]) => 
          [key, val === 1 ? 'ASC' : 'DESC']
        );
      }
      
      if (this._limit) options.limit = this._limit;
      if (this._skip) options.offset = this._skip;
      
      return await Item.findAll(options);
    }
  };
  
  return builder;
};

module.exports = {
  Box: BoxCompat,
  Item: ItemCompat
}; 
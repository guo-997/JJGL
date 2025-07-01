const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  boxId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'box_id',
    references: {
      model: 'boxes',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'purchase_date'
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'purchase_price'
  },
  warrantyUntil: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'warranty_until'
  },
  conditionStatus: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
    defaultValue: 'good',
    field: 'condition_status'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('tags');
      return value || [];
    }
  },
  specifications: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      const value = this.getDataValue('specifications');
      return value || {};
    }
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('images');
      return value || [];
    }
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('documents');
      return value || [];
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'items',
  timestamps: true,
  indexes: [
    {
      fields: ['box_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['name']
    }
  ]
});

// 实例方法
Item.prototype.isWarrantyExpired = function() {
  if (!this.warrantyUntil) return null;
  return new Date() > new Date(this.warrantyUntil);
};

Item.prototype.addImage = function(imageData) {
  const images = this.images || [];
  images.push({
    url: imageData.url,
    caption: imageData.caption || '',
    uploadedAt: new Date()
  });
  this.images = images;
};

Item.prototype.addDocument = function(docData) {
  const documents = this.documents || [];
  documents.push({
    name: docData.name,
    url: docData.url,
    type: docData.type || 'other',
    size: docData.size || 0,
    uploadedAt: new Date()
  });
  this.documents = documents;
};

// 类方法
Item.searchByKeyword = async function(keyword) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { category: { [Op.like]: `%${keyword}%` } }
      ]
    }
  });
};

Item.findByCategory = async function(category) {
  return await this.findAll({
    where: { category }
  });
};

Item.getItemsByBox = async function(boxId) {
  return await this.findAll({
    where: { boxId },
    order: [['name', 'ASC']]
  });
};

module.exports = Item; 
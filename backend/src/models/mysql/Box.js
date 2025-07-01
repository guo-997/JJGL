const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Box = sequelize.define('Box', {
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
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nfcId: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
    field: 'nfc_id'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  currentItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    field: 'current_items'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url'
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
  tableName: 'boxes',
  timestamps: true,
  indexes: [
    {
      fields: ['nfc_id']
    },
    {
      fields: ['location']
    }
  ]
});

// 实例方法
Box.prototype.isFull = function() {
  return this.capacity > 0 && this.currentItems >= this.capacity;
};

Box.prototype.getUtilization = function() {
  if (this.capacity === 0) return 0;
  return Math.round((this.currentItems / this.capacity) * 100);
};

// 类方法
Box.findByNfcId = async function(nfcId) {
  return await this.findOne({ where: { nfcId } });
};

Box.searchByLocation = async function(location) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      location: {
        [Op.like]: `%${location}%`
      }
    }
  });
};

module.exports = Box; 
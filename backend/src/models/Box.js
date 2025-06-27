const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nfcId: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    room: String,
    position: String,
    coordinates: {
      x: Number,
      y: Number
    }
  },
  icon: {
    type: String,
    default: 'fa-cube'
  },
  color: {
    type: String,
    default: 'primary'
  },
  capacity: {
    total: {
      type: Number,
      default: 100
    },
    current: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  tags: [String],
  lastScanned: {
    type: Date,
    default: null
  },
  scanCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：容量百分比
boxSchema.virtual('capacityPercentage').get(function() {
  return Math.round((this.capacity.current / this.capacity.total) * 100);
});

// 虚拟字段：物品数量
boxSchema.virtual('itemCount', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'boxId',
  count: true
});

// 索引
boxSchema.index({ name: 'text', description: 'text' });
boxSchema.index({ nfcId: 1 });
boxSchema.index({ code: 1 });

// 生成唯一编码
boxSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `BOX${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Box', boxSchema); 
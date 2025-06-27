const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  boxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Box',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  unit: {
    type: String,
    default: '件'
  },
  photos: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    originalName: String,
    url: String,
    type: String, // pdf, doc, txt等
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  specifications: {
    brand: String,
    model: String,
    serialNumber: String,
    purchaseDate: Date,
    warrantyExpiry: Date,
    price: Number
  },
  status: {
    type: String,
    enum: ['sufficient', 'low', 'empty', 'expired'],
    default: 'sufficient'
  },
  lowStockThreshold: {
    type: Number,
    default: 1
  },
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：主要照片
itemSchema.virtual('mainPhoto').get(function() {
  return this.photos && this.photos.length > 0 ? this.photos[0] : null;
});

// 中间件：更新状态
itemSchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'empty';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.status = 'low';
  } else {
    this.status = 'sufficient';
  }
  next();
});

// 索引
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ boxId: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });

module.exports = mongoose.model('Item', itemSchema); 
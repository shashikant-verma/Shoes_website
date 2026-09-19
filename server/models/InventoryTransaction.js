const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN', 'ORDER', 'DAMAGE', 'CORRECTION'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    default: '',
    trim: true
  },
  referenceType: {
    type: String,
    enum: ['ORDER', 'RETURN', 'ADMIN', 'SYSTEM'],
    default: 'ADMIN'
  },
  referenceId: {
    type: String,
    default: ''
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

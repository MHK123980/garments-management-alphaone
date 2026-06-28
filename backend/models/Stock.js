const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  designNo: {
    type: String,
    required: true,
    unique: true
  },
  designName: {
    type: String,
    required: true
  },
  sizeSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SizeSet',
    required: true
  },
  perPiecePrice: {
    type: Number,
    required: true
  },
  pieces: {
    type: Number,
    default: 0
  },
  isGR: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);

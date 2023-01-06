const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentsModel = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Members', required: true },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comments', commentsModel);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberModel = new Schema({
  username: { type: String, required: true, maxLength: 20 },
  password: { type: String, required: true },
  member: Boolean,
});

const members = mongoose.model('Members', memberModel);
module.exports = members;

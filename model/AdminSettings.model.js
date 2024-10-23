const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  contestActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

module.exports = AdminSettings;

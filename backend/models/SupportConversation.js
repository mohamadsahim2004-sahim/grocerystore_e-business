const mongoose = require('mongoose');

// One support conversation per customer. Messages live in SupportMessage.
const supportConversationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
    lastSender: { type: String, enum: ['customer', 'admin'], default: 'customer' }
  },
  { timestamps: true }
);

supportConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
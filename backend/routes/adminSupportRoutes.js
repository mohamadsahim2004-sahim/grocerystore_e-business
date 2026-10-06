const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SupportConversation = require('../models/SupportConversation');
const SupportMessage = require('../models/SupportMessage');
const { HttpError, handle } = require('../utils/httpError');
const { checkRate, parseMessage, serializeMessage, addMessage, listMessages } = require('../utils/supportMessages');

// Mounted under /api/admin, so protect + authorize('admin') already ran.

const loadConversation = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Conversation not found');
  const conversation = await SupportConversation.findById(id).populate('customer', 'name email');
  if (!conversation) throw new HttpError(404, 'Conversation not found');
  return conversation;
};

// @desc    Inbox: conversations (most recently active first) with the number of unread customer messages
// @route   GET /api/admin/support/conversations?page=&limit=
// @access  Private/Admin
router.get(
  '/conversations',
  handle(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const [conversations, total] = await Promise.all([
      SupportConversation.find({})
        .populate('customer', 'name email')
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SupportConversation.countDocuments({})
    ]);

    const ids = conversations.map((c) => c._id);
    const unreadRows = ids.length
      ? await SupportMessage.aggregate([
          { $match: { conversation: { $in: ids }, sender: 'customer', readAt: null } },
          { $group: { _id: '$conversation', unread: { $sum: 1 } } }
        ])
      : [];
    const unreadBy = new Map(unreadRows.map((r) => [String(r._id), r.unread]));

    res.json({
      conversations: conversations.map((c) => ({
        _id: c._id,
        customer: c.customer ? { _id: c.customer._id, name: c.customer.name, email: c.customer.email } : null,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        lastSender: c.lastSender,
        unread: unreadBy.get(String(c._id)) || 0
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

// @desc    Number of unread customer messages (for the badge in the admin menu)
// @route   GET /api/admin/support/unread
// @access  Private/Admin
router.get(
  '/unread',
  handle(async (req, res) => {
    const unread = await SupportMessage.countDocuments({ sender: 'customer', readAt: null });
    res.json({ unread });
  })
);

// @desc    Messages of one conversation. `after=<messageId>` returns only newer ones; `markRead=1` marks the
//          customer's messages as read (sent while the conversation is open).
// @route   GET /api/admin/support/conversations/:id/messages
// @access  Private/Admin
router.get(
  '/conversations/:id/messages',
  handle(async (req, res) => {
    const conversation = await loadConversation(req.params.id);
    const messages = await listMessages(conversation._id, req.query.after);
    if (req.query.markRead === '1') {
      await SupportMessage.updateMany(
        { conversation: conversation._id, sender: 'customer', readAt: null },
        { $set: { readAt: new Date() } }
      );
    }
    res.json({
      customer: conversation.customer ? { _id: conversation.customer._id, name: conversation.customer.name, email: conversation.customer.email } : null,
      messages: messages.map(serializeMessage)
    });
  })
);

// @desc    Reply to a customer
// @route   POST /api/admin/support/conversations/:id/messages   body: { body, clientId }
// @access  Private/Admin
router.post(
  '/conversations/:id/messages',
  handle(async (req, res) => {
    const conversation = await loadConversation(req.params.id);
    const { body, clientId } = parseMessage(req.body);
    checkRate(req.user._id);
    const { message, duplicate } = await addMessage({
      conversationId: conversation._id,
      sender: 'admin',
      senderUser: req.user._id,
      body,
      clientId
    });
    res.status(duplicate ? 200 : 201).json({ message: serializeMessage(message), duplicate });
  })
);

module.exports = router;
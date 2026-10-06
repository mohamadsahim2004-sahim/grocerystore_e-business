const express = require('express');
const router = express.Router();
const SupportConversation = require('../models/SupportConversation');
const SupportMessage = require('../models/SupportMessage');
const { protect } = require('../middleware/authMiddleware');
const { handle } = require('../utils/httpError');
const { checkRate, parseMessage, serializeMessage, addMessage, listMessages } = require('../utils/supportMessages');

// Every route here works on the signed-in customer's OWN conversation. The conversation is always looked up by
// the id in the login token - a conversation id is never accepted from the client, so one customer can never
// read or write another customer's messages.
router.use(protect);

const myConversation = (userId) => SupportConversation.findOne({ customer: userId });

const myConversationOrCreate = async (userId) => {
  const found = await myConversation(userId);
  if (found) return found;
  try {
    return await SupportConversation.create({ customer: userId });
  } catch (err) {
    if (err.code === 11000) return myConversation(userId); // created by a simultaneous request
    throw err;
  }
};

// @desc    Messages of my conversation. `after=<messageId>` returns only newer ones; `markRead=1` marks the
//          replies I receive as read (sent while the chat window is open).
// @route   GET /api/support/messages
// @access  Private
router.get(
  '/messages',
  handle(async (req, res) => {
    const conversation = await myConversation(req.user._id);
    if (!conversation) return res.json({ messages: [] });
    const messages = await listMessages(conversation._id, req.query.after);
    if (req.query.markRead === '1') {
      await SupportMessage.updateMany(
        { conversation: conversation._id, sender: 'admin', readAt: null },
        { $set: { readAt: new Date() } }
      );
    }
    res.json({ messages: messages.map(serializeMessage) });
  })
);

// @desc    How many replies from the store I have not opened yet (for the badge on the chat button)
// @route   GET /api/support/unread
// @access  Private
router.get(
  '/unread',
  handle(async (req, res) => {
    const conversation = await myConversation(req.user._id);
    const unread = conversation
      ? await SupportMessage.countDocuments({ conversation: conversation._id, sender: 'admin', readAt: null })
      : 0;
    res.json({ unread });
  })
);

// @desc    Send a message to the store
// @route   POST /api/support/messages   body: { body, clientId }
// @access  Private
router.post(
  '/messages',
  handle(async (req, res) => {
    const { body, clientId } = parseMessage(req.body);
    checkRate(req.user._id);
    const conversation = await myConversationOrCreate(req.user._id);
    const { message, duplicate } = await addMessage({
      conversationId: conversation._id,
      sender: 'customer',
      senderUser: req.user._id,
      body,
      clientId
    });
    res.status(duplicate ? 200 : 201).json({ message: serializeMessage(message), duplicate });
  })
);

module.exports = router;
const mongoose = require('mongoose');
const SupportConversation = require('../models/SupportConversation');
const SupportMessage = require('../models/SupportMessage');
const { HttpError } = require('./httpError');

const MAX_MESSAGE_LENGTH = 1000;
const PAGE_SIZE = 100;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20; // messages per user per minute

// Small in-process limiter (enough to stop a runaway client; not a distributed limiter)
const sentAt = new Map();
function checkRate(userId) {
  const now = Date.now();
  const key = String(userId);
  const recent = (sentAt.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) throw new HttpError(429, 'You are sending messages too quickly. Please wait a moment.');
  recent.push(now);
  sentAt.set(key, recent);
  if (sentAt.size > 5000) {
    for (const [k, v] of sentAt) if (!v.some((t) => now - t < RATE_WINDOW_MS)) sentAt.delete(k);
  }
}

// -> { body, clientId } or throws 400
function parseMessage(input = {}) {
  const raw = typeof input.body === 'string' ? input.body.replace(/\r\n/g, '\n').trim() : '';
  if (!raw) throw new HttpError(400, 'Type a message first');
  if (raw.length > MAX_MESSAGE_LENGTH) throw new HttpError(400, `Messages can be at most ${MAX_MESSAGE_LENGTH} characters`);
  const clientId = input.clientId;
  if (typeof clientId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(clientId)) {
    throw new HttpError(400, 'Invalid message. Please reload the page and try again.');
  }
  return { body: raw, clientId };
}

const serializeMessage = (m) => ({
  _id: m._id,
  sender: m.sender,
  body: m.body,
  clientId: m.clientId,
  readAt: m.readAt,
  createdAt: m.createdAt
});

// Saves a message into a conversation (idempotent on clientId) and updates the conversation summary.
async function addMessage({ conversationId, sender, senderUser, body, clientId }) {
  const existing = await SupportMessage.findOne({ conversation: conversationId, clientId });
  if (existing) return { message: existing, duplicate: true };

  let message;
  try {
    message = await SupportMessage.create({ conversation: conversationId, sender, senderUser, body, clientId });
  } catch (err) {
    if (err.code === 11000) {
      const other = await SupportMessage.findOne({ conversation: conversationId, clientId });
      if (other) return { message: other, duplicate: true };
    }
    throw err;
  }
  await SupportConversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessageAt: message.createdAt, lastMessagePreview: body.slice(0, 120), lastSender: sender } }
  );
  return { message, duplicate: false };
}

// Messages of a conversation, oldest first. `after` (a message id) returns only newer messages.
async function listMessages(conversationId, after) {
  const filter = { conversation: conversationId };
  if (after !== undefined && after !== '') {
    if (!mongoose.isValidObjectId(after)) throw new HttpError(400, 'Invalid "after" value');
    filter._id = { $gt: after };
    const messages = await SupportMessage.find(filter).sort({ _id: 1 }).limit(PAGE_SIZE * 2);
    return messages;
  }
  const latest = await SupportMessage.find(filter).sort({ _id: -1 }).limit(PAGE_SIZE);
  return latest.reverse();
}

module.exports = { checkRate, parseMessage, serializeMessage, addMessage, listMessages, MAX_MESSAGE_LENGTH };
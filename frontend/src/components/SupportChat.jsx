import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';

const MAX_LENGTH = 1000;
const POLL_OPEN_MS = 5000; // while the chat window is open
const POLL_CLOSED_MS = 30000; // only the unread badge while it is closed

// Unique per send attempt. The server stores a message only once per id, so a retry never duplicates it.
const newClientId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

const formatTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

// Adds messages that are not on screen yet (matched by id), oldest first
const mergeById = (current, incoming) => {
  const known = new Set(current.map((m) => m._id));
  const fresh = incoming.filter((m) => !known.has(m._id));
  // ids grow with time, so sorting by id keeps the conversation in order
  return fresh.length ? [...current, ...fresh].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0)) : current;
};

// Floating "Chat with us" button + window. Messages are stored in MongoDB through /api/support and the page polls
// for new ones. Nothing here claims that an admin is online: replies appear when an admin answers.
export default function SupportChat() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState({ status: 'idle', error: '' });
  const [messages, setMessages] = useState([]);
  const [outbox, setOutbox] = useState([]); // [{ clientId, body, state: 'sending' | 'failed', error }]
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [pollError, setPollError] = useState(false);

  const lastIdRef = useRef('');
  const busyRef = useRef(false);
  const listRef = useRef(null);
  const stickRef = useRef(true); // keep the view at the newest message unless the customer scrolled up

  const userId = user?._id;
  const hidden = pathname.startsWith('/admin') || user?.role === 'admin';

  // A different account (or logging out) must never see the previous conversation
  useEffect(() => {
    setMessages([]);
    setOutbox([]);
    setText('');
    setUnread(0);
    setOpen(false);
    setLoad({ status: 'idle', error: '' });
    lastIdRef.current = '';
  }, [userId]);

  const fetchMessages = useCallback(async ({ initial = false } = {}) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const params = new URLSearchParams({ markRead: '1' });
      if (!initial && lastIdRef.current) params.set('after', lastIdRef.current);
      const { data } = await api.get(`/support/messages?${params.toString()}`);
      setPollError(false);
      if (initial) {
        setMessages(data.messages);
        setLoad({ status: 'ready', error: '' });
      } else if (data.messages.length) {
        setMessages((prev) => mergeById(prev, data.messages));
      }
      if (data.messages.length) lastIdRef.current = data.messages[data.messages.length - 1]._id;
      setUnread(0);
    } catch (err) {
      if (initial) setLoad({ status: 'error', error: getErrorMessage(err, 'Could not load your messages.') });
      else setPollError(true);
    } finally {
      busyRef.current = false;
    }
  }, []);

  // Open: load the conversation, then poll for replies
  useEffect(() => {
    if (!open || !isAuthenticated || hidden) return undefined;
    setLoad({ status: 'loading', error: '' });
    lastIdRef.current = '';
    fetchMessages({ initial: true });
    const timer = setInterval(() => {
      if (!document.hidden) fetchMessages();
    }, POLL_OPEN_MS);
    return () => clearInterval(timer);
  }, [open, isAuthenticated, hidden, fetchMessages, userId]);

  // Closed: only check how many replies are waiting
  useEffect(() => {
    if (open || !isAuthenticated || hidden) return undefined;
    let cancelled = false;
    const check = () => {
      if (document.hidden) return;
      api
        .get('/support/unread')
        .then(({ data }) => !cancelled && setUnread(data.unread))
        .catch(() => {});
    };
    check();
    const timer = setInterval(check, POLL_CLOSED_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, isAuthenticated, hidden, userId]);

  // Scroll to the newest message
  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, outbox, open, load.status]);

  const handleScroll = () => {
    const el = listRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const deliver = useCallback(async (entry) => {
    try {
      const { data } = await api.post('/support/messages', { body: entry.body, clientId: entry.clientId });
      setOutbox((prev) => prev.filter((m) => m.clientId !== entry.clientId));
      setMessages((prev) => mergeById(prev, [data.message]));
      // lastIdRef is NOT moved here: a reply that arrived just before this message must still be fetched by the next poll
    } catch (err) {
      setOutbox((prev) =>
        prev.map((m) => (m.clientId === entry.clientId ? { ...m, state: 'failed', error: getErrorMessage(err, 'Not sent.') } : m))
      );
    }
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || body.length > MAX_LENGTH) return;
    const entry = { clientId: newClientId(), body, state: 'sending', error: '' };
    stickRef.current = true;
    setOutbox((prev) => [...prev, entry]);
    setText('');
    deliver(entry);
  };

  const retrySend = (entry) => {
    setOutbox((prev) => prev.map((m) => (m.clientId === entry.clientId ? { ...m, state: 'sending', error: '' } : m)));
    deliver(entry);
  };

  const discard = (entry) => setOutbox((prev) => prev.filter((m) => m.clientId !== entry.clientId));

  if (authLoading || hidden) return null;

  return (
    <div className="support-chat">
      {open && (
        <section className="support-chat__window" role="dialog" aria-label="Chat with the store">
          <header className="support-chat__head">
            <div>
              <strong>Chat with us</strong>
              <small>Your messages are saved. We&apos;ll reply here when someone is available.</small>
            </div>
            <button type="button" className="support-chat__close" onClick={() => setOpen(false)} aria-label="Close chat">
              &times;
            </button>
          </header>

          {!isAuthenticated ? (
            <div className="support-chat__body support-chat__body--center">
              <p>Please log in to send a message to the store.</p>
              <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </div>
          ) : (
            <>
              <div className="support-chat__body" ref={listRef} onScroll={handleScroll} aria-live="polite">
                {load.status === 'loading' && <p className="support-chat__note">Loading your messages...</p>}
                {load.status === 'error' && (
                  <p className="support-chat__note support-chat__note--error" role="alert">
                    {load.error}{' '}
                    <button type="button" className="link-btn" onClick={() => { setLoad({ status: 'loading', error: '' }); fetchMessages({ initial: true }); }}>
                      Try again
                    </button>
                  </p>
                )}
                {load.status === 'ready' && messages.length === 0 && outbox.length === 0 && (
                  <p className="support-chat__note">Send us a message about your order or a product. Replies will show up here.</p>
                )}
                {messages.map((m) => (
                  <div key={m._id} className={`chat-msg chat-msg--${m.sender === 'customer' ? 'me' : 'them'}`}>
                    <p>{m.body}</p>
                    <time dateTime={m.createdAt}>{m.sender === 'admin' ? 'Store · ' : ''}{formatTime(m.createdAt)}</time>
                  </div>
                ))}
                {outbox.map((m) => (
                  <div key={m.clientId} className={`chat-msg chat-msg--me chat-msg--pending${m.state === 'failed' ? ' is-failed' : ''}`}>
                    <p>{m.body}</p>
                    {m.state === 'sending' ? (
                      <time>Sending...</time>
                    ) : (
                      <span className="chat-msg__failed">
                        Not sent. <button type="button" className="link-btn" onClick={() => retrySend(m)}>Retry</button>
                        {' · '}
                        <button type="button" className="link-btn" onClick={() => discard(m)}>Discard</button>
                      </span>
                    )}
                  </div>
                ))}
                {pollError && <p className="support-chat__note support-chat__note--error">Having trouble reaching the server. Retrying...</p>}
              </div>

              <form className="support-chat__form" onSubmit={handleSend}>
                <label htmlFor="support-text" className="sr-only">
                  Your message
                </label>
                <textarea
                  id="support-text"
                  rows={2}
                  maxLength={MAX_LENGTH}
                  value={text}
                  placeholder="Type your message"
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button type="button" className="support-chat__launcher" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Close chat' : 'Open chat'}>
        <span aria-hidden="true">{open ? '×' : '\u{1F4AC}'}</span>
        {!open && <span className="support-chat__launcher-text">Chat</span>}
        {!open && unread > 0 && (
          <span className="support-chat__badge" aria-label={`${unread} unread ${unread === 1 ? 'reply' : 'replies'}`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
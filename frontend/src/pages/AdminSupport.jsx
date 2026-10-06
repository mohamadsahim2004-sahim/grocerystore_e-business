import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { AlertIcon } from '../components/Icons';

const MAX_LENGTH = 1000;
const LIST_POLL_MS = 10000;
const THREAD_POLL_MS = 5000;

const newClientId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

const formatTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const mergeById = (current, incoming) => {
  const known = new Set(current.map((m) => m._id));
  const fresh = incoming.filter((m) => !known.has(m._id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0)) : current;
};

// ----- Inbox (left side) -----
function Inbox({ activeId }) {
  const [state, setState] = useState({ status: 'loading', conversations: [], error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = (first) => {
      if (!first && document.hidden) return;
      api
        .get('/admin/support/conversations?limit=50')
        .then(({ data }) => !cancelled && setState({ status: 'ready', conversations: data.conversations, error: '' }))
        .catch((err) => {
          if (cancelled) return;
          // keep what is on screen if a background refresh fails
          setState((prev) =>
            prev.status === 'ready' ? prev : { status: 'error', conversations: [], error: getErrorMessage(err, 'Could not load conversations.') }
          );
        });
    };
    load(true);
    const timer = setInterval(() => load(false), LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [attempt, activeId]);

  if (state.status === 'loading') return <LoadingSpinner label="Loading conversations..." />;
  if (state.status === 'error') {
    return <EmptyState icon={<AlertIcon size={28} />} title="Couldn't load the inbox" message={state.error} action={{ label: 'Try again', onClick: () => setAttempt((n) => n + 1) }} />;
  }
  if (state.conversations.length === 0) {
    return <p className="admin-empty-note">No customer messages yet. They will appear here when a customer writes to the store.</p>;
  }

  return (
    <ul className="support-inbox__list">
      {state.conversations.map((c) => (
        <li key={c._id}>
          <Link to={`/admin/support/${c._id}`} className={`support-inbox__item${c._id === activeId ? ' is-active' : ''}${c.unread ? ' is-unread' : ''}`}>
            <span className="support-inbox__top">
              <strong>{c.customer?.name || 'Deleted customer'}</strong>
              {c.unread > 0 && <span className="support-badge">{c.unread}</span>}
            </span>
            <span className="support-inbox__email">{c.customer?.email}</span>
            <span className="support-inbox__preview">
              {c.lastSender === 'admin' ? 'You: ' : ''}
              {c.lastMessagePreview}
            </span>
            <time dateTime={c.lastMessageAt}>{formatTime(c.lastMessageAt)}</time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ----- One conversation (right side) -----
function Thread({ id }) {
  const [load, setLoad] = useState({ status: 'loading', error: '' });
  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [text, setText] = useState('');
  const [pollError, setPollError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const lastIdRef = useRef('');
  const busyRef = useRef(false);
  const listRef = useRef(null);
  const stickRef = useRef(true);

  const fetchMessages = useCallback(
    async (initial) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const params = new URLSearchParams({ markRead: '1' });
        if (!initial && lastIdRef.current) params.set('after', lastIdRef.current);
        const { data } = await api.get(`/admin/support/conversations/${id}/messages?${params.toString()}`);
        setPollError(false);
        if (initial) {
          setCustomer(data.customer);
          setMessages(data.messages);
          setLoad({ status: 'ready', error: '' });
        } else if (data.messages.length) {
          setMessages((prev) => mergeById(prev, data.messages));
        }
        if (data.messages.length) lastIdRef.current = data.messages[data.messages.length - 1]._id;
      } catch (err) {
        if (initial) setLoad({ status: err.response?.status === 404 ? 'notfound' : 'error', error: getErrorMessage(err, 'Could not load this conversation.') });
        else setPollError(true);
      } finally {
        busyRef.current = false;
      }
    },
    [id]
  );

  useEffect(() => {
    setLoad({ status: 'loading', error: '' });
    setMessages([]);
    setOutbox([]);
    setText('');
    setCustomer(null);
    lastIdRef.current = '';
    stickRef.current = true;
    fetchMessages(true);
    const timer = setInterval(() => {
      if (!document.hidden) fetchMessages(false);
    }, THREAD_POLL_MS);
    return () => clearInterval(timer);
  }, [id, attempt, fetchMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, outbox, load.status]);

  const deliver = useCallback(
    async (entry) => {
      try {
        const { data } = await api.post(`/admin/support/conversations/${id}/messages`, { body: entry.body, clientId: entry.clientId });
        setOutbox((prev) => prev.filter((m) => m.clientId !== entry.clientId));
        setMessages((prev) => mergeById(prev, [data.message]));
      } catch (err) {
        setOutbox((prev) =>
          prev.map((m) => (m.clientId === entry.clientId ? { ...m, state: 'failed', error: getErrorMessage(err, 'Not sent.') } : m))
        );
      }
    },
    [id]
  );

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

  if (load.status === 'loading') return <LoadingSpinner label="Loading conversation..." />;
  if (load.status === 'notfound') return <EmptyState title="Conversation not found" message="It may have been removed." action={{ label: 'Back to inbox', to: '/admin/support' }} />;
  if (load.status === 'error') {
    return <EmptyState icon={<AlertIcon size={28} />} title="We couldn't load this conversation" message={load.error} action={{ label: 'Try again', onClick: () => setAttempt((n) => n + 1) }} />;
  }

  return (
    <div className="support-thread">
      <header className="support-thread__head">
        <Link to="/admin/support" className="support-thread__back">
          &larr; Inbox
        </Link>
        <div>
          <strong>{customer?.name || 'Deleted customer'}</strong>
          <small>{customer?.email}</small>
        </div>
      </header>

      <div
        className="support-thread__body"
        ref={listRef}
        onScroll={() => {
          const el = listRef.current;
          if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {messages.map((m) => (
          <div key={m._id} className={`chat-msg chat-msg--${m.sender === 'admin' ? 'me' : 'them'}`}>
            <p>{m.body}</p>
            <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
          </div>
        ))}
        {outbox.map((m) => (
          <div key={m.clientId} className={`chat-msg chat-msg--me chat-msg--pending${m.state === 'failed' ? ' is-failed' : ''}`}>
            <p>{m.body}</p>
            {m.state === 'sending' ? (
              <time>Sending...</time>
            ) : (
              <span className="chat-msg__failed">
                {m.error} <button type="button" className="link-btn" onClick={() => retrySend(m)}>Retry</button>
                {' · '}
                <button type="button" className="link-btn" onClick={() => setOutbox((prev) => prev.filter((x) => x.clientId !== m.clientId))}>
                  Discard
                </button>
              </span>
            )}
          </div>
        ))}
        {pollError && <p className="support-chat__note support-chat__note--error">Having trouble reaching the server. Retrying...</p>}
      </div>

      <form className="support-chat__form" onSubmit={handleSend}>
        <label htmlFor="support-reply" className="sr-only">
          Reply
        </label>
        <textarea
          id="support-reply"
          rows={2}
          maxLength={MAX_LENGTH}
          value={text}
          placeholder="Write a reply"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
          }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default function AdminSupport() {
  const { id } = useParams();
  const navigate = useNavigate();

  // a mistyped link (not an id) goes back to the inbox
  useEffect(() => {
    if (id && !/^[a-f0-9]{24}$/i.test(id)) navigate('/admin/support', { replace: true });
  }, [id, navigate]);

  return (
    <div className="admin-page">
      <h1 className="page-title">Support Chat</h1>
      <div className={`support-admin${id ? ' has-thread' : ''}`}>
        <aside className="support-inbox" aria-label="Conversations">
          <Inbox activeId={id} />
        </aside>
        <section className="support-pane" aria-label="Conversation">
          {id && /^[a-f0-9]{24}$/i.test(id) ? <Thread id={id} /> : <p className="admin-empty-note support-pane__empty">Select a conversation to read and reply.</p>}
        </section>
      </div>
    </div>
  );
}
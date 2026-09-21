import React from 'react';
import { Link } from 'react-router-dom';
import { BagIcon } from './Icons';

// action: { label, to } renders a link button, { label, onClick } renders a button
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon || <BagIcon size={32} />}</div>
      <h2 className="empty-state__title">{title}</h2>
      {message && <p className="empty-state__message">{message}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn btn-primary" onClick={action.onClick}>
            {action.label}
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
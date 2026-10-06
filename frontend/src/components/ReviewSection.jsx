import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from './LoadingSpinner';
import { StarIcon } from './Icons';

const PAGE_SIZE = 10;
const MAX_COMMENT = 1000;

const Stars = ({ value, size = 16 }) => (
  <span className="stars" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} size={size} className={n <= Math.round(value || 0) ? 'star-on' : 'star-off'} />
    ))}
  </span>
);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { dateStyle: 'medium' });
};

function ReviewCard({ review, mine, onEdit, onDelete, busy }) {
  return (
    <li className={`review-item${mine ? ' review-item--mine' : ''}`}>
      <div className="review-item__head">
        <strong>{mine ? 'Your review' : review.user?.name || 'Customer'}</strong>
        <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
      </div>
      <div className="review-item__rating">
        <Stars value={review.rating} />
        <span className="sr-only">{review.rating} out of 5 stars</span>
      </div>
      {review.comment && <p className="review-item__text">{review.comment}</p>}
      {mine && (
        <div className="review-item__actions">
          <button type="button" className="link-btn" onClick={onEdit} disabled={busy}>Edit</button>
          <button type="button" className="link-btn" onClick={onDelete} disabled={busy}>Delete</button>
        </div>
      )}
    </li>
  );
}

// Reviews tab: public list + (only when the BACKEND says so) the review form.
// onSummaryChange({ rating, reviewCount }) lets the page header refresh after a change.
export default function ReviewSection({ productId, onSummaryChange }) {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const base = `/products/${productId}/reviews`;

  const [list, setList] = useState({ status: 'loading', reviews: [], total: 0, average: 0, page: 1, pages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [mine, setMine] = useState({ status: 'idle', review: null, canReview: false });
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPage = useCallback(
    async (page) => (await api.get(base, { params: { page, limit: PAGE_SIZE } })).data,
    [base]
  );

  const toList = (data, previous = []) => ({
    status: 'ready',
    reviews: [...previous, ...data.reviews],
    total: data.total,
    average: data.averageRating,
    page: data.page,
    pages: data.pages
  });

  const refreshList = useCallback(async () => {
    try {
      setList(toList(await fetchPage(1)));
    } catch {
      setList((prev) => (prev.status === 'ready' ? prev : { ...prev, status: 'error' }));
    }
  }, [fetchPage]);

  const loadMine = useCallback(async () => {
    try {
      const { data } = await api.get(`${base}/mine`);
      setMine({ status: 'ready', review: data.review, canReview: Boolean(data.canReview) });
    } catch {
      setMine({ status: 'error', review: null, canReview: false }); // no form if the backend can't confirm
    }
  }, [base]);

  // Public reviews load for everyone, logged in or not
  useEffect(() => {
    setList({ status: 'loading', reviews: [], total: 0, average: 0, page: 1, pages: 1 });
    setEditing(false);
    setFormError('');
    refreshList();
  }, [refreshList]);

  // The backend decides whether this customer may review, and returns their own review if any
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setMine({ status: 'idle', review: null, canReview: false });
      return;
    }
    setMine({ status: 'loading', review: null, canReview: false });
    loadMine();
  }, [authLoading, isAuthenticated, user?._id, loadMine]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(list.page + 1);
      setList((prev) => toList(data, prev.reviews));
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not load more reviews.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const startEdit = () => {
    setRating(mine.review.rating);
    setComment(mine.review.comment || '');
    setFormError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!rating) {
      setFormError('Please choose a star rating from 1 to 5.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = { rating, comment: comment.trim() };
      const { data } = editing ? await api.put(`${base}/mine`, body) : await api.post(base, body);
      setMine({ status: 'ready', review: data.review, canReview: false });
      setEditing(false);
      setRating(0);
      setComment('');
      onSummaryChange?.(data.product);
      await refreshList();
    } catch (err) {
      setFormError(getErrorMessage(err));
      // e.g. "already reviewed" / "not delivered": re-ask the backend so the UI matches reality
      if ([403, 409].includes(err.response?.status)) loadMine();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete your review?')) return;
    setSaving(true);
    setFormError('');
    try {
      const { data } = await api.delete(`${base}/mine`);
      onSummaryChange?.(data.product);
      await Promise.all([loadMine(), refreshList()]);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const showForm = mine.status === 'ready' && (editing || (mine.canReview && !mine.review));
  const others = list.reviews.filter((r) => r._id !== mine.review?._id);
  const shown = hover || rating;

  return (
    <div className="reviews">
      <div className="reviews-summary">
        <div className="reviews-summary__score">
          <strong>{list.total > 0 ? Number(list.average).toFixed(1) : '–'}</strong>
          <Stars value={list.average} size={18} />
          <span>
            {list.total} {list.total === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <p className="reviews-summary__note">
          {list.total > 0 ? 'Average rating from customers who received this product.' : 'This product has no reviews yet.'}
        </p>
      </div>

      {formError && <div className="notice notice--error" role="alert">{formError}</div>}

      {/* Review form: rendered only when the backend confirmed eligibility (or the customer is editing their own review) */}
      {showForm && (
        <form className="review-form" onSubmit={submit} noValidate>
          <h3>{editing ? 'Edit your review' : 'Write a Review'}</h3>
          <div className="form-group">
            <label id="review-rating-label">Your rating</label>
            <div className="star-input" role="radiogroup" aria-labelledby="review-rating-label" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                  className="star-btn"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                >
                  <StarIcon size={28} className={n <= shown ? 'star-on' : 'star-off'} />
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="review-comment">Your review (optional)</label>
            <textarea
              id="review-comment"
              className="form-control"
              rows={4}
              maxLength={MAX_COMMENT}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this product?"
            />
            <small className="review-form__count">{comment.length}/{MAX_COMMENT}</small>
          </div>
          <div className="review-form__actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Submit review'}
            </button>
            {editing && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit} disabled={saving}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {/* Customer's existing review: shown instead of a second form */}
      {mine.status === 'ready' && mine.review && !editing && (
        <ul className="review-list review-list--mine">
          <ReviewCard review={mine.review} mine onEdit={startEdit} onDelete={remove} busy={saving} />
        </ul>
      )}

      {mine.status === 'loading' && <LoadingSpinner size="sm" label="Checking your review status..." />}
      {!authLoading && !isAuthenticated && (
        <p className="review-hint">
          <Link to="/login">Log in</Link> to review products you have received.
        </p>
      )}
      {mine.status === 'ready' && !mine.review && !mine.canReview && (
        <p className="review-hint">Only customers who have received this product can write a review.</p>
      )}

      {list.status === 'loading' && <LoadingSpinner size="sm" label="Loading reviews..." />}
      {list.status === 'error' && (
        <div className="notice notice--error" role="alert">
          Could not load reviews. <button type="button" className="link-btn" onClick={refreshList}>Try again</button>
        </div>
      )}
      {list.status === 'ready' && others.length > 0 && (
        <ul className="review-list">
          {others.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </ul>
      )}
      {list.status === 'ready' && list.page < list.pages && (
        <button type="button" className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Show more reviews'}
        </button>
      )}
    </div>
  );
}
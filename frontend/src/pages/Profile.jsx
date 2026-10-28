import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { prepareAvatar, AVATAR_ACCEPT } from '../lib/avatarImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { PinIcon } from '../components/Icons';

// Same limits as PUT /api/profile (backend/utils/profileValidation.js)
const LIMITS = { nameMin: 2, nameMax: 100, emailMax: 254, phoneMax: 20, phoneMinDigits: 7 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]+$/;
const FIELD_ORDER = ['name', 'email', 'phone'];

const tidy = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

// Normalised copy of the editable fields: what gets compared, validated and sent
const normalize = ({ name, email, phone }) => ({
  name: tidy(name),
  email: tidy(email).toLowerCase(),
  phone: tidy(phone)
});

const toForm = (source) => ({
  name: source?.name || '',
  email: source?.email || '',
  phone: source?.phone || ''
});

const formatMemberSince = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

function validate(values) {
  const { name, email, phone } = normalize(values);
  const errors = {};

  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    errors.name = `Name must be between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`;
  }
  if (!email || email.length > LIMITS.emailMax || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (
    phone &&
    (!PHONE_PATTERN.test(phone) || phone.length > LIMITS.phoneMax || phone.replace(/\D/g, '').length < LIMITS.phoneMinDigits)
  ) {
    errors.phone = 'Enter a valid phone number, for example +94 77 123 4567';
  }
  return errors;
}

function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="field-required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default function Profile() {
  const auth = useContext(AuthContext);
  const { user, fetchProfile, updateProfile, updateAvatar, removeAvatar } = auth || {};

  // `saved` is the last version known to be stored in the database; Cancel always returns to it
  const [saved, setSaved] = useState(() => toForm(user));
  const [formData, setFormData] = useState(() => toForm(user));
  const [memberSince, setMemberSince] = useState(user?.createdAt || '');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const editingRef = useRef(false);
  const editButtonRef = useRef(null);
  const nameInputRef = useRef(null);
  const focusEditButton = useRef(false);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoProgress, setPhotoProgress] = useState(null);
  const fileInputRef = useRef(null);
  // Falls back to the initial-letter avatar when the saved photo cannot be loaded
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

  // Load the profile from the server (and again when the user presses "Try again")
  useEffect(() => {
    let cancelled = false;

    if (typeof fetchProfile !== 'function') {
      setFetching(false);
      setLoadError('The profile service is unavailable right now.');
      return undefined;
    }

    setFetching(true);
    setLoadError('');

    fetchProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        const values = toForm(profile);
        setSaved(values);
        // Never overwrite what the user is typing if they already started editing
        setFormData((current) => (editingRef.current ? current : values));
        setMemberSince(profile.createdAt || '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'We could not load your profile.');
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchProfile, attempt]);

  // Move focus sensibly when switching between view and edit mode
  useEffect(() => {
    editingRef.current = editing;
    if (editing) nameInputRef.current?.focus();
    else if (focusEditButton.current) {
      focusEditButton.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  const isDirty = (() => {
    const a = normalize(formData);
    const b = normalize(saved);
    return a.name !== b.name || a.email !== b.email || a.phone !== b.phone;
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (status.type === 'error' || status.type === 'success') setStatus({ type: '', text: '' });
  };

  const handleEdit = () => {
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    setFormData(saved);
    setEditing(true);
  };

  // Discards unsaved edits and restores the previously saved values
  const handleCancel = () => {
    if (savingRef.current) return;
    setFormData(saved);
    setStatus({ type: '', text: '' });
    setFieldErrors({});
    focusEditButton.current = true;
    setEditing(false);
  };

  const focusFirstError = (errors) => {
    const first = FIELD_ORDER.find((key) => errors[key]);
    if (first) document.getElementById(`pf-${first}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // savingRef blocks a second submit fired before React re-renders (double click / Enter twice)
    if (!editing || savingRef.current || !isDirty) return;

    setStatus({ type: '', text: '' });

    const errors = validate(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }

    if (typeof updateProfile !== 'function') {
      setStatus({ type: 'error', text: 'The profile update service is unavailable right now.' });
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const updated = await updateProfile(normalize(formData));
      const values = toForm(updated);
      setSaved(values);
      setFormData(values);
      setMemberSince(updated?.createdAt || memberSince);
      setStatus({ type: 'success', text: 'Your profile was updated.' });
      focusEditButton.current = true;
      setEditing(false);
    } catch (err) {
      // Keep everything the user typed so they can fix it and try again
      const serverErrors = err?.fieldErrors && typeof err.fieldErrors === 'object' ? err.fieldErrors : null;
      if (serverErrors && Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        focusFirstError(serverErrors);
      } else {
        setStatus({ type: 'error', text: err?.message || 'We could not update your profile. Please try again.' });
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ---- Profile photo (unchanged behaviour) ------------------------------------
  const handlePhotoChosen = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || photoBusy) return;

    if (typeof updateAvatar !== 'function') {
      setStatus({ type: 'error', text: 'Profile photo service is unavailable.' });
      return;
    }

    setStatus({ type: '', text: '' });
    setPhotoBusy(true);
    setPhotoProgress('preparing');

    try {
      const prepared = await prepareAvatar(file);
      // Show the chosen photo as a preview; nothing is saved until the user confirms.
      setPhotoPreview(prepared);
    } catch (err) {
      setPhotoPreview('');
      setStatus({ type: 'error', text: err?.message || 'Could not read that photo.' });
    } finally {
      setPhotoProgress(null);
      setPhotoBusy(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!photoPreview || photoBusy) return;

    setStatus({ type: '', text: '' });
    setPhotoBusy(true);
    setPhotoProgress(0);

    try {
      await updateAvatar(photoPreview);
      setPhotoProgress(100);
      setPhotoPreview('');
      setStatus({ type: 'success', text: 'Profile photo updated!' });
    } catch (err) {
      // Keep the preview so the user can retry
      setStatus({ type: 'error', text: err?.message || 'Could not update profile photo.' });
    } finally {
      setPhotoProgress(null);
      setPhotoBusy(false);
    }
  };

  const handleCancelPhoto = () => {
    if (photoBusy) return;
    setPhotoPreview('');
  };

  const handleRemovePhoto = async () => {
    if (photoBusy) return;

    if (typeof removeAvatar !== 'function') {
      setStatus({ type: 'error', text: 'Profile photo service is unavailable.' });
      return;
    }

    setStatus({ type: '', text: '' });
    setPhotoBusy(true);

    try {
      await removeAvatar();
      setStatus({ type: 'success', text: 'Profile photo removed.' });
    } catch (err) {
      setStatus({ type: 'error', text: err?.message || 'Could not remove profile photo.' });
    } finally {
      setPhotoBusy(false);
    }
  };

  const retryLoad = useCallback(() => setAttempt((n) => n + 1), []);

  // ---- Derived display values -------------------------------------------------
  const displayName = saved.name || user?.name || 'U';
  const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
  const addressLines = defaultAddress
    ? [defaultAddress.street, [defaultAddress.city, defaultAddress.postalCode].filter(Boolean).join(' '), defaultAddress.country].filter(Boolean)
    : [];

  const showForm = !fetching && !loadError;

  return (
    <div className="profile-page">
      {/* ---------- Header: photo, name, member since ---------- */}
      <section className="account-panel profile-card" aria-labelledby="profile-title">
        <div className="account-panel__head">
          <span className={`account-avatar account-avatar--lg${photoBusy ? ' is-uploading' : ''}`} aria-hidden="true">
            {photoPreview || (user?.avatar && !avatarBroken) ? (
              <img src={photoPreview || user.avatar} alt="" onError={() => setAvatarBroken(true)} />
            ) : (
              displayName.trim().charAt(0).toUpperCase()
            )}

            {photoBusy && photoProgress !== null && (
              <span className="account-avatar__overlay" data-testid="photo-progress">
                {typeof photoProgress === 'number' ? `${photoProgress}%` : '…'}
              </span>
            )}
          </span>

          <div>
            <h1 id="profile-title" className="page-title">
              {fetching && !saved.name ? 'My Profile' : displayName}
            </h1>
            {!fetching && saved.email && <p className="account-panel__email">{saved.email}</p>}
            {!fetching && formatMemberSince(memberSince) && (
              <p className="account-panel__email">Member since {formatMemberSince(memberSince)}</p>
            )}
          </div>
        </div>

        <div className="profile-photo">
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            hidden
            onChange={handlePhotoChosen}
            data-testid="photo-input"
          />

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={fetching || photoBusy}
          >
            {photoBusy
              ? photoProgress === 'preparing'
                ? 'Preparing photo...'
                : 'Uploading photo...'
              : photoPreview
                ? 'Choose another'
                : user?.avatar
                  ? 'Change photo'
                  : 'Add photo'}
          </button>

          {photoPreview && !photoBusy && (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSavePhoto}>
                Save photo
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCancelPhoto}>
                Cancel
              </button>
            </>
          )}

          {user?.avatar && !photoPreview && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleRemovePhoto} disabled={photoBusy}>
              Remove photo
            </button>
          )}

          {photoBusy && (
            <span
              className="profile-photo__progress"
              role="progressbar"
              aria-label="Photo upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={typeof photoProgress === 'number' ? photoProgress : undefined}
            >
              <span style={{ width: `${typeof photoProgress === 'number' ? photoProgress : 5}%` }} />
            </span>
          )}

          <span className="profile-photo__hint">
            {photoPreview
              ? 'Previewing your new photo. Press Save photo to keep it.'
              : 'JPEG, PNG or WebP. Your photo is resized automatically and saved to your account.'}
          </span>
        </div>
      </section>

      {status.text && (
        <p className={status.type === 'success' ? 'success-msg profile-alert' : 'error-msg profile-alert'} role={status.type === 'success' ? 'status' : 'alert'}>
          {status.text}
        </p>
      )}

      {/* ---------- Personal information ---------- */}
      <section className="account-panel profile-card" aria-labelledby="profile-info-title">
        <div className="profile-section__head">
          <div>
            <h2 id="profile-info-title" className="profile-section__title">
              Personal information
            </h2>
            <p className="profile-section__lead">
              {editing ? 'Update your details, then press Save changes.' : 'The details we use for your account and orders.'}
            </p>
          </div>

          {showForm && !editing && (
            <button ref={editButtonRef} type="button" className="btn btn-primary" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {fetching && <LoadingSpinner label="Loading your profile..." />}

        {!fetching && loadError && (
          <div className="profile-load-error" role="alert">
            <p>We couldn't load your profile. {loadError}</p>
            <button type="button" className="btn btn-outline" onClick={retryLoad}>
              Try again
            </button>
          </div>
        )}

        {showForm && !editing && (
          <dl className="profile-details">
            <div>
              <dt>Full name</dt>
              <dd>{saved.name || '–'}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{saved.email || '–'}</dd>
            </div>
            <div>
              <dt>Phone number</dt>
              <dd>{saved.phone || 'Not added yet'}</dd>
            </div>
          </dl>
        )}

        {showForm && editing && (
          <form onSubmit={handleSubmit} className="profile-form" noValidate aria-busy={saving}>
            <Field id="pf-name" label="Full name" required error={fieldErrors.name}>
              <input
                ref={nameInputRef}
                id="pf-name"
                className={`form-control${fieldErrors.name ? ' has-error' : ''}`}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
                required
                maxLength={LIMITS.nameMax}
                autoComplete="name"
                aria-invalid={fieldErrors.name ? 'true' : undefined}
                aria-describedby={fieldErrors.name ? 'pf-name-err' : undefined}
              />
            </Field>

            <Field id="pf-email" label="Email address" required error={fieldErrors.email} hint="We send order updates to this address.">
              <input
                id="pf-email"
                className={`form-control${fieldErrors.email ? ' has-error' : ''}`}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={saving}
                required
                maxLength={LIMITS.emailMax}
                autoComplete="email"
                aria-invalid={fieldErrors.email ? 'true' : undefined}
                aria-describedby={fieldErrors.email ? 'pf-email-err' : 'pf-email-hint'}
              />
            </Field>

            <Field id="pf-phone" label="Phone number" error={fieldErrors.phone} hint="Optional. Used by our delivery team.">
              <input
                id="pf-phone"
                className={`form-control${fieldErrors.phone ? ' has-error' : ''}`}
                type="tel"
                inputMode="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={saving}
                maxLength={LIMITS.phoneMax}
                autoComplete="tel"
                placeholder="+94 77 123 4567"
                aria-invalid={fieldErrors.phone ? 'true' : undefined}
                aria-describedby={fieldErrors.phone ? 'pf-phone-err' : 'pf-phone-hint'}
              />
            </Field>

            <div className="profile-form__actions">
              <button type="submit" className="btn btn-primary" disabled={saving || !isDirty}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              {!isDirty && !saving && <span className="field-hint">No changes to save yet.</span>}
            </div>
          </form>
        )}
      </section>

      {/* ---------- Delivery address (managed on the Addresses page) ---------- */}
      <section className="account-panel profile-card" aria-labelledby="profile-address-title">
        <div className="profile-section__head">
          <div>
            <h2 id="profile-address-title" className="profile-section__title">
              Delivery address
            </h2>
            <p className="profile-section__lead">Your default address for deliveries.</p>
          </div>
          <Link to="/addresses" className="btn btn-outline">
            {defaultAddress ? 'Manage addresses' : 'Add an address'}
          </Link>
        </div>

        {defaultAddress ? (
          <div className="profile-address">
            <span className="profile-address__icon" aria-hidden="true">
              <PinIcon size={20} />
            </span>
            <address>
              {defaultAddress.label && <strong>{defaultAddress.label}</strong>}
              {addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </div>
        ) : (
          <p className="profile-section__lead">You haven't saved a delivery address yet.</p>
        )}
      </section>
    </div>
  );
}

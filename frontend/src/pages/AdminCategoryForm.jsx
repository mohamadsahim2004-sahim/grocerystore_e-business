import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const EMPTY = { name: '', slug: '', description: '', image: '', isActive: true };

export default function AdminCategoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    api
      .get(`/admin/categories/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setForm({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            image: data.image || '',
            isActive: data.isActive !== false
          });
        }
      })
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, 'Could not load this category.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (isEdit) await api.put(`/admin/categories/${id}`, form);
      else await api.post('/admin/categories', form);
      navigate('/admin/categories');
    } catch (err) {
      setFieldErrors(err.response?.data?.errors || {});
      setFormError(getErrorMessage(err, 'Could not save this category.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="Loading category..." />;

  return (
    <div className="admin-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/categories">Categories</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{isEdit ? 'Edit Category' : 'New Category'}</span>
      </nav>
      <h1 className="page-title">{isEdit ? 'Edit Category' : 'New Category'}</h1>

      {loadError && (
        <p className="error-msg" role="alert">
          {loadError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="panel admin-form admin-form--narrow">
        <div className="form-group">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" className={`form-control${fieldErrors.name ? ' has-error' : ''}`} value={form.name} onChange={handleChange} required />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="c-slug">Slug (optional)</label>
          <input id="c-slug" name="slug" className="form-control" value={form.slug} onChange={handleChange} placeholder="auto-generated from name" />
        </div>

        <div className="form-group">
          <label htmlFor="c-image">Image URL (optional)</label>
          <input id="c-image" name="image" className="form-control" value={form.image} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="c-description">Description (optional)</label>
          <textarea id="c-description" name="description" className="form-control" value={form.description} onChange={handleChange} rows={3} />
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              <span>Active (visible in shop)</span>
            </label>
          </div>
        )}

        {formError && (
          <p className="error-msg" role="alert">
            {formError}
          </p>
        )}

        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
          <Link to="/admin/categories" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
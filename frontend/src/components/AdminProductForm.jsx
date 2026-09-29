import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const EMPTY = {
  name: '',
  slug: '',
  category: '',
  price: '',
  oldPrice: '',
  stock: '',
  unit: '',
  brand: '',
  origin: '',
  image: '',
  description: '',
  shortDescription: '',
  isFeatured: false,
  isActive: true
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/categories')
      .then(({ data }) => !cancelled && setCategories(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/admin/products/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          category: data.category?._id || data.category || '',
          price: data.price ?? '',
          oldPrice: data.oldPrice ?? '',
          stock: data.stock ?? '',
          unit: data.unit || '',
          brand: data.brand || '',
          origin: data.origin || '',
          image: data.image || '',
          description: data.description || '',
          shortDescription: data.shortDescription || '',
          isFeatured: Boolean(data.isFeatured),
          isActive: data.isActive !== false
        });
      })
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, 'Could not load this product.')))
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
    const payload = {
      ...form,
      price: form.price === '' ? undefined : Number(form.price),
      oldPrice: form.oldPrice === '' ? '' : Number(form.oldPrice),
      stock: form.stock === '' ? undefined : Number(form.stock)
    };
    try {
      if (isEdit) await api.put(`/admin/products/${id}`, payload);
      else await api.post('/admin/products', payload);
      navigate('/admin/products');
    } catch (err) {
      setFieldErrors(err.response?.data?.errors || {});
      setFormError(getErrorMessage(err, 'Could not save this product.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="Loading product..." />;

  return (
    <div className="admin-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/products">Products</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{isEdit ? 'Edit Product' : 'New Product'}</span>
      </nav>
      <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      {loadError && (
        <p className="error-msg" role="alert">
          {loadError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="panel admin-form">
        <div className="form-grid">
          <div className="form-group form-group--wide">
            <label htmlFor="p-name">Name</label>
            <input id="p-name" name="name" className={`form-control${fieldErrors.name ? ' has-error' : ''}`} value={form.name} onChange={handleChange} required />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="p-slug">Slug (optional)</label>
            <input id="p-slug" name="slug" className="form-control" value={form.slug} onChange={handleChange} placeholder="auto-generated from name" />
          </div>

          <div className="form-group">
            <label htmlFor="p-category">Category</label>
            <select id="p-category" name="category" className={`form-control${fieldErrors.category ? ' has-error' : ''}`} value={form.category} onChange={handleChange} required>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="p-price">Price ($)</label>
            <input id="p-price" name="price" type="number" min="0" step="0.01" className={`form-control${fieldErrors.price ? ' has-error' : ''}`} value={form.price} onChange={handleChange} required />
            {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="p-oldPrice">Old Price ($, optional)</label>
            <input id="p-oldPrice" name="oldPrice" type="number" min="0" step="0.01" className={`form-control${fieldErrors.oldPrice ? ' has-error' : ''}`} value={form.oldPrice} onChange={handleChange} />
            {fieldErrors.oldPrice && <span className="field-error">{fieldErrors.oldPrice}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="p-stock">Stock</label>
            <input id="p-stock" name="stock" type="number" min="0" step="1" className={`form-control${fieldErrors.stock ? ' has-error' : ''}`} value={form.stock} onChange={handleChange} required />
            {fieldErrors.stock && <span className="field-error">{fieldErrors.stock}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="p-unit">Unit (e.g. 1 kg)</label>
            <input id="p-unit" name="unit" className="form-control" value={form.unit} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="p-brand">Brand</label>
            <input id="p-brand" name="brand" className="form-control" value={form.brand} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="p-origin">Origin</label>
            <input id="p-origin" name="origin" className="form-control" value={form.origin} onChange={handleChange} />
          </div>

          <div className="form-group form-group--wide">
            <label htmlFor="p-image">Image URL</label>
            <input id="p-image" name="image" className={`form-control${fieldErrors.image ? ' has-error' : ''}`} value={form.image} onChange={handleChange} placeholder="/images/products/example.svg" required />
            {fieldErrors.image && <span className="field-error">{fieldErrors.image}</span>}
          </div>

          <div className="form-group form-group--wide">
            <label htmlFor="p-shortDescription">Short Description</label>
            <input id="p-shortDescription" name="shortDescription" className="form-control" value={form.shortDescription} onChange={handleChange} />
          </div>

          <div className="form-group form-group--wide">
            <label htmlFor="p-description">Description</label>
            <textarea id="p-description" name="description" className={`form-control${fieldErrors.description ? ' has-error' : ''}`} value={form.description} onChange={handleChange} rows={4} required />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
              <span>Featured on homepage</span>
            </label>
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                <span>Active (visible in shop)</span>
              </label>
            </div>
          )}
        </div>

        {formError && (
          <p className="error-msg" role="alert">
            {formError}
          </p>
        )}

        <div className="admin-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
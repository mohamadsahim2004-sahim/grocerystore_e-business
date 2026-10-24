import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { ImageIcon } from '../components/Icons';

// Products keep their pictures as plain URL strings: `image` is the main one, `images` the extra gallery pictures.
// The form edits them as one ordered list (first = main image), up to MAX_IMAGES in total.
const MAX_IMAGES = 3;
const IMAGE_URL_PATTERN = /^(https?:\/\/\S+|\/(?!\/).+)$/i;
const cleanImages = (urls) => [...new Set(urls.map((u) => u.trim()).filter(Boolean))];

function ImageSlot({ index, value, error, onChange, onRemove, canRemove }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [value]);
  const url = value.trim();
  const label = index === 0 ? 'Main image URL' : `Extra image ${index} URL`;
  return (
    <div className="image-field__row">
      <span className="image-field__preview" aria-hidden="true">
        {url && !broken ? <img src={url} alt="" onError={() => setBroken(true)} /> : <ImageIcon size={22} />}
      </span>
      <div className="image-field__input">
        <label htmlFor={`p-image-${index}`}>
          {label}
          {index === 0 && ' (required)'}
        </label>
        <input
          id={`p-image-${index}`}
          className={`form-control${error ? ' has-error' : ''}`}
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder="/images/products/example.webp or https://..."
        />
        {error && <span className="field-error">{error}</span>}
        {!error && broken && <span className="field-error">This image could not be loaded. Check the URL.</span>}
      </div>
      {canRemove && (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onRemove(index)} aria-label={`Remove ${label}`}>
          Remove
        </button>
      )}
    </div>
  );
}

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
  const [imageUrls, setImageUrls] = useState(['']);
  const [imageErrors, setImageErrors] = useState({});
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
          description: data.description || '',
          shortDescription: data.shortDescription || '',
          isFeatured: Boolean(data.isFeatured),
          isActive: data.isActive !== false
        });
        // Older products may only have `image`; combine it with any extra gallery images (max 3)
        const existing = cleanImages([data.image || '', ...(data.images || [])]).slice(0, MAX_IMAGES);
        setImageUrls(existing.length ? existing : ['']);
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

  const handleImageChange = (index, value) => {
    setImageUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
    setImageErrors({});
    if (fieldErrors.image || fieldErrors.images) setFieldErrors((prev) => ({ ...prev, image: undefined, images: undefined }));
  };
  const addImageSlot = () => setImageUrls((prev) => (prev.length < MAX_IMAGES ? [...prev, ''] : prev));
  const removeImageSlot = (index) => {
    setImageUrls((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']));
    setImageErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate images before sending: at least one, valid URL/path format, no more than 3 distinct pictures
    const cleaned = cleanImages(imageUrls);
    const nextImageErrors = {};
    if (!cleaned.length) nextImageErrors[0] = 'At least one image is required';
    imageUrls.forEach((u, i) => {
      const v = u.trim();
      if (v && !IMAGE_URL_PATTERN.test(v)) nextImageErrors[i] = 'Use an http(s) URL or a path starting with /';
    });
    if (Object.keys(nextImageErrors).length) {
      setImageErrors(nextImageErrors);
      setFormError('Please check the highlighted fields');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      image: cleaned[0],
      images: cleaned.slice(1, MAX_IMAGES),
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

          <fieldset className="form-group form-group--wide image-field">
            <legend>Product images (1&ndash;{MAX_IMAGES})</legend>
            <p className="admin-muted">The first image is the main picture shown in the shop. Extra images appear as thumbnails on the product page.</p>
            {imageUrls.map((url, index) => (
              <ImageSlot
                key={index}
                index={index}
                value={url}
                error={imageErrors[index] || (index === 0 ? fieldErrors.image : undefined)}
                onChange={handleImageChange}
                onRemove={removeImageSlot}
                canRemove={imageUrls.length > 1}
              />
            ))}
            {fieldErrors.images && <span className="field-error">{fieldErrors.images}</span>}
            {imageUrls.length < MAX_IMAGES && (
              <button type="button" className="btn btn-outline btn-sm image-field__add" onClick={addImageSlot}>
                + Add another image
              </button>
            )}
          </fieldset>

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
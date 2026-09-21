import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import QuantityControl from '../components/QuantityControl';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { HeartIcon, StarIcon, CartIcon, ImageIcon, ShieldCheckIcon, TruckIcon, AlertIcon } from '../components/Icons';
import useProductDetail from '../hooks/useProductDetail';

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'information', label: 'Nutrition & Information' },
  { id: 'reviews', label: 'Reviews' }
];

function Stars({ value }) {
  const rounded = Math.round(value || 0);
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={18} className={n <= rounded ? 'star-on' : 'star-off'} />
      ))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, wishlist, toggleWishlist, formatPrice } = useContext(StoreContext);
  const { status, error, product, category, related, relatedLoading, reload } = useProductDetail(id);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [tab, setTab] = useState('description');
  const [added, setAdded] = useState(0);

  // A different product (new URL) starts fresh
  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
    setFailedImages({});
    setTab('description');
    setAdded(0);
  }, [id]);

  useEffect(() => {
    if (!product) return undefined;
    const previous = document.title;
    document.title = `${product.name} | EXOTIC Food Market`;
    return () => {
      document.title = previous;
    };
  }, [product]);

  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(0), 4000);
    return () => clearTimeout(timer);
  }, [added]);

  if (status === 'loading') {
    return (
      <div className="pdp container pdp--state">
        <LoadingSpinner size="lg" label="Loading product..." />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="pdp container pdp--state">
        <EmptyState
          title="Product not found"
          message="The product you're looking for doesn't exist or is no longer available."
          action={{ label: 'Browse the shop', to: '/shop' }}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="pdp container pdp--state">
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load this product"
          message={error}
          action={{ label: 'Try again', onClick: reload }}
        />
      </div>
    );
  }

  // ---- Ready ------------------------------------------------------------------
  const images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
  const currentImage = images[Math.min(activeImage, images.length - 1)];
  const hasStockInfo = typeof product.stock === 'number';
  const outOfStock = hasStockInfo && product.stock <= 0;
  const lowStock = hasStockInfo && product.stock > 0 && product.stock <= 5;
  const maxQty = hasStockInfo ? Math.max(1, Math.min(product.stock, 99)) : 99;
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = hasDiscount ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const reviewCount = product.reviewCount || 0;

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const infoRows = [
    ['Brand', product.brand],
    ['Category', category?.name],
    ['Origin', product.origin],
    ['Size / Unit', product.unit],
    ['Availability', outOfStock ? 'Out of stock' : hasStockInfo ? `${product.stock} in stock` : 'In stock']
  ].filter(([, value]) => value);

  return (
    <div className="pdp container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Shop</Link>
        {category && (category.name || category.slug) && (
          <>
            <span aria-hidden="true">/</span>
            {category.slug ? (
              <Link to={`/shop/${category.slug}`}>{category.name || 'Category'}</Link>
            ) : (
              <span>{category.name || 'Category'}</span>
            )}
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp-top">
        {/* Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-gallery__main">
            <button
              type="button"
              className={`product-card__wish${isWishlisted ? ' is-active' : ''}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              onClick={() => toggleWishlist(product)}
            >
              <HeartIcon size={18} filled={isWishlisted} />
            </button>
            {currentImage && !failedImages[currentImage] ? (
              <img
                src={currentImage}
                alt={product.name}
                onError={() => setFailedImages((prev) => ({ ...prev, [currentImage]: true }))}
              />
            ) : (
              <span className="product-card__placeholder" aria-hidden="true">
                <ImageIcon size={72} />
              </span>
            )}
          </div>

          {images.length > 0 && (
            <ul className="pdp-thumbs" aria-label="Product images">
              {images.map((src, index) => (
                <li key={src}>
                  <button
                    type="button"
                    className={`pdp-thumb${index === activeImage ? ' is-active' : ''}`}
                    aria-label={`Show image ${index + 1} of ${images.length}`}
                    aria-current={index === activeImage ? 'true' : undefined}
                    onClick={() => setActiveImage(index)}
                  >
                    {failedImages[src] ? <ImageIcon size={24} /> : <img src={src} alt="" loading="lazy" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info */}
        <div className="pdp-info">
          {product.brand && <p className="pdp-brand">{product.brand}</p>}
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-rating">
            <Stars value={product.rating} />
            <span className="pdp-rating__text">
              {reviewCount > 0 ? `${product.rating} (${reviewCount} reviews)` : 'No reviews yet'}
            </span>
          </div>

          <div className="pdp-price">
            <span className="pdp-price__current">{formatPrice(product.price)}</span>
            {hasDiscount && <span className="pdp-price__old">{formatPrice(product.oldPrice)}</span>}
            {hasDiscount && <span className="pdp-price__badge">-{discountPercent}%</span>}
          </div>

          <p className={`stock-pill ${outOfStock ? 'stock-pill--out' : lowStock ? 'stock-pill--low' : 'stock-pill--in'}`}>
            {outOfStock ? 'Out of Stock' : lowStock ? `Only ${product.stock} left` : 'In Stock'}
          </p>

          {product.shortDescription && <p className="pdp-short">{product.shortDescription}</p>}

          <div className="pdp-buy">
            <div className="pdp-qty">
              <span id="qty-label">Quantity</span>
              <QuantityControl
                value={quantity}
                min={1}
                max={maxQty}
                disabled={outOfStock}
                label="Quantity"
                onChange={setQuantity}
              />
            </div>

            <button type="button" className="btn btn-primary btn-block pdp-btn" disabled={outOfStock} onClick={handleAdd}>
              <CartIcon size={18} /> Add to Cart
            </button>
            <button type="button" className="btn btn-outline btn-block pdp-btn" disabled={outOfStock} onClick={handleBuyNow}>
              Buy Now
            </button>

            <p className="pdp-added" role="status" aria-live="polite">
              {added > 0 && (
                <>
                  Added {added} {added === 1 ? 'item' : 'items'} to your cart. <Link to="/cart">View cart</Link>
                </>
              )}
            </p>
          </div>

          <ul className="pdp-perks">
            <li>
              <button type="button" className={`perk-btn${isWishlisted ? ' is-active' : ''}`} onClick={() => toggleWishlist(product)}>
                <HeartIcon size={22} filled={isWishlisted} />
                <span>{isWishlisted ? 'In your wishlist' : 'Add to Wishlist'}</span>
              </button>
            </li>
            <li>
              <span className="perk">
                <TruckIcon size={22} />
                <span>Fast &amp; Safe Delivery</span>
              </span>
            </li>
            <li>
              <span className="perk">
                <ShieldCheckIcon size={22} />
                <span>Secure Checkout</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <section className="pdp-tabs" aria-label="Product details">
        <div className="pdp-tabs__list" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`pdp-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.id === 'reviews' ? `Reviews (${reviewCount})` : t.label}
            </button>
          ))}
        </div>

        <div className="pdp-tabs__panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'description' && (
            <div className="pdp-description">
              {product.description ? (
                product.description
                  .split(/\n{2,}/)
                  .map((para, index) => <p key={index}>{para}</p>)
              ) : (
                <p>No description available for this product.</p>
              )}
            </div>
          )}

          {tab === 'information' && (
            <dl className="info-table">
              {infoRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === 'reviews' && (
            <div className="reviews-summary">
              <div className="reviews-summary__score">
                <strong>{reviewCount > 0 ? Number(product.rating || 0).toFixed(1) : '–'}</strong>
                <Stars value={product.rating} />
                <span>
                  {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
              <p className="reviews-summary__note">
                {reviewCount > 0
                  ? 'This rating is the average of our customers’ reviews. Individual written reviews will appear here soon.'
                  : 'This product has no reviews yet.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Related products */}
      {(relatedLoading || related.length > 0) && (
        <section className="pdp-related" aria-labelledby="related-title">
          <h2 id="related-title" className="section-title">
            Related Products
          </h2>
          {relatedLoading ? (
            <LoadingSpinner size="sm" label="Loading related products..." />
          ) : (
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
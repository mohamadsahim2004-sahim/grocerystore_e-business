// src/pages/ProductDetailPage.jsx
import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const {
    selectedProduct,
    setSelectedProduct,
    setCurrentPage,
    addToCart,
    wishlist,
    toggleWishlist,
    products,
    formatPrice
  } = useContext(StoreContext);

  // Default fallback if no product is selected
  const product = selectedProduct || products[0];

  // Interactive Component States
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Rating & Review State
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'Elena R.',
      rating: 5,
      date: '2 days ago',
      verified: true,
      comment: 'Super fresh! Arrived in an insulated cold box within 24 hours in Berlin. Authentic taste just like in Southeast Asia.'
    },
    {
      id: 2,
      author: 'Marcus K.',
      rating: 4,
      date: '1 week ago',
      verified: true,
      comment: 'Great quality and sweet flesh. One fruit was slightly small, but overall very satisfied with the packaging.'
    }
  ]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Discount Calculation logic
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = product.offerPercent || (hasDiscount ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0);
  const savings = hasDiscount ? product.oldPrice - product.price : 0;
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  // Related products from same category
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    setReviews([
      {
        id: Date.now(),
        author: newReview.name,
        rating: Number(newReview.rating),
        date: 'Just now',
        verified: true,
        comment: newReview.comment
      },
      ...reviews
    ]);

    setNewReview({ name: '', rating: 5, comment: '' });
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 20px', color: 'var(--text-primary)' }}>
      {/* Back to Catalog Navigation */}
      <button
        onClick={() => setCurrentPage('products')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ← Back to Catalog
      </button>

      {/* Main Product Showcase Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}
      >
        {/* Left Side: Product Image & Gallery */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              height: '380px',
              border: '1px solid var(--border-glass)'
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Discount Badge */}
            {hasDiscount && (
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '900',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  zIndex: 2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}
              >
                -{discountPercent}% OFF
              </span>
            )}

            {/* Wishlist Heart Button */}
            <button
              onClick={() => toggleWishlist(product)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Quick Info Badges Below Image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              🌱 <strong>100% Fresh Import</strong>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              ❄️ <strong>Cool-Pack Express</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details & Purchase Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Category & Tags */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: 'var(--neon-green-bright)' }}>
                {product.category?.toUpperCase()}
              </span>
              {product.isSpecial && (
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  🔥 SPECIAL OFFER
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 Origin: <strong>{product.origin}</strong></span>
            </div>

            {/* Product Title & Ratings */}
            <h1 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>
                ★ {product.rating || 4.9} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({reviews.length + 22} customer reviews)</span>
              </span>
              <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● In Stock (14 items available)
              </span>
            </div>

            {/* Price Box with Individual Discount Breakdown */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '16px' }}>
              {hasDiscount ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Regular Price:</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 'bold' }}>
                      {formatPrice(product.oldPrice)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--neon-green-bright)', fontWeight: 'bold' }}>Offer Price:</span>
                    <span style={{ fontSize: '26px', color: 'var(--neon-green-bright)', fontWeight: '900' }}>
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold', marginTop: '4px', textAlign: 'right' }}>
                    You Save: {formatPrice(savings)} ({discountPercent}% OFF)
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Price per unit ({product.unit}):</span>
                  <span style={{ fontSize: '26px', color: 'var(--text-primary)', fontWeight: '900' }}>
                    {formatPrice(product.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Short Description */}
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              {product.description}
            </p>

            {/* Quality Guarantee Callout */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                ⚡ Guaranteed Quality &amp; Storage
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Harvested &amp; packaged under certified organic quality standards</li>
                <li>Shipped in insulated cool-pack temperature control packaging</li>
                <li>Estimated Delivery: 1-2 Business Days across Germany</li>
              </ul>
            </div>
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '8px 14px', fontSize: '16px', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ padding: '0 12px', fontWeight: 'bold', fontSize: '14px' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '8px 14px', fontSize: '16px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--neon-green-bright)',
                color: '#000000',
                fontWeight: '900',
                fontSize: '15px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              Add {quantity} to Shopping Cart ({formatPrice(product.price * quantity)})
            </button>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation Section: Overview / Specifications / Customer Reviews */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-input)' }}>
          {[
            { id: 'overview', label: '📖 Product Overview' },
            { id: 'specs', label: '🌿 Origin & Storage Info' },
            { id: 'reviews', label: `⭐ Customer Reviews (${reviews.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--neon-green-bright)' : 'none',
                color: activeTab === tab.id ? 'var(--neon-green-bright)' : 'var(--text-muted)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* Tab 1: Product Overview */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>Description &amp; Culinary Uses</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>
                {product.description}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                Directly imported from sustainable farms in <strong>{product.origin}</strong>. Every batch is carefully inspected prior to dispatch to ensure optimal ripeness, vibrant flavor, and pristine freshness.
              </p>
            </div>
          )}

          {/* Tab 2: Specs & Storage */}
          {activeTab === 'specs' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Package Unit</span>
                  <strong style={{ fontSize: '13px' }}>{product.unit}</strong>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Country of Origin</span>
                  <strong style={{ fontSize: '13px' }}>{product.origin}</strong>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Recommended Storage</span>
                  <strong style={{ fontSize: '13px' }}>Refrigerate at 4°C–8°C</strong>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Dietary Certificate</span>
                  <strong style={{ fontSize: '13px' }}>100% Organic &amp; Vegan</strong>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Customer Reviews & Submission Form */}
          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                {/* Review List Column */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Customer Feedback</h3>
                  
                  {reviews.map((rev) => (
                    <div key={rev.id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13px' }}>{rev.author}</strong>
                          {rev.verified && (
                            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px' }}>
                              ✓ Verified Purchase
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rev.date}</span>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '6px' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>

                {/* Write a Review Column */}
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Write a Customer Review</h3>
                  
                  {reviewSubmitted && (
                    <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '4px', fontSize: '12px', marginBottom: '12px' }}>
                      ✓ Thank you! Your review has been published.
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Thomas M."
                        value={newReview.name}
                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Rating</label>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="5">★★★★★ (5/5) Excellent</option>
                        <option value="4">★★★★☆ (4/5) Very Good</option>
                        <option value="3">★★★☆☆ (3/5) Average</option>
                        <option value="2">★★☆☆☆ (2/5) Poor</option>
                        <option value="1">★☆☆☆☆ (1/5) Terrible</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Your Review</label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Share details about fresh quality, taste, and packaging..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{ padding: '10px', background: 'var(--neon-green-bright)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Recommendation Section */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>
            Similar Products You Might Like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
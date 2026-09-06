import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { selectedProduct, addToCart, wishlist, toggleWishlist, formatPrice, setCurrentPage, products } = useContext(StoreContext);
  const [quantity, setQuantity] = useState(1);

  if (!selectedProduct) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>No product selected</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Please select an item from our store catalog to view details.</p>
        <button className="add-to-cart-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setCurrentPage('products')}>
          Browse Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.some((item) => item.id === selectedProduct.id);
  const relatedProducts = products.filter((p) => p.category === selectedProduct.category && p.id !== selectedProduct.id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(selectedProduct);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      {/* Back Navigation */}
      <button
        onClick={() => setCurrentPage('products')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        ← Back to Catalog
      </button>

      {/* Main Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '40px' }}>
        {/* Product Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            style={{ width: '100%', height: '360px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
          />
          <button
            className="heart-btn"
            onClick={() => toggleWishlist(selectedProduct)}
            style={{ top: '12px', right: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Information & Action Section */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--neon-green-bright)', fontWeight: 'bold', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                {selectedProduct.category}
              </span>
              {selectedProduct.isSpecial && (
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  🔥 Special Offer
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 12px 0', fontFamily: 'var(--font-heading)' }}>
              {selectedProduct.name}
            </h1>

            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--neon-green-bright)', marginBottom: '16px' }}>
              {formatPrice(selectedProduct.price)}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              {selectedProduct.description}
            </p>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '24px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>⚡ Guaranteed Quality &amp; Storage</div>
              <div style={{ color: 'var(--text-muted)' }}>• Harvested &amp; packaged under certified organic standards</div>
              <div style={{ color: 'var(--text-muted)' }}>• Shipped in insulated cool-pack temperature control</div>
            </div>
          </div>

          {/* Quantity and Add Button */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: '4px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  -
                </button>
                <span style={{ padding: '0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ padding: '4px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  +
                </button>
              </div>
            </div>

            <button className="add-to-cart-btn" style={{ padding: '14px', fontSize: '14px' }} onClick={handleAddToCart}>
              Add {quantity} to Shopping Cart ({formatPrice(selectedProduct.price * quantity)})
            </button>
          </div>
        </div>
      </div>

      {/* Related Category Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            More in {selectedProduct.category}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
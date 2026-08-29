import React from 'react';

export default function HomePage({
  categories,
  products,
  onSelectCategory,
  onNavigateToListing,
  addToCart,
  toggleWishlist,
  wishlist
}) {
  return (
    <main>
      <section className="hero-banner">
        <div className="hero-box">
          <h1>Explore a World of Flavor.</h1>
          <p>Exotic Groceries, Delivered to Your Door in Germany.</p>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title center">Product Categories</h2>
        <div className="categories-grid">
          {categories.filter(c => c.image).map((cat) => (
            <div key={cat.id} className="category-card" onClick={() => onSelectCategory(cat.id)}>
              <img src={cat.image} alt={cat.name} />
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title center" style={{ cursor: 'pointer' }} onClick={onNavigateToListing}>
          Best Selling Products →
        </h2>
        <div className="products-grid">
          {products.slice(0, 8).map((prod) => {
            const isWishlisted = wishlist.some((item) => item.id === prod.id);
            return (
              <div key={prod.id} className="product-card">
                {prod.discount && <span className="discount-tag">{prod.discount}</span>}
                <button
                  className={`wishlist-heart ${isWishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(prod)}
                >
                  ♥
                </button>
                <img src={prod.image} alt={prod.name} className="product-image" />
                <div className="product-name">{prod.name}</div>
                <div className="price-container">
                  <span className="product-price">€{prod.price.toFixed(2)}</span>
                  {prod.originalPrice && <span className="original-price">€{prod.originalPrice.toFixed(2)}</span>}
                </div>
                <button className="add-btn" onClick={() => addToCart(prod)}>
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
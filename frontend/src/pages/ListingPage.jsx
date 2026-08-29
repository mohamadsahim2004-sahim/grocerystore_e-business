import React from 'react';

export default function ListingPage({
  categories,
  products,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  addToCart,
  toggleWishlist,
  wishlist,
  searchQuery
}) {
  return (
    <main>
      <div className="category-strip">
        <span className="category-strip-title">CATEGORIES</span>
        <ul className="category-strip-items">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                className={`category-strip-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sort-toolbar">
        <span className="results-count">
          Showing {products.length} items {searchQuery && `for search "${searchQuery}"`}
        </span>
        <div className="sort-container">
          <span className="sort-label">Sort by</span>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="low-high">Price: Low-High</option>
            <option value="high-low">Price: High-Low</option>
          </select>
        </div>
      </div>

      <section className="section">
        <div className="products-grid">
          {products.map((prod) => {
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
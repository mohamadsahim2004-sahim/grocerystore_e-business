import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { products, setCurrentPage, setSelectedCategory, setShowOnlySpecials } = useContext(StoreContext);

  const featuredProducts = products.slice(0, 4);
  const specialProducts = products.filter((p) => p.isSpecial);

  const categoryShortcuts = [
    { name: 'Fruits', icon: '🥭', desc: 'Dragon Fruit, Mangosteen & Durian' },
    { name: 'Vegetables & Herbs', icon: '🌿', desc: 'Galangal, Lemongrass & Holy Basil' },
    { name: 'Spices', icon: '✨', desc: 'Saffron, Vanilla Beans & Cardamom' },
    { name: 'Beverages', icon: '🍵', desc: 'Kyoto Matcha & Butterfly Pea' },
    { name: 'Sauces & Condiments', icon: '🌶️', desc: 'Gochujang, Pandan Jam & Fish Sauce' },
    { name: 'Grains & Pantry', icon: '🌾', desc: 'Jasmine Rice & Forbidden Black Rice' },
    { name: 'Snacks & Sweets', icon: '🌴', desc: 'Medjool Dates & Freeze-Dried Fruit' }
  ];

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowOnlySpecials(false);
    setCurrentPage('products');
  };

  const handleSpecialsClick = () => {
    setSelectedCategory('ALL');
    setShowOnlySpecials(true);
    setCurrentPage('products');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Hero Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 27, 34, 0.95) 100%)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '48px 32px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <span style={{ color: 'var(--neon-green-bright)', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
          🌱 Direct Farm Imports &amp; Asian Grocery Specialties
        </span>
        <h1 style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.2' }}>
          Exotic Flavors Delivered <br />
          <span style={{ color: 'var(--neon-green-bright)' }}>Fresh Across Germany</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', lineHeight: '1.6', margin: 0 }}>
          Discover organic dragon fruit, Thai herbs, Persian saffron, Kyoto matcha, authentic Korean sauces, and rare grains sourced directly from fair-trade smallholders.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            className="add-to-cart-btn"
            style={{ width: 'auto', padding: '12px 24px', fontSize: '14px' }}
            onClick={() => {
              setSelectedCategory('ALL');
              setShowOnlySpecials(false);
              setCurrentPage('products');
            }}
          >
            Explore Full Catalog ➔
          </button>
          <button
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={handleSpecialsClick}
          >
            🔥 View Weekly Deals
          </button>
        </div>
      </section>

      {/* Feature Badges */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚚</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Free Delivery</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On orders over €49 in Germany</div>
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>❄️</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Cool-Pack Express</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guaranteed fresh herbs &amp; fruits</div>
          </div>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✨</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>100% Authentic</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct regional farm sourcing</div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Browse by Category
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {categoryShortcuts.map((cat) => (
            <div
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              style={{
                padding: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{cat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Highlights */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
            Featured Highlights
          </h2>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setShowOnlySpecials(false);
              setCurrentPage('products');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--neon-green-bright)', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            View All Products ➔
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Weekly Specials */}
      {specialProducts.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
              🔥 Weekly Special Offers
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {specialProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
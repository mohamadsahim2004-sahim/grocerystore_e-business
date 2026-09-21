import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import useFeaturedProducts from '../hooks/useFeaturedProducts';
import heroArt from '../assets/hero-produce.svg';
import {
  GrainIcon,
  FruitVegIcon,
  SpiceIcon,
  SnackIcon,
  BeverageIcon,
  HouseholdIcon,
  FrozenIcon,
  OilIcon,
  ShieldCheckIcon,
  TruckIcon,
  LockIcon,
  ArrowRightIcon,
  AlertIcon
} from '../components/Icons';
import { TAGLINE } from '../config/siteConfig';

const CATEGORIES = [
  { label: 'Rice & Grains', slug: 'rice-grains', Icon: GrainIcon },
  { label: 'Fruits & Vegetables', slug: 'fruits-vegetables', Icon: FruitVegIcon },
  { label: 'Spices & Herbs', slug: 'spices-herbs', Icon: SpiceIcon },
  { label: 'Snacks & Sweets', slug: 'snacks-sweets', Icon: SnackIcon },
  { label: 'Beverages', slug: 'beverages', Icon: BeverageIcon },
  { label: 'Household & Care', slug: 'household-care', Icon: HouseholdIcon },
  { label: 'Frozen Foods', slug: 'frozen-foods', Icon: FrozenIcon },
  { label: 'Oils & Ghee', slug: 'oils-ghee', Icon: OilIcon }
];

const TRUST_ITEMS = [
  { title: 'Fresh & Quality Products', text: 'Hand-picked and carefully sourced', Icon: ShieldCheckIcon },
  { title: 'Fast & Safe Delivery', text: 'Right to your door, on time', Icon: TruckIcon },
  { title: 'Secure Checkout', text: 'Safe and protected payments', Icon: LockIcon }
];

export default function HomePage() {
  const { products, loading, error, reload } = useFeaturedProducts(10);
  const shopProps = { to: '/shop' };

  const renderFeatured = () => {
    if (loading) {
      return <LoadingSpinner label="Loading featured products..." />;
    }
    if (error) {
      return (
        <EmptyState
          icon={<AlertIcon size={32} />}
          title="We couldn't load the products"
          message={error}
          action={{ label: 'Try again', onClick: reload }}
        />
      );
    }
    if (products.length === 0) {
      return (
        <EmptyState
          title="No featured products yet"
          message="New products are on their way. Please check back soon."
          action={{ label: 'Browse the shop', ...shopProps }}
        />
      );
    }
    return (
      <div className="product-grid product-grid--featured">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="home container">
      {/* Hero */}
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__content">
          <h1 id="home-hero-title">{TAGLINE}</h1>
          <p>Fresh groceries, spices and more &mdash; from around the world to your door.</p>
          <Link {...shopProps} className="btn btn-hero">
            Shop Now <ArrowRightIcon size={18} />
          </Link>
        </div>
        <img className="home-hero__art" src={heroArt} alt="" aria-hidden="true" />
      </section>

      {/* Categories */}
      <section className="home-section" aria-labelledby="home-categories-title">
        <h2 id="home-categories-title" className="sr-only">
          Shop by category
        </h2>
        <ul className="category-grid">
          {CATEGORIES.map(({ label, slug, Icon }) => (
            <li key={label}>
              <Link to={`/shop/${slug}`} className="category-tile">
                <span className="category-tile__icon">
                  <Icon size={30} />
                </span>
                <span className="category-tile__label">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products (GET /api/products) */}
      <section className="home-section" aria-labelledby="home-featured-title">
        <div className="section-head">
          <h2 id="home-featured-title" className="section-title">
            Featured Products
          </h2>
          <Link {...shopProps} className="section-link">
            View all <ArrowRightIcon size={16} />
          </Link>
        </div>
        {renderFeatured()}
      </section>

      {/* Trust strip */}
      <section className="trust-strip" aria-label="Why shop with EXOTIC">
        {TRUST_ITEMS.map(({ title, text, Icon }) => (
          <div className="trust-item" key={title}>
            <span className="trust-item__icon">
              <Icon size={28} />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
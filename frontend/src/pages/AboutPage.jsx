import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';
import { TAGLINE, CONTACT_INFO } from '../config/siteConfig';

export default function AboutPage() {
  return (
    <div className="container page-section">
      <h1 className="page-title">About EXOTIC Food Market</h1>
      <section className="panel" aria-labelledby="about-title">
        <h2 id="about-title">{TAGLINE}</h2>
        <p>
          EXOTIC Food Market brings fresh groceries, spices and more from around the world to your door.
          Browse our categories to find rice and grains, spices, snacks, beverages and other everyday essentials.
        </p>
        <p>
          Questions about an order or a product? Reach us at <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a> or{' '}
          <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>. We are based in {CONTACT_INFO.address}.
        </p>
        <Link to="/shop" className="btn btn-primary">
          Shop Now <ArrowRightIcon size={18} />
        </Link>
      </section>
    </div>
  );
}
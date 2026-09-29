import React from 'react';
import { Link } from 'react-router-dom';
import CategoryTiles from '../components/CategoryTiles';
import { ArrowRightIcon, SearchIcon, CartIcon, TruckIcon } from '../components/Icons';
import { TAGLINE, CONTACT_INFO } from '../config/siteConfig';

const STEPS = [
  { Icon: SearchIcon, title: 'Browse', text: 'Explore our categories or search for the ingredient you need.' },
  { Icon: CartIcon, title: 'Order', text: 'Add items to your cart and check out with your delivery details.' },
  { Icon: TruckIcon, title: 'Delivered', text: 'Follow your order from Pending to Delivered in your account.' }
];

export default function AboutPage() {
  return (
    <div className="container page-section info-page">
      <h1 className="page-title">About EXOTIC Food Market</h1>
      <p className="info-page__lead">{TAGLINE}</p>

      <section className="panel info-section" aria-labelledby="about-who">
        <h2 id="about-who">Who we are</h2>
        <p>
          EXOTIC Food Market brings fresh groceries, spices and more from around the world to your door. We are based in {CONTACT_INFO.address}.
        </p>
        <p>
          Whether you are cooking a family favourite or trying a cuisine for the first time, you will find rice and grains, spices, snacks, beverages
          and other everyday essentials in one place.
        </p>
        <Link to="/shop" className="btn btn-primary">
          Shop Now <ArrowRightIcon size={18} />
        </Link>
      </section>

      <section className="info-section" aria-labelledby="about-cats">
        <h2 id="about-cats">What you&apos;ll find</h2>
        <CategoryTiles hideWhenEmpty />
      </section>

      <section className="info-section" aria-labelledby="about-how">
        <h2 id="about-how">Shopping with us</h2>
        <ol className="info-grid info-grid--3 info-steps-cards">
          {STEPS.map(({ Icon, title, text }) => (
            <li key={title} className="info-card">
              <span className="info-card__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel info-section" aria-labelledby="about-help">
        <h2 id="about-help">Questions?</h2>
        <p>
          Reach us at <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a> or <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>,
          or see our <Link to="/faq">FAQ</Link> and <Link to="/shipping">Shipping &amp; Delivery</Link> pages.
        </p>
      </section>
    </div>
  );
}
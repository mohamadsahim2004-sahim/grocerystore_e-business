import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_INFO } from '../config/siteConfig';

const TOPICS = [
  { title: 'Orders', text: 'Track an order and see its status.', links: [{ label: 'Order History', to: '/orders' }, { label: 'Order questions', to: '/faq' }] },
  { title: 'Delivery', text: 'Shipping charges, how delivery works and what to do if an order is late.', links: [{ label: 'Shipping & Delivery', to: '/shipping' }] },
  { title: 'Payment', text: 'Payment methods and promo codes.', links: [{ label: 'Payment FAQ', to: '/faq' }, { label: 'View cart', to: '/cart' }] },
  { title: 'Account', text: 'Update your details and manage your account.', links: [{ label: 'Profile', to: '/profile' }, { label: 'Settings', to: '/settings' }] },
  { title: 'Addresses', text: 'Save delivery addresses and choose a default.', links: [{ label: 'My Addresses', to: '/addresses' }] },
  { title: 'Returns & refunds', text: 'Problem with an order? Get in touch with your order number.', links: [{ label: 'Contact Us', to: '/contact' }] }
];

export default function HelpPage() {
  return (
    <div className="container page-section info-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Help Center</span>
      </nav>
      <h1 className="page-title">Help Center</h1>
      <p className="info-page__lead">Find answers fast, or get in touch with the EXOTIC Food Market team.</p>

      <ul className="info-grid">
        {TOPICS.map((topic) => (
          <li key={topic.title} className="info-card">
            <h2>{topic.title}</h2>
            <p>{topic.text}</p>
            <ul className="info-card__links">
              {topic.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <section className="panel info-section" aria-labelledby="help-contact">
        <h2 id="help-contact">Still need help?</h2>
        <p>
          Read the <Link to="/faq">FAQ</Link>, or <Link to="/contact">contact us</Link> at <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>{' '}
          or <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>. Please include your order number if your question is about an order.
        </p>
      </section>
    </div>
  );
}
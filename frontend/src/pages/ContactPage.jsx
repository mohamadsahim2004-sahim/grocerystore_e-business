import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon, MailIcon, PinIcon } from '../components/Icons';
import { CONTACT_INFO } from '../config/siteConfig';

// There is no backend endpoint that receives contact messages, so this page deliberately has no contact form:
// it shows the store's real contact channels instead of a form that would silently send nothing.
export default function ContactPage() {
  return (
    <div className="container page-section info-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Contact Us</span>
      </nav>
      <h1 className="page-title">Contact Us</h1>
      <p className="info-page__lead">Questions about an order, a product or your account? We&apos;re happy to help.</p>

      <ul className="info-grid info-grid--3">
        <li className="info-card">
          <span className="info-card__icon" aria-hidden="true">
            <MailIcon size={22} />
          </span>
          <h2>Email</h2>
          <p>
            <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
          </p>
        </li>
        <li className="info-card">
          <span className="info-card__icon" aria-hidden="true">
            <PhoneIcon size={22} />
          </span>
          <h2>Phone</h2>
          <p>
            <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>
          </p>
        </li>
        <li className="info-card">
          <span className="info-card__icon" aria-hidden="true">
            <PinIcon size={22} />
          </span>
          <h2>Location</h2>
          <p>{CONTACT_INFO.address}</p>
        </li>
      </ul>

      <section className="panel info-section" aria-labelledby="contact-tips">
        <h2 id="contact-tips">Before you get in touch</h2>
        <p>Including your order number helps us find your order quickly. You can find it in your <Link to="/orders">Order History</Link>.</p>
        <p>
          Many answers are already available in the <Link to="/faq">FAQ</Link>, the <Link to="/help">Help Center</Link> and{' '}
          <Link to="/shipping">Shipping &amp; Delivery</Link>.
        </p>
      </section>
    </div>
  );
}
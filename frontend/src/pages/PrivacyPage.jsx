import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_INFO } from '../config/siteConfig';

// NOTE FOR THE STORE OWNER: this text describes what the website actually does today (accounts, orders, local storage).
// It makes no claim of compliance with any specific law. The "Sharing" and "Your choices" sections state business
// practices, so confirm they match how you really operate (and have the policy reviewed for your jurisdiction) before launch.
const SECTIONS = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <p>We collect only what the store needs to run:</p>
        <ul>
          <li>
            <strong>Account information:</strong> your name, email address, phone number (optional) and a password. Passwords are stored as
            one-way hashes, never as plain text.
          </li>
          <li>
            <strong>Address information:</strong> delivery addresses you save to your account.
          </li>
          <li>
            <strong>Order information:</strong> the items you order, delivery details you enter at checkout, payment method chosen, totals and order
            status.
          </li>
          <li>
            <strong>Wishlist and cart:</strong> products you save or add to your cart.
          </li>
        </ul>
      </>
    )
  },
  {
    id: 'payment',
    title: 'Payment information',
    body: (
      <p>
        You can pay by Cash on Delivery or by the card option, which is currently a test-mode simulation. This website does not collect or store card
        numbers or card security codes.
      </p>
    )
  },
  {
    id: 'storage',
    title: 'Cookies and local storage',
    body: (
      <p>
        The website stores a few items in your browser&apos;s local storage so that it works: a sign-in token while you are logged in, your cart and
        any promo code you entered, and your wishlist while you are not signed in. These are used only to run the store. You can clear them at any time
        in your browser settings, but you may then need to sign in again and your cart or guest wishlist will be emptied.
      </p>
    )
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <ul>
        <li>To create and manage your account and sign you in.</li>
        <li>To process, deliver and support your orders.</li>
        <li>To pre-fill your details and default address at checkout.</li>
        <li>To respond to your questions and requests.</li>
      </ul>
    )
  },
  {
    id: 'sharing',
    title: 'Sharing your information',
    body: (
      <p>
        Your information is shared only with people who need it to prepare, deliver or support your order, or where we are required to by law. This
        website does not currently include third-party advertising or analytics services.
      </p>
    )
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We protect accounts with hashed passwords and signed sign-in tokens, and each customer can only access their own profile, addresses and
        orders. No online service can guarantee absolute security, so please keep your password private and log out on shared devices.
      </p>
    )
  },
  {
    id: 'rights',
    title: 'Your choices',
    body: (
      <p>
        You can view and update your name, email, phone number and saved addresses at any time in <Link to="/profile">Profile</Link> and{' '}
        <Link to="/addresses">Addresses</Link>. To ask a question about your data, or to request a copy or deletion of it, please contact us.
      </p>
    )
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        EXOTIC Food Market, {CONTACT_INFO.address}. Email <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a> or call{' '}
        <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>, or visit our <Link to="/contact">Contact Us</Link> page.
      </p>
    )
  }
];

export default function PrivacyPage() {
  return (
    <div className="container page-section info-page info-page--narrow">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Privacy Policy</span>
      </nav>
      <h1 className="page-title">Privacy Policy</h1>
      <p className="info-page__lead">How EXOTIC Food Market handles the information you give us when you use this website.</p>

      <div className="panel policy">
        {SECTIONS.map((section, index) => (
          <section key={section.id} aria-labelledby={`pp-${section.id}`}>
            <h2 id={`pp-${section.id}`}>
              {index + 1}. {section.title}
            </h2>
            {section.body}
          </section>
        ))}
      </div>
    </div>
  );
}
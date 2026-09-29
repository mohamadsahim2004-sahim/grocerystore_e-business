import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { SHIPPING_INFO, CONTACT_INFO } from '../config/siteConfig';

export default function ShippingPage() {
  const { formatPrice } = useContext(StoreContext);
  const { flatRate, freeAbove, deliveryAreas, deliveryTime } = SHIPPING_INFO;

  return (
    <div className="container page-section info-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Shipping &amp; Delivery</span>
      </nav>
      <h1 className="page-title">Shipping &amp; Delivery</h1>
      <p className="info-page__lead">How your EXOTIC Food Market order gets from our store to your door.</p>

      <section className="panel info-section" aria-labelledby="ship-how">
        <h2 id="ship-how">How delivery works</h2>
        <ol className="info-steps">
          <li>
            <strong>Place your order.</strong> Add items to your cart, sign in, and enter your delivery address at checkout.
          </li>
          <li>
            <strong>We process it.</strong> Your order starts as <em>Pending</em> and moves to <em>Processing</em> as we prepare it.
          </li>
          <li>
            <strong>It ships.</strong> The status changes to <em>Shipped</em> when your order is on its way.
          </li>
          <li>
            <strong>It arrives.</strong> Once delivered, the order is marked <em>Delivered</em>.
          </li>
        </ol>
        <p>
          You can follow every step in <Link to="/orders">Order History</Link> under My Account.
        </p>
      </section>

      <section className="panel info-section" aria-labelledby="ship-charges">
        <h2 id="ship-charges">Shipping charges</h2>
        <p>
          Shipping is a flat <strong>{formatPrice(flatRate)}</strong> per order. Orders with items totalling more than{' '}
          <strong>{formatPrice(freeAbove)}</strong> ship free. The exact shipping cost is always shown in your cart and at checkout before you place
          your order.
        </p>
      </section>

      <section className="panel info-section" aria-labelledby="ship-areas">
        <h2 id="ship-areas">Delivery areas &amp; timing</h2>
        <h3>Where we deliver</h3>
        <p>{deliveryAreas || 'Please contact us to confirm that we deliver to your address before you order.'}</p>
        <h3>Estimated delivery time</h3>
        <p>{deliveryTime || 'Delivery times depend on your location and order. Contact us if you need to know when to expect your order.'}</p>
      </section>

      <section className="panel info-section" aria-labelledby="ship-delay">
        <h2 id="ship-delay">If your order is delayed</h2>
        <p>
          First check the status of your order in <Link to="/orders">Order History</Link>. If it has not arrived when you expect it, contact us
          with your order number and we will look into it.
        </p>
      </section>

      <section className="panel info-section" aria-labelledby="ship-contact">
        <h2 id="ship-contact">Need help?</h2>
        <p>
          Email <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a> or call <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>.
          You can also visit our <Link to="/faq">FAQ</Link> or <Link to="/contact">Contact Us</Link> page.
        </p>
      </section>
    </div>
  );
}
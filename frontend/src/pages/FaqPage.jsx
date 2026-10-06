import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import { SHIPPING_INFO, RETURNS_POLICY } from '../config/siteConfig';

// Native <details>/<summary>: keyboard accessible (Tab, Enter/Space), no JavaScript state to break.
export default function FaqPage() {
  const { formatPrice } = useContext(StoreContext);

  const sections = [
    {
      id: 'orders',
      title: 'Orders',
      items: [
        {
          q: 'Do I need an account to place an order?',
          a: 'You can browse and add items to your cart without an account, but you need to sign in (or register) to check out.'
        },
        {
          q: 'How can I check the status of my order?',
          a: (
            <>
              Go to <Link to="/orders">Order History</Link> in My Account. Each order shows its status: Pending, Processing, Shipped, Delivered or
              Cancelled.
            </>
          )
        },
        {
          q: 'Can I change or cancel an order after placing it?',
          a: (
            <>
              Orders cannot be edited or cancelled online. Please <Link to="/contact">contact us</Link> with your order number as soon as possible.
            </>
          )
        }
      ]
    },
    {
      id: 'delivery',
      title: 'Delivery',
      items: [
        {
          q: 'How much does delivery cost?',
          a: `Shipping is a flat ${formatPrice(SHIPPING_INFO.flatRate)} per order, and free when your items total more than ${formatPrice(SHIPPING_INFO.freeAbove)}. The exact amount is shown at checkout before you pay.`
        },
        {
          q: 'Where do you deliver and how long does it take?',
          a: (
            <>
              {SHIPPING_INFO.deliveryAreas || SHIPPING_INFO.deliveryTime
                ? [SHIPPING_INFO.deliveryAreas, SHIPPING_INFO.deliveryTime].filter(Boolean).join(' ')
                : 'Please contact us to confirm delivery to your address and the expected time.'}{' '}
              See <Link to="/shipping">Shipping &amp; Delivery</Link> for more.
            </>
          )
        },
        {
          q: 'My order is late. What should I do?',
          a: (
            <>
              Check its status in <Link to="/orders">Order History</Link>, then <Link to="/contact">contact us</Link> with your order number.
            </>
          )
        }
      ]
    },
    {
      id: 'payment',
      title: 'Payment',
      items: [
        {
          q: 'Which payment methods are available?',
          a: 'At checkout you can choose Cash on Delivery, or the Credit / Debit Card option, which is currently a test-mode simulation.'
        },
        {
          q: 'Is my card information stored?',
          a: 'No. The card option is in test mode: no real payment is processed and no card details are collected or stored.'
        },
        {
          q: 'How do I use a promo code?',
          a: (
            <>
              Enter it in your <Link to="/cart">cart</Link>. The discount is calculated by our system when your order total is worked out.
            </>
          )
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & addresses',
      items: [
        {
          q: 'How do I update my name, email or phone number?',
          a: (
            <>
              Open <Link to="/profile">Profile</Link> in My Account and choose Edit Profile.
            </>
          )
        },
        {
          q: 'How do I save or change a delivery address?',
          a: (
            <>
              Use <Link to="/addresses">Addresses</Link> in My Account to add, edit or delete addresses and choose your default. The default is
              pre-filled at checkout.
            </>
          )
        },
        {
          q: 'I forgot my password or want to change it.',
          a: (
            <>
              Changing or resetting a password online is not available yet. Please <Link to="/contact">contact us</Link> for help.
            </>
          )
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & refunds',
      items: [
        {
          q: 'What is your returns and refund policy?',
          a: RETURNS_POLICY ? (
            `You can return items within ${RETURNS_POLICY.returnWindowDays} days of delivery. ${RETURNS_POLICY.condition}`
          ) : (
            <>
              A returns and refund policy has not been published on this site yet. If there is a problem with your order, please{' '}
              <Link to="/contact">contact us</Link> with your order number and details.
            </>
          )
        }
      ]
    }
  ];

  return (
    <div className="container page-section info-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">FAQ</span>
      </nav>
      <h1 className="page-title">Frequently Asked Questions</h1>
      <p className="info-page__lead">
        Quick answers about orders, delivery, payment and your account. Can&apos;t find what you need? Visit the <Link to="/help">Help Center</Link>{' '}
        or <Link to="/contact">contact us</Link>.
      </p>

      {sections.map((section) => (
        <section key={section.id} className="faq-group" aria-labelledby={`faq-${section.id}`}>
          <h2 id={`faq-${section.id}`}>{section.title}</h2>
          <div className="faq">
            {section.items.map((item) => (
              <details key={item.q} className="faq__item">
                <summary>{item.q}</summary>
                <div className="faq__answer">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
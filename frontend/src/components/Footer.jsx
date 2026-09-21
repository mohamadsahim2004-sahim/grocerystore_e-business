import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { PhoneIcon, MailIcon, PinIcon, SOCIAL_ICONS } from './Icons';
import useStoreNav from '../hooks/useStoreNav';
import { NAV_LINKS, CUSTOMER_SERVICE_LINKS, CONTACT_INFO, SOCIAL_LINKS, TAGLINE } from '../config/siteConfig';

export default function Footer() {
  const { getLinkProps } = useStoreNav();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandLogo variant="wordmark" tone="dark" />
          <p className="footer-tagline">{TAGLINE}</p>
        </div>

        <nav className="footer-col" aria-label="Quick links">
          <h3>Quick Links</h3>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link {...getLinkProps(link)}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Customer service">
          <h3>Customer Service</h3>
          <ul>
            {CUSTOMER_SERVICE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col footer-contact-col">
          <h3>Contact</h3>
          <ul className="footer-contact">
            <li>
              <PhoneIcon size={16} />
              <a href={CONTACT_INFO.phoneHref}>{CONTACT_INFO.phone}</a>
            </li>
            <li>
              <MailIcon size={16} />
              <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
            </li>
            <li>
              <PinIcon size={16} />
              <span>{CONTACT_INFO.address}</span>
            </li>
          </ul>

          <div className="footer-social" aria-label="Follow us">
            {SOCIAL_LINKS.map(({ label, href, icon }) => {
              const SocialIcon = SOCIAL_ICONS[icon];
              return (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                  {SocialIcon && <SocialIcon size={18} />}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">&copy; {new Date().getFullYear()} EXOTIC Food Market. All rights reserved.</div>
      </div>
    </footer>
  );
}
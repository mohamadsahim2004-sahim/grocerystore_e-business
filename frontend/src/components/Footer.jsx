import React from 'react';
import { 
  BrandLogo, 
  VisaLogo, 
  MastercardLogo, 
  PaypalLogo, 
  ApplePayLogo,
  InstagramLogo,
  FacebookLogo,
  TwitterLogo
} from './Logos';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section with Vertical Logo */}
        <div className="footer-info">
          <BrandLogo layout="vertical" />
          
          <div className="footer-socials">
            <a href="#instagram" aria-label="Instagram"><InstagramLogo /></a>
            <a href="#facebook" aria-label="Facebook"><FacebookLogo /></a>
            <a href="#twitter" aria-label="Twitter"><TwitterLogo /></a>
          </div>
        </div>

        {/* 2-Line Full-Width Link Container */}
        <div className="footer-nav-full">
          <div className="footer-nav-row">
            <button onClick={() => onNavigate('faq')}>FAQ</button>
            <button onClick={() => onNavigate('shipping')}>Shipping Info</button>
          </div>
          <div className="footer-nav-row">
            <button onClick={() => onNavigate('privacy')}>Privacy Policy</button>
            <button onClick={() => onNavigate('impressum')}>Impressum</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Exotic Food Markt. All rights reserved.</p>
        <div className="payment-logos">
          <VisaLogo />
          <MastercardLogo />
          <PaypalLogo />
          <ApplePayLogo />
        </div>
      </div>
    </footer>
  );
}
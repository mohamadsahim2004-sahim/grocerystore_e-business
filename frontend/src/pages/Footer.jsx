import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <ul className="footer-nav">
        <li><button onClick={() => onNavigate('faq')} className="footer-link-btn">FAQ</button></li>
        <li><button onClick={() => onNavigate('shipping')} className="footer-link-btn">SHIPPING INFO (Germany)</button></li>
        <li><button onClick={() => onNavigate('impressum')} className="footer-link-btn">IMPRESSUM</button></li>
        <li><button onClick={() => onNavigate('privacy')} className="footer-link-btn">PRIVACY POLICY</button></li>
        <li><button onClick={() => onNavigate('contact')} className="footer-link-btn">CONTACT</button></li>
        <li><button onClick={() => onNavigate('about')} className="footer-link-btn">ABOUT</button></li>
      </ul>
      <div className="copyright">@2026 EXOTIC GROCERY STORE</div>
    </footer>
  );
}
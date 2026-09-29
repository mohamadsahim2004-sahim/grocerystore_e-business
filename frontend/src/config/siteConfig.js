// Shared brand/navigation content used by Header and Footer.

export const TAGLINE = 'Authentic & Global Flavors';

// Primary navigation links used across header and mobile menus
export const NAV_LINKS = [
  { label: 'Home', to: '/', page: 'home' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' }
];

export const CUSTOMER_SERVICE_LINKS = [
  { label: 'Help & FAQ', to: '/help' },
  { label: 'Shipping', to: '/shipping' },
  { label: 'Returns', to: '/returns' },
  { label: 'Privacy Policy', to: '/privacy' }
];

export const CONTACT_INFO = {
  phone: '+94 77 123 4567',
  phoneHref: 'tel:+94771234567',
  email: 'info@exoticmarket.com',
  address: 'Colombo, Sri Lanka'
};

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: 'instagram' },
  { label: 'X (Twitter)', href: 'https://x.com', icon: 'x' },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: 'youtube' }
];

// Routes that do not have a dedicated page implementation yet; they render a placeholder so links never dead-end.
export const PLACEHOLDER_ROUTES = [
  { path: '/contact', title: 'Contact Us' },
  { path: '/help', title: 'Help & FAQ' },
  { path: '/shipping', title: 'Shipping' },
  { path: '/returns', title: 'Returns' },
  { path: '/privacy', title: 'Privacy Policy' }
];
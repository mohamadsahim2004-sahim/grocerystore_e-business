import React from 'react';

// Shared stroke icon set (24x24 grid). Decorative by default (aria-hidden).
function Icon({ size = 20, fill = 'none', strokeWidth = 2, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

export const UserIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </Icon>
);

export const CartIcon = (p) => (
  <Icon {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
    <circle cx="10" cy="20.5" r="1.3" />
    <circle cx="18" cy="20.5" r="1.3" />
  </Icon>
);

export const MenuIcon = (p) => (
  <Icon {...p}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </Icon>
);

export const CloseIcon = (p) => (
  <Icon {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Icon>
);

export const HeartIcon = ({ filled = false, ...p }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
);

export const StarIcon = (p) => (
  <Icon {...p} fill="currentColor" strokeWidth={1}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

export const MinusIcon = (p) => (
  <Icon {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

export const PhoneIcon = (p) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

export const MailIcon = (p) => (
  <Icon {...p}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Icon>
);

export const PinIcon = (p) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

export const FacebookIcon = (p) => (
  <Icon {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </Icon>
);

export const InstagramIcon = (p) => (
  <Icon {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Icon>
);

export const XIcon = (p) => (
  <Icon {...p}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </Icon>
);

export const YouTubeIcon = (p) => (
  <Icon {...p}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </Icon>
);

export const BagIcon = (p) => (
  <Icon {...p}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Icon>
);

export const ImageIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </Icon>
);

export const ArrowRightIcon = (p) => (
  <Icon {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
);

export const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);

export const CheckCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
  </Icon>
);

export const TrashIcon = (p) => (
  <Icon {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Icon>
);

export const FilterIcon = (p) => (
  <Icon {...p}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="9" cy="6" r="2" fill="currentColor" />
    <circle cx="15" cy="12" r="2" fill="currentColor" />
    <circle cx="8" cy="18" r="2" fill="currentColor" />
  </Icon>
);

/* Category icons */
export const GrainIcon = (p) => (
  <Icon {...p}>
    <path d="M12 22V9" />
    <path d="M12 4c1.6 1.2 1.6 3.4 0 4.8-1.6-1.4-1.6-3.6 0-4.8z" />
    <path d="M12 12c-2.4 0-3.8-1.6-3.8-3.8 2.4 0 3.8 1.6 3.8 3.8z" />
    <path d="M12 12c2.4 0 3.8-1.6 3.8-3.8-2.4 0-3.8 1.6-3.8 3.8z" />
    <path d="M12 17c-2.4 0-3.8-1.6-3.8-3.8 2.4 0 3.8 1.6 3.8 3.8z" />
    <path d="M12 17c2.4 0 3.8-1.6 3.8-3.8-2.4 0-3.8 1.6-3.8 3.8z" />
  </Icon>
);

export const FruitVegIcon = (p) => (
  <Icon {...p}>
    <path d="M12 7.5c-1.6-1.4-5.4-1.6-6.8 1.6-1.4 3.2-.2 7.6 1.8 10.4 1.2 1.6 2.8 1.6 5 .6 2.2 1 3.8 1 5-.6 2-2.8 3.2-7.2 1.8-10.4-1.4-3.2-5.2-3-6.8-1.6z" />
    <path d="M12 7.5c0-2 1-3.6 2.6-4.5" />
    <path d="M14.6 3c1.6-.2 2.8.4 3.4 1.6-1.6.4-2.8-.2-3.4-1.6z" />
  </Icon>
);

export const SpiceIcon = (p) => (
  <Icon {...p}>
    <path d="M17.2 7.6c3 3.8 2 9-3 11.6-4.4 2.2-8.6 1.4-10.2.4 5.2.2 8-3.2 9-7 .8-3 2.6-4.6 4.2-5z" />
    <path d="M17.2 7.6c.2-1.8 1.2-3 2.6-3.6" />
    <path d="M13 13.5c-.6.9-1.4 1.6-2.4 2.2" />
  </Icon>
);

export const SnackIcon = (p) => (
  <Icon {...p}>
    <path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3.2 3.2 0 0 0 4 4 3.2 3.2 0 0 0 5 5z" />
    <circle cx="8.5" cy="10" r=".9" fill="currentColor" />
    <circle cx="12.5" cy="14.5" r=".9" fill="currentColor" />
    <circle cx="8" cy="15" r=".9" fill="currentColor" />
    <circle cx="16" cy="15" r=".9" fill="currentColor" />
  </Icon>
);

export const BeverageIcon = (p) => (
  <Icon {...p}>
    <path d="M4.5 9h11v5.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" />
    <path d="M15.5 10.5h1.6a2.4 2.4 0 0 1 0 4.8h-1.9" />
    <path d="M8 3.5c-.9 1 .9 1.8 0 2.8" />
    <path d="M12 3.5c-.9 1 .9 1.8 0 2.8" />
  </Icon>
);

export const HouseholdIcon = (p) => (
  <Icon {...p}>
    <path d="M9 10h6l1 2v8.2a1.3 1.3 0 0 1-1.3 1.3H9.3A1.3 1.3 0 0 1 8 20.2V12z" />
    <path d="M10 10V7h4v3" />
    <path d="M10 7h6.5l1.5-1.5" />
    <path d="M19.5 8h2M19.5 11h2M18.5 5h2" />
    <path d="M9.5 15.5h5" />
  </Icon>
);

export const FrozenIcon = (p) => (
  <Icon {...p}>
    <line x1="12" y1="2.5" x2="12" y2="21.5" />
    <line x1="3.8" y1="7.25" x2="20.2" y2="16.75" />
    <line x1="3.8" y1="16.75" x2="20.2" y2="7.25" />
    <polyline points="9.5 4.5 12 6.5 14.5 4.5" />
    <polyline points="9.5 19.5 12 17.5 14.5 19.5" />
  </Icon>
);

export const OilIcon = (p) => (
  <Icon {...p}>
    <path d="M10 2.5h4V5l2.2 3.2v12a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-12L10 5z" />
    <path d="M12 11.5c-1.6 2-2.2 3-2.2 4.1a2.2 2.2 0 0 0 4.4 0c0-1.1-.6-2.1-2.2-4.1z" />
  </Icon>
);

/* Trust strip icons */
export const ShieldCheckIcon = (p) => (
  <Icon {...p}>
    <path d="M12 2.8 20 6v5.4c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z" />
    <polyline points="8.5 12 11 14.5 15.8 9.5" />
  </Icon>
);

export const TruckIcon = (p) => (
  <Icon {...p}>
    <path d="M2 6.5h11.5v10H2z" />
    <path d="M13.5 10h4l3 3.2v3.3h-7" />
    <circle cx="6.5" cy="18" r="2" />
    <circle cx="16.5" cy="18" r="2" />
  </Icon>
);

export const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <line x1="12" y1="14.5" x2="12" y2="17" />
  </Icon>
);

export const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  x: XIcon,
  youtube: YouTubeIcon
};
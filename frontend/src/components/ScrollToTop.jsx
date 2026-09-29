import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// New page = start at the top (e.g. footer link -> long policy page). Back/forward keeps the browser's own scroll restoration.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
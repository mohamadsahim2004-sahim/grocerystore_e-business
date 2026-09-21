import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';

// Shared navigation helpers for Header and Footer.
// Home, cart, wishlist and checkout are state-driven at "/";
// the shop, product pages and everything else are normal routes (/shop, /products/:id).
export default function useStoreNav() {
  const { currentPage, setCurrentPage, setSearchQuery } = useContext(StoreContext);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const storeLinkProps = (page) => ({
    to: '/',
    onClick: () => setCurrentPage(page)
  });

  const getLinkProps = (link) => (link.page ? storeLinkProps(link.page) : { to: link.to });

  const onShop = pathname.startsWith('/shop');
  const isShopVisible = onShop || pathname.startsWith('/products');

  const isActive = (link) => {
    if (link.page === 'home') return pathname === '/' && currentPage === 'home';
    if (link.to === '/shop') return isShopVisible;
    return pathname === link.to;
  };

  // Header search: keeps the query in the shop URL (?q=) and always lands on the shop
  const searchShop = (value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(onShop ? search : '');
    if (value.trim()) params.set('q', value);
    else params.delete('q');
    params.delete('page');
    const query = params.toString();
    navigate(
      { pathname: onShop ? pathname : '/shop', search: query ? `?${query}` : '' },
      { replace: onShop }
    );
  };

  return { isActive, getLinkProps, storeLinkProps, searchShop };
}
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import QuantityControl from './QuantityControl';
import { HeartIcon, StarIcon, CartIcon, ImageIcon } from './Icons';

export default function ProductCard({ product }) {
  const {
    cart,
    addToCart,
    updateQuantity,
    wishlist,
    toggleWishlist,
    formatPrice
  } = useContext(StoreContext);

  const [imageFailed, setImageFailed] = useState(false);

  const productId = product?.id || product?._id;
  const detailsPath = productId ? `/products/${productId}` : '/shop';

  const isWishlisted = wishlist.some(
    (item) => (item.id || item._id) === productId
  );

  const cartItem = cart.find(
    (item) => (item.id || item._id) === productId
  );

  const price = Number(product?.price) || 0;
  const oldPrice = Number(product?.oldPrice) || 0;

  const hasDiscount = oldPrice > price;

  const discountPercent =
    product?.offerPercent ||
    (hasDiscount
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0);

  const hasStockInfo = typeof product?.stock === 'number';
  const outOfStock = hasStockInfo && product.stock <= 0;

  const handleWishlist = () => {
    if (!productId) return;
    toggleWishlist({
      ...product,
      id: productId
    });
  };

  const handleAddToCart = () => {
    if (!productId || outOfStock) return;

    addToCart(
      {
        ...product,
        id: productId
      },
      1
    );
  };

  const handleQuantityChange = (next) => {
    if (!cartItem) return;

    const currentQuantity = Number(cartItem.quantity) || 0;
    const delta = next - currentQuantity;

    if (delta !== 0) {
      updateQuantity(productId, delta);
    }
  };

  return (
    <article className="product-card">
      <div className="product-card__media">
        {outOfStock ? (
          <span className="product-card__badge product-card__badge--muted">
            Out of stock
          </span>
        ) : (
          hasDiscount && (
            <span className="product-card__badge">
              -{discountPercent}%
            </span>
          )
        )}

        <button
          type="button"
          className={`product-card__wish${
            isWishlisted ? ' is-active' : ''
          }`}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
        >
          <HeartIcon size={18} filled={isWishlisted} />
        </button>

        <Link
          to={detailsPath}
          className="product-card__image-link"
          aria-label={`View ${product.name}`}
        >
          {product?.image && !imageFailed ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span
              className="product-card__placeholder"
              aria-hidden="true"
            >
              <ImageIcon size={36} />
            </span>
          )}
        </Link>
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          {product?.origin ? (
            <span className="product-card__origin">
              {product.origin}
            </span>
          ) : (
            <span />
          )}

          {product?.rating ? (
            <span
              className="product-card__rating"
              aria-label={`Rated ${product.rating} out of 5`}
            >
              <StarIcon size={13} />
              {product.rating}
            </span>
          ) : null}
        </div>

        <h3 className="product-card__title">
          <Link to={detailsPath}>{product.name}</Link>
        </h3>

        {product?.unit && (
          <p className="product-card__unit">
            {product.unit}
          </p>
        )}

        <div className="product-card__price">
          <span className="product-card__price-current">
            {formatPrice(price)}
          </span>

          {hasDiscount && (
            <span className="product-card__price-old">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>

        <div className="product-card__actions">
          {outOfStock ? (
            <button
              type="button"
              className="btn btn-outline btn-block"
              disabled
            >
              Out of stock
            </button>
          ) : cartItem ? (
            <QuantityControl
              value={cartItem.quantity}
              min={0}
              max={
                hasStockInfo
                  ? Math.max(1, Math.min(product.stock, 99))
                  : 99
              }
              label={`${product.name} quantity`}
              onChange={handleQuantityChange}
            />
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleAddToCart}
            >
              <CartIcon size={16} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
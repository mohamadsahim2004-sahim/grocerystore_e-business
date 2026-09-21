import React from 'react';
import { MinusIcon, PlusIcon } from './Icons';

// Controlled stepper. onChange receives the next quantity.
// Use min={0} where decreasing to zero should remove the item.
export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
  label = 'Quantity'
}) {
  return (
    <div className={`qty-control qty-control--${size}`} role="group" aria-label={label}>
      <button
        type="button"
        className="qty-control__btn"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon size={16} />
      </button>
      <output className="qty-control__value" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="qty-control__btn"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import useCategories from '../hooks/useCategories';
import {
  GrainIcon,
  FruitVegIcon,
  SpiceIcon,
  SnackIcon,
  BeverageIcon,
  HouseholdIcon,
  FrozenIcon,
  OilIcon,
  BagIcon,
  AlertIcon
} from './Icons';

// Icons are only decoration; the category list itself always comes from the API.
const SLUG_ICONS = {
  'rice-grains': GrainIcon,
  'fruits-vegetables': FruitVegIcon,
  'spices-herbs': SpiceIcon,
  'snacks-sweets': SnackIcon,
  beverages: BeverageIcon,
  'household-care': HouseholdIcon,
  'frozen-foods': FrozenIcon,
  'oils-ghee': OilIcon
};

export default function CategoryTiles({ hideWhenEmpty = false }) {
  const { categories, loading, error, reload } = useCategories();

  if (loading) return <LoadingSpinner size="sm" label="Loading categories..." />;
  if (error) {
    return (
      <EmptyState
        icon={<AlertIcon size={32} />}
        title="We couldn't load the categories"
        message={error}
        action={{ label: 'Try again', onClick: reload }}
      />
    );
  }
  if (categories.length === 0) {
    if (hideWhenEmpty) return null;
    return <EmptyState title="No categories yet" message="Please check back soon." action={{ label: 'Browse the shop', to: '/shop' }} />;
  }

  return (
    <ul className="category-grid">
      {categories.map((category) => {
        const Icon = SLUG_ICONS[category.slug] || BagIcon;
        return (
          <li key={category._id || category.slug}>
            <Link to={`/shop/${category.slug}`} className="category-tile">
              <span className="category-tile__icon">
                <Icon size={30} />
              </span>
              <span className="category-tile__label">{category.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
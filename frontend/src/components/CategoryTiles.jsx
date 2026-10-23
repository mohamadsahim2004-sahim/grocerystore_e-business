import React, { useMemo } from 'react';
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
  AlertIcon,
  SproutIcon,
  PulsesIcon,
  CoconutIcon,
  MilkIcon,
  BreadIcon,
  FishIcon,
  MeatIcon,
  FlourIcon,
  CanIcon,
  NoodleIcon
} from './Icons';

// Icons are only decoration; the category list itself always comes from the API.
// Rules are checked in order against the category slug + name, so new categories
// added in the admin panel pick a sensible icon (and fall back to the bag icon).
const ICON_RULES = [
  [/\b(noodles?|pasta)\b/, NoodleIcon],
  [/\b(canned|tinned|packaged)\b/, CanIcon],
  [/\b(flour|baking)\b/, FlourIcon],
  [/\b(bakery|bread|pastr(y|ies)|short eats)\b/, BreadIcon],
  [/\b(meat|poultry|chicken|beef|mutton)\b/, MeatIcon],
  [/\b(fish|seafood|prawns?)\b/, FishIcon],
  [/\b(milk|dairy|cheese|yogh?urt)\b/, MilkIcon],
  [/\b(tea|coffee|beverages?|drinks?|juices?)\b/, BeverageIcon],
  [/\bcoconut\b/, CoconutIcon],
  [/\b(dhal|dal|pulses?|beans?|lentils?|legumes?)\b/, PulsesIcon],
  [/\b(rice|grains?|cereals?)\b/, GrainIcon],
  [/\bfruits?\b/, FruitVegIcon],
  [/\b(vegetables?|veggies|greens)\b/, SproutIcon],
  [/\b(spices?|seasonings?|herbs?|masala|curry)\b/, SpiceIcon],
  [/\b(snacks?|sweets?|confectionery|biscuits?|chocolates?)\b/, SnackIcon],
  [/\b(oils?|ghee|butter)\b/, OilIcon],
  [/\b(household|cleaning|care)\b/, HouseholdIcon],
  [/\bfrozen\b/, FrozenIcon]
];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function getCategoryIcon(category) {
  const text = `${normalize(category.slug)} ${normalize(category.name)}`;
  const match = ICON_RULES.find(([pattern]) => pattern.test(text));
  return match ? match[1] : BagIcon;
}

// The shop filters by slug, so a slug (or an identical name) can only be shown once.
function uniqueCategories(categories) {
  const seen = new Set();
  return categories.filter((category) => {
    const keys = [`slug:${normalize(category.slug)}`, `name:${normalize(category.name)}`];
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

export default function CategoryTiles({ hideWhenEmpty = false }) {
  const { categories, loading, error, reload } = useCategories();
  const items = useMemo(() => uniqueCategories(categories), [categories]);

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
  if (items.length === 0) {
    if (hideWhenEmpty) return null;
    return <EmptyState title="No categories yet" message="Please check back soon." action={{ label: 'Browse the shop', to: '/shop' }} />;
  }

  return (
    <ul className="category-grid">
      {items.map((category) => {
        const Icon = getCategoryIcon(category);
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
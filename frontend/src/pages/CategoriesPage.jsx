import React from 'react';
import { Link } from 'react-router-dom';
import CategoryTiles from '../components/CategoryTiles';

export default function CategoriesPage() {
  return (
    <div className="container page-section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Categories</span>
      </nav>
      <h1 className="page-title">Shop by Category</h1>
      <CategoryTiles />
    </div>
  );
}
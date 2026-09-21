import React from 'react';

// Builds [1, '...', 4, 5, 6, '...', 12]
function buildPages(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const result = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) result.push('gap-' + n);
    result.push(n);
  });
  return result;
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        Previous
      </button>

      <ul className="pagination__pages">
        {buildPages(page, pages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} className="pagination__gap" aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`pagination__btn pagination__num${item === page ? ' is-current' : ''}`}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="pagination__btn"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
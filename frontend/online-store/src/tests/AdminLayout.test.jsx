// AdminLayout.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '../pages/Admin/AdminLayout';

function renderWithRoute(initialPath = '/admin/products') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="products" element={<div>Products page</div>} />
          <Route path="categories" element={<div>Categories page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminLayout', () => {
  it('renders brand, nav links and outlet content', () => {
    renderWithRoute('/admin/products');

    // Brand
    expect(screen.getByText('TechZone')).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();

    // Nav links
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inventory & stock/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /deliveries/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /comment approval/i })).toBeInTheDocument();

    // Outlet content (child route)
    expect(screen.getByText(/products page/i)).toBeInTheDocument();
  });

  it('marks correct nav link as active based on route (via aria-current)', () => {
    renderWithRoute('/admin/categories');

    const categoriesLink = screen.getByRole('link', {
      name: /categories/i,
    });
    const productsLink = screen.getByRole('link', { name: /products/i });

    // react-router NavLink sets aria-current="page" on active link
    expect(categoriesLink).toHaveAttribute('aria-current', 'page');
    expect(productsLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('"Back to Store" link points to root route', () => {
    renderWithRoute('/admin/products');

    const backLink = screen.getByRole('link', { name: /back to store/i });
    expect(backLink).toHaveAttribute('href', '/');
  });
  it('shows footer with logged in label and placeholder', () => {
    renderWithRoute('/admin/products');

    expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    // current UI shows "Loading..." until role is fetched
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

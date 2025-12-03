// src/tests/App.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../App';

// helper: render AppContent with a given route
const renderAt = path =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>
  );

describe('App routing', () => {
  it('shows Navbar and Footer on home route', () => {
    renderAt('/');

    // Navbar: logo "TechZone" inside nav
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent(/techzone/i);

    // Footer: heading "About TechZone"
    const footerHeading = screen.getByRole('heading', {
      name: /about techzone/i,
    });
    expect(footerHeading).toBeInTheDocument();
  });

  it('renders auth page on /auth', () => {
    renderAt('/auth');

    // Auth card text from your DOM: "Welcome Back"
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});

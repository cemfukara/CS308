// src/tests/Auth.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Auth from '../pages/Auth';

const renderAuth = () =>
  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );

describe('Auth page', () => {
  it('renders login/register tabs and login form by default', () => {
    renderAuth();

    // There are TWO "Log In" buttons (tab + submit), take the FIRST as the tab
    const [loginTab] = screen.getAllByRole('button', { name: /log in/i });
    const registerTab = screen.getByRole('button', { name: /register/i });

    expect(loginTab).toBeInTheDocument();
    expect(registerTab).toBeInTheDocument();

    // default active tab should be "Log In"
    expect(loginTab.className).toMatch(/active/);
    expect(registerTab.className).not.toMatch(/active/);

    // login form fields
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('switches to register tab when clicked', async () => {
    renderAuth();

    const [loginTab] = screen.getAllByRole('button', { name: /log in/i });
    const registerTab = screen.getByRole('button', { name: /register/i });

    await userEvent.click(registerTab);

    // now Register should be active, Login inactive
    expect(registerTab.className).toMatch(/active/);
    expect(loginTab.className).not.toMatch(/active/);
  });
});

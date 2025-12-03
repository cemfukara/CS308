// src/tests/Cart.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Cart from '../pages/Cart';

// shared mock state for the fake store
const mockState = {
  cart: [],
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
};

// mock zustand hook used in Cart.jsx
vi.mock('../store/cartStore', () => ({
  __esModule: true,
  default: selector =>
    selector
      ? selector(mockState) // support useCartStore(state => state.xxx)
      : mockState, // support useCartStore()
}));

const renderCart = () =>
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );

describe('Cart page', () => {
  beforeEach(() => {
    mockState.cart = [];
    mockState.removeFromCart.mockReset();
    mockState.clearCart.mockReset();
  });

  it('shows empty message when cart is empty', () => {
    mockState.cart = [];

    renderCart();

    expect(screen.getByText(/your shopping cart/i)).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('renders cart items and calls removeFromCart when remove clicked', async () => {
    mockState.cart = [
      {
        product_id: 1,
        id: 1, // in case your component uses id
        name: 'Photon X1',
        price: 999.99,
        quantity: 1,
        image: 'photon.jpg',
      },
    ];

    renderCart();

    expect(screen.getByText(/photon x1/i)).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /remove/i });
    await userEvent.click(removeBtn);

    // your component probably calls removeFromCart with id or product_id
    expect(mockState.removeFromCart).toHaveBeenCalled();
  });

  it('calls clearCart when "Clear Cart" button is clicked', async () => {
    mockState.cart = [{ product_id: 1, name: 'A', price: 10, quantity: 1 }];

    renderCart();

    const clearBtn = screen.getByRole('button', { name: /clear cart/i });
    await userEvent.click(clearBtn);

    expect(mockState.clearCart).toHaveBeenCalled();
  });
});

import React from 'react';
import useCartStore from '../store/cartStore';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCartStore();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <p className="empty">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div className="cart-item" key={item.id}>
                <img
                  src={new URL(`../assets/${item.image}`, import.meta.url).href}
                  alt={item.name}
                />
                <div className="info">
                  <h3>{item.name}</h3>
                  <p>${item.price.toFixed(2)}</p>
                  <div className="quantity-control">
                    <p>Quantity:</p>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const value = e.target.value;
                        const parsed = parseInt(value);
                        updateQuantity(item.id, !parsed || parsed < 1 ? 1 : parsed);
                      }}
                    />
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Total: ${total.toFixed(2)}</h2>
            <button className="checkout-btn">Proceed to Checkout</button>
            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;

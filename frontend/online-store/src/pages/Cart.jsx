import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { toast } from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const navigate = useNavigate();

  // 🧮 Calculate total cost
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🧾 Handle checkout — login check, save order, clear cart
  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    // ✅ Require login before checkout
    if (!user) {
      toast.error('Please log in before placing an order.');
      navigate('/auth');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    // ✅ Create new order object
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      items: cart,
      total,
      status: 'processing',
    };

    // ✅ Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    // ✅ Clear cart and confirm success
    clearCart();
    toast.success('✅ Order placed successfully!');

    // ✅ Redirect to Order History
    navigate('/account/orders');
  };

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <p className="empty">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  src={new URL(`../assets/${item.image}`, import.meta.url).href}
                  alt={item.name}
                />

                <div className="info">
                  <h3>{item.name}</h3>
                  <p>${item.price.toFixed(2)}</p>

                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, Number(e.target.value))}
                    />
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>

                <button onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Total: ${total.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
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

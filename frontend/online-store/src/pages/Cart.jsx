import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { toast } from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const navigate = useNavigate();

  // 🧮 Calculate total cost
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

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
    navigate('/checkout');
    /*
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
    */
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
              <div key={item.product_id} className="cart-item">
                <img
                  src={
                    item.image
                      ? new URL(`../assets/${item.image}`, import.meta.url).href
                      : new URL('../assets/placeholder.jpg', import.meta.url).href
                  }
                  alt={item.name}
                />

                <div className="info">
                  <h3>{item.name}</h3>
                  <p>${Number(item.price || 0).toFixed(2)}</p>

                  <div className="quantity-control">
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e =>
                        updateQuantity(
                          item.product_id,
                          Math.min(Number(e.target.value), item.quantity_in_stock)
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product_id,
                          Math.min(item.quantity_in_stock, item.quantity + 1)
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <button onClick={() => removeFromCart(item.product_id)}>Remove</button>
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

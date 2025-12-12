import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';
import './Cart.css';
import { formatPrice } from '@/utils/formatPrice';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // 🧮 Calculate total cost
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  // 🧾 Handle checkout — login check, save order, clear cart
  const handleCheckout = () => {
    if (!user) {
      toast.error('Please log in to proceed to checkout.');
      navigate('/auth');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <p className="empty">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => {
              const placeholder = new URL('../assets/placeholder.jpg', import.meta.url).href;
              const imageSrc = item.product_images?.[0]?.image_url || placeholder;
              
              return (
              <div key={item.product_id} className="cart-item">
                <img
                  src={imageSrc}
                  alt={item.name}
                />

                <div className="info">
                  <h3>{item.name}</h3>
                  <p>{formatPrice(item.price, item.currency)}</p>

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
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>Total: {formatPrice(total, cart[0]?.currency)}</h3>
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

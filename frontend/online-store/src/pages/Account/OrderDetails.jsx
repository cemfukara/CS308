import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useCartStore from '@/store/cartStore';
import './OrderDetails.css';
import { getOrderById } from '@/lib/ordersApi';
import { formatPrice } from '@/utils/formatPrice';
import { api } from '@/lib/api'; 

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isRefundMode, setIsRefundMode] = useState(false); // Controls visibility of checkboxes/expanded view
  const [selectedKeys, setSelectedKeys] = useState(new Set()); // Tracks selected items (using unique keys)
  
  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const navigate = useNavigate();
  const { addToCart } = useCartStore();

  useEffect(() => {
    let mounted = true;
    fetchOrder(mounted);
    return () => { mounted = false; };
  }, [id]);

  const fetchOrder = async (mounted) => {
    try {
      const res = await getOrderById(id);
      if (!mounted) return;
      const ord = res.order ?? null;
      const items = res.items ?? [];
      setOrder({ ...ord, items });
    } catch (err) {
      console.error(err);
      if (!mounted) return;
      setOrder(null);
    }
  };

  // Helper: Create unique key for expanded items (e.g., "105_0", "105_1")
  const getExpandedKey = (itemId, index) => `${itemId}_${index}`;

  const toggleSelection = (key) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleRefundClick = () => {
    if (selectedKeys.size === 0) {
      toast.error("Please select items to refund.");
      return;
    }
    setRefundReason(""); // Reset reason
    setShowRefundModal(true);
  };

  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error("Please enter a reason for the refund.");
      return;
    }

    setIsSubmittingRefund(true);

    // 1. Aggregate selections: Count how many units of each item are selected
    const refundsMap = {}; // { orderItemId: quantity }
    
    selectedKeys.forEach(key => {
      const [itemId] = key.split('_'); 
      refundsMap[itemId] = (refundsMap[itemId] || 0) + 1;
    });

    // 2. Send requests sequentially
    let successCount = 0;
    let errorOccurred = false;

    for (const [itemId, qty] of Object.entries(refundsMap)) {
      try {
        await api.post('/refunds/request', {
          orderId: order.order_id,
          orderItemId: itemId,
          quantity: qty,
          reason: refundReason
        });
        successCount += qty;
      } catch (err) {
        console.error(err);
        errorOccurred = true;
        toast.error(err.response?.data?.message || "Error processing refund.");
      }
    }

    setIsSubmittingRefund(false);

    if (successCount > 0) {
      if (!errorOccurred) {
        toast.success(`Refund requested for ${successCount} item(s).`);
      } else {
        toast('Some refunds were requested successfully, but errors occurred for others.', { icon: '⚠️' });
      }
      setIsRefundMode(false);
      setSelectedKeys(new Set());
      setShowRefundModal(false);
      fetchOrder(true); // Refresh data
    }
  };

  const handleRepurchase = async (item) => {
    await addToCart({
      product_id: item.product_id,
      name: item.name,
      model: item.model,
      price: Number(item.price_at_purchase || 0),
      quantity: 1,
    });
    toast.success("Added to cart");
  };

  if (!order) return <div className="order-details-page"><p>Loading...</p></div>;

  // Logic: Show "Request Refund" button if eligible
  const orderStatusLower = order.status?.toLowerCase() || '';
  const isEligibleTime = (new Date() - new Date(order.order_date)) / (1000 * 3600 * 24) <= 30;
  
  const isVisibleStatus = [
    'delivered', 
    'refund request sent', 
    'refund accepted', 
    'refund rejected'
  ].includes(orderStatusLower);

  const isLockedStatus = [
    'refund request sent', 
    'refund accepted', 
    'refund rejected'
  ].includes(orderStatusLower);

  const canShowRefundButton = isVisibleStatus && isEligibleTime;

  // --- ITEM RENDERING LOGIC ---
  let visibleItems = [];

  if (isRefundMode) {
    visibleItems = order.items.flatMap(item => {
      const totalQty = item.quantity || 1;
      const refundedQty = Number(item.refunded_quantity || 0);

      return Array.from({ length: totalQty }).map((_, idx) => ({
        ...item,
        uniqueKey: getExpandedKey(item.order_item_id, idx),
        isAlreadyRefunded: idx < refundedQty, 
        displayIndex: idx + 1
      }));
    });
  } else {
    visibleItems = order.items;
  }

  let displayOrderStatus = order.status;
  if (['Refund Accepted', 'Refund Rejected'].includes(order.status)) {
    displayOrderStatus = 'Delivered';
  }

  return (
    <div className="order-details-page">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="back-btn" onClick={() => navigate('/account/orders')}>← Back to Orders</button>
        
        {/* Toggle Refund Mode Button */}
        {canShowRefundButton && !isRefundMode && (
          <button 
            className="refund-btn"
            onClick={() => setIsRefundMode(true)}
            disabled={isLockedStatus}
            style={{ 
              background: isLockedStatus ? '#9ca3af' : '#e11d48',
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              cursor: isLockedStatus ? 'not-allowed' : 'pointer',
              opacity: isLockedStatus ? 0.7 : 1
            }}
          >
            {orderStatusLower === 'refund request sent' && 'Refund Request Pending'}
            {orderStatusLower === 'refund accepted' && 'Refund Request Concluded'}
            {orderStatusLower === 'refund rejected' && 'Refund Request Concluded'}
            {orderStatusLower === 'delivered' && 'Request Refund / Return'}
          </button>
        )}

        {/* Action Buttons inside Refund Mode */}
        {isRefundMode && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="cancel-btn"
              style={{ background: '#6b7280', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              onClick={() => { setIsRefundMode(false); setSelectedKeys(new Set()); }}
            >
              Cancel
            </button>
            <button 
              className="submit-refund-btn"
              style={{ background: '#e11d48', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              onClick={handleRefundClick} // Changed from handleRefundSubmit to handleRefundClick
            >
              Request Refund ({selectedKeys.size})
            </button>
          </div>
        )}
      </div>

      <div className="order-details-card">
        <h2>
          Order #{order.order_id} 
          {isRefundMode && <span style={{ color: '#e11d48', marginLeft: '10px', fontSize: '0.8em' }}>(Select items to return)</span>}
        </h2>
        <p style={{ marginBottom: '20px' }}>Status: <strong>{displayOrderStatus}</strong></p>

        <div className="order-items">
          {visibleItems.map(item => {
            const isSelected = isRefundMode && selectedKeys.has(item.uniqueKey);
            const isRefunded = isRefundMode && item.isAlreadyRefunded;
            
            const displayPrice = isRefundMode 
              ? Number(item.price_at_purchase) 
              : Number(item.price_at_purchase) * (item.quantity || 1);

            const requestedQty = Number(item.refund_requested_qty || 0);
            const approvedQty = Number(item.refund_approved_qty || 0);
            const rejectedQty = Number(item.refund_rejected_qty || 0);

            const refundStatusParts = [];
            if (requestedQty > 0) refundStatusParts.push(`Refund Pending: ${requestedQty}`);
            if (approvedQty > 0) refundStatusParts.push(`Refund Accepted: ${approvedQty}`);
            if (rejectedQty > 0) refundStatusParts.push(`Refund Rejected: ${rejectedQty}`);

            return (
              <div 
                className="order-item-row" 
                key={isRefundMode ? item.uniqueKey : item.order_item_id}
                style={{
                   border: isSelected ? '2px solid #e11d48' : '1px solid #eee',
                   background: isRefunded ? '#f3f4f6' : (isSelected ? '#fff1f2' : 'white'),
                   opacity: isRefunded ? 0.6 : 1,
                   transition: 'all 0.2s'
                }}
              >
                {isRefundMode && (
                   <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
                     {isRefunded ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', background: '#ddd', padding: '2px 6px', borderRadius: '4px' }}>
                          REFUNDED
                        </span>
                     ) : (
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelection(item.uniqueKey)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#e11d48' }}
                        />
                     )}
                   </div>
                )}

                <div className="item-left">
                  <div className="item-info">
                    <h3>
                        {item.name} 
                        {isRefundMode && item.quantity > 1 && (
                          <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                             #{item.displayIndex}
                          </span>
                        )}
                    </h3>
                    <p className="item-desc">{item.model || 'Standard Model'}</p>
                    
                    {!isRefundMode && <p>Quantity: {item.quantity}</p>}
                    
                    {!isRefundMode && (
                      <button className="repurchase-btn" onClick={() => handleRepurchase(item)} style={{ marginTop: '10px' }}>
                        Repurchase
                      </button>
                    )}

                    {!isRefundMode && refundStatusParts.length > 0 && (
                      <div className="refund-status-breakdown" style={{ marginTop: '5px', fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                        {refundStatusParts.map((part, i) => (
                           <span key={i} style={{ marginRight: '15px', color: part.includes('Rejected') ? '#e11d48' : part.includes('Accepted') ? '#10b981' : '#f59e0b' }}>
                             {part}
                           </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="item-price">
                  <span className="price-current">{formatPrice(displayPrice, order.currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="address-section" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h4>Delivery Address</h4>
          <p>{order.shipping_address || 'Default Address'}</p>
        </div>
      </div>

      {/* Refund Message Modal */}
      {showRefundModal && (
        <div className="refund-modal-overlay">
          <div className="refund-modal">
            <h3>Request Refund</h3>
            <p>You are requesting a refund for <strong>{selectedKeys.size}</strong> item(s).</p>
            <p className="refund-subtitle">Please explain why you are returning these items:</p>
            
            <textarea 
              className="refund-textarea"
              placeholder="e.g. Item defective, arrived damaged, changed mind..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              autoFocus
            />

            <div className="refund-modal-actions">
              <button 
                className="cancel-btn modal-btn" 
                onClick={() => setShowRefundModal(false)}
                disabled={isSubmittingRefund}
              >
                Cancel
              </button>
              <button 
                className="submit-refund-btn modal-btn" 
                onClick={submitRefundRequest}
                disabled={isSubmittingRefund}
              >
                {isSubmittingRefund ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
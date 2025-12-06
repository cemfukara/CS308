// src/pages/sm/SMRevenue.jsx

import { useEffect, useState, useMemo } from 'react';
import styles from '../Admin.module.css';
import { Chart as ChartJS } from 'chart.js/auto'; // FIX FOR REACT 19
import { Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatPrice } from '@/utils/formatPrice';

export default function SMRevenue() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showProfitChart, setShowProfitChart] = useState(false);

  // --------------------------------------------------------
  // LOAD ORDERS FROM BACKEND
  // --------------------------------------------------------
  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, startDate, endDate]);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      const list = res?.orders ?? [];

      // For each order, fetch its items
      const ordersWithItems = await Promise.all(
        list.map(async o => {
          const details = await api.get(`/orders/${o.order_id}`);

          return {
            order_id: o.order_id,
            order_date: new Date(o.created_at), // FIXED DATE
            total_price: Number(o.total_price),
            items: details.items.map(it => ({
              quantity: it.quantity,
              price_at_purchase: Number(it.price_at_purchase),
              product_cost: Number(it.price_at_purchase) * 0.5, // Default cost = 50%
            })),
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error loading revenue data:', err);
    }
  };

  // --------------------------------------------------------
  // DATE FILTERING
  // --------------------------------------------------------
  const filterOrders = () => {
    const result = orders.filter(o => {
      if (!o.order_date) return false;

      const orderDate = o.order_date;
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      let afterStart = true;
      let beforeEnd = true;

      if (startDate) {
        const startDay = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        afterStart = orderDay >= startDay; // inclusive
      }

      if (endDate) {
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        beforeEnd = orderDay <= endDay; // inclusive
      }

      return afterStart && beforeEnd;
    });

    setFiltered(result);
  };

  // --------------------------------------------------------
  // REVENUE & PROFIT CALCULATIONS
  // --------------------------------------------------------
  const totalRevenue = filtered.reduce((sum, o) => sum + o.total_price, 0);

  const totalCost = filtered.reduce(
    (sum, o) => sum + o.items.reduce((s, item) => s + item.product_cost * item.quantity, 0),
    0
  );

  const totalProfit = totalRevenue - totalCost;

  // --------------------------------------------------------
  // CHART DATA (WITH FIXED DATE LABELS)
  // --------------------------------------------------------
  const revenueChartData = useMemo(
    () => ({
      labels: filtered.map(o => o.order_date.toLocaleDateString('en-GB')),
      datasets: [
        {
          label: 'Revenue',
          data: filtered.map(o => o.total_price),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.3)',
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    }),
    [filtered]
  );

  const profitChartData = useMemo(
    () => ({
      labels: filtered.map(o => o.order_date.toLocaleDateString('en-GB')),
      datasets: [
        {
          label: 'Profit',
          data: filtered.map(o => {
            const cost = o.items.reduce((s, it) => s + it.product_cost * it.quantity, 0);
            return o.total_price - cost;
          }),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.2)',
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    }),
    [filtered]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Revenue Dashboard</span>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Revenue Dashboard</h1>
      </div>

      {/* FILTERS */}
      <div className={styles.controlsRow}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>From:</label>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            className={styles.datePickerInput}
            wrapperClassName={styles.datePickerInput}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>To:</label>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            className={styles.datePickerInput}
            wrapperClassName={styles.datePickerInput}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>{formatPrice(totalRevenue, filtered[0]?.currency)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Cost</h3>
          <p className={styles.number}>{formatPrice(totalCost, filtered[0]?.currency)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Profit</h3>
          <p className={styles.number}>{formatPrice(totalProfit, filtered[0]?.currency)}</p>
        </div>
      </div>

      {/* CHART BUTTONS */}
      <div className={styles.chartButtonsRow}>
        <button
          className={styles.chartButton}
          onClick={() => {
            setShowRevenueChart(!showRevenueChart);
            setShowProfitChart(false);
          }}
        >
          {showRevenueChart ? 'Hide Revenue Chart' : 'View Revenue Chart'}
        </button>

        <button
          className={styles.chartButton}
          onClick={() => {
            setShowProfitChart(!showProfitChart);
            setShowRevenueChart(false);
          }}
        >
          {showProfitChart ? 'Hide Profit Chart' : 'View Profit Chart'}
        </button>
      </div>

      {/* REVENUE CHART */}
      {showRevenueChart && (
        <div className={styles.chartWrapper}>
          <h2>Revenue Over Time</h2>
          <div className={styles.chartFixed}>
            <Line data={revenueChartData} />
          </div>
        </div>
      )}

      {/* PROFIT CHART */}
      {showProfitChart && (
        <div className={styles.chartWrapper}>
          <h2>Profit Over Time</h2>
          <div className={styles.chartFixed}>
            <Line data={profitChartData} />
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Total Revenue</th>
              <th className={styles.th}>Total Cost</th>
              <th className={styles.th}>Profit</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {filtered.map(o => {
              const cost = o.items.reduce((s, it) => s + it.product_cost * it.quantity, 0);
              const profit = o.total_price - cost;

              return (
                <tr key={o.order_id} className={styles.tr}>
                  <td className={styles.td}>{o.order_date.toLocaleDateString('en-GB')}</td>
                  <td className={styles.td}>{formatPrice(o.total_price, o.currency)}</td>
                  <td className={styles.td}>{formatPrice(cost, o.currency)}</td>
                  <td className={styles.td}>{formatPrice(profit, o.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

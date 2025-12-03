import { useEffect, useState } from "react";
import styles from "./SMRevenue.module.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

/* --------------------------------------------
   TEMP MOCK API (REMOVE WHEN BACKEND IS READY)
--------------------------------------------- */
async function mockGetRevenue() {
  return [
    {
      order_id: 101,
      order_date: "2025-01-10",
      total_price: 1499.99,
      items: [
        {
          name: "Laptop X",
          quantity: 1,
          price_at_purchase: 1499.99,
          product_cost: 749.99,
        },
      ],
    },
    {
      order_id: 102,
      order_date: "2025-01-15",
      total_price: 899.49,
      items: [
        {
          name: "iPhone 14",
          quantity: 1,
          price_at_purchase: 899.49,
          product_cost: 449.75,
        },
      ],
    },
    {
      order_id: 103,
      order_date: "2025-01-20",
      total_price: 299.99,
      items: [
        {
          name: "Keyboard",
          quantity: 1,
          price_at_purchase: 299.99,
          product_cost: 150.0,
        },
      ],
    },
  ];
}

/* --------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */
export default function SMRevenue() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Chart toggles
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showProfitChart, setShowProfitChart] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, startDate, endDate]);

  const loadOrders = async () => {
    const data = await mockGetRevenue();
    setOrders(data);
  };

  const filterOrders = () => {
    const result = orders.filter((o) => {
      const date = o.order_date;
      const afterStart = startDate ? date >= startDate : true;
      const beforeEnd = endDate ? date <= endDate : true;
      return afterStart && beforeEnd;
    });

    setFiltered(result);
  };

  // ---- CALCULATIONS ----
  const totalRevenue = filtered.reduce((sum, o) => sum + o.total_price, 0);

  const totalCost = filtered.reduce(
    (sum, o) =>
      sum +
      o.items.reduce((s, item) => s + item.product_cost * item.quantity, 0),
    0
  );

  const totalProfit = totalRevenue - totalCost;

  // ---- CHART DATA: REVENUE ----
  const revenueChartData = {
    labels: filtered.map((o) => o.order_date),
    datasets: [
      {
        label: "Revenue",
        data: filtered.map((o) => o.total_price),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
      },
    ],
  };

  // ---- CHART DATA: PROFIT ----
  const profitChartData = {
    labels: filtered.map((o) => o.order_date),
    datasets: [
      {
        label: "Profit",
        data: filtered.map((o) => {
          const cost = o.items.reduce(
            (s, i) => s + i.product_cost * i.quantity,
            0
          );
          return o.total_price - cost;
        }),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.2)",
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        Sales Manager <span className={styles.separator}>/</span> Revenue Dashboard
      </div>

      <h1 className={styles.title}>Revenue Dashboard</h1>

      {/* ---------------- FILTER BAR ---------------- */}
      <div className={styles.controlsRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From:</label>
          <input
            type="date"
            value={startDate}
            className={styles.searchInput}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To:</label>
          <input
            type="date"
            value={endDate}
            className={styles.searchInput}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* ---------------- STAT CARDS ---------------- */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>${totalRevenue.toFixed(2)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Cost</h3>
          <p className={styles.number}>${totalCost.toFixed(2)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Profit</h3>
          <p className={styles.number}>${totalProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* ---------------- CHART BUTTONS ---------------- */}
      <div className={styles.chartButtonsRow}>
        <button
          className={styles.chartButton}
          onClick={() => {
            setShowRevenueChart(!showRevenueChart);
            setShowProfitChart(false);
          }}
        >
          {showRevenueChart ? "Hide Revenue Chart" : "View Revenue Chart"}
        </button>

        <button
          className={styles.chartButton}
          onClick={() => {
            setShowProfitChart(!showProfitChart);
            setShowRevenueChart(false);
          }}
        >
          {showProfitChart ? "Hide Profit Chart" : "View Profit Chart"}
        </button>
      </div>

      {/* ---------------- REVENUE CHART ---------------- */}
      {showRevenueChart && (
        <div className={styles.chartWrapper}>
          <h2>Revenue Over Time</h2>
          <div className={styles.chartFixed}>
            <Line data={revenueChartData} />
          </div>
        </div>
      )}

      {/* ---------------- PROFIT CHART ---------------- */}
      {showProfitChart && (
        <div className={styles.chartWrapper}>
          <h2>Profit Over Time</h2>
          <div className={styles.chartFixed}>
            <Line data={profitChartData} />
          </div>
        </div>
      )}

      {/* ---------------- TABLE ---------------- */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Revenue</th>
              <th>Total Cost</th>
              <th>Profit</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((o) => {
              const cost = o.items.reduce(
                (s, item) => s + item.product_cost * item.quantity,
                0
              );
              const profit = o.total_price - cost;

              return (
                <tr key={o.order_id}>
                  <td>{o.order_date}</td>
                  <td>${o.total_price.toFixed(2)}</td>
                  <td>${cost.toFixed(2)}</td>
                  <td>${profit.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

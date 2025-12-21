// src/pages/sm/SMRevenue.jsx

import { useEffect, useState, useMemo } from 'react';
import styles from '../Admin.module.css';
import { Chart as ChartJS } from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatPrice } from '@/utils/formatPrice';

export default function SMRevenue() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const toLocalISODate = (date) => {
    if (!date) return null;
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  };
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
  });

  const [chartData, setChartData] = useState([]);

  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showProfitChart, setShowProfitChart] = useState(false);
  const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  // --------------------------------------------------------
  // FETCH REVENUE SUMMARY (BACKEND)
  // --------------------------------------------------------
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) return;

    const fetchSummary = async () => {
      try {
        const start = toLocalISODate(startDate);
        const end = toLocalISODate(endDate);

        const res = await api.get(
          `/invoice/revenue?start=${start}&end=${end}`
        );

        setSummary({
          revenue: Number(res.revenue || 0),
          cost: Number(res.cost || 0),
          profit: Number(res.profit || 0),
        });
      } catch (err) {
        console.error('Failed to load revenue summary', err);
      }
    };

    fetchSummary();
  }, [startDate, endDate]);

  // --------------------------------------------------------
  // FETCH CHART DATA (BACKEND)
  // --------------------------------------------------------
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) return;

    const fetchChart = async () => {
      try {
        const start = toLocalISODate(startDate);
        const end = toLocalISODate(endDate);

        const res = await api.get(
          `/invoice/chart?start=${start}&end=${end}`
        );

        setChartData(res || []);
      } catch (err) {
        console.error('Failed to load revenue chart', err);
      }
    };

    fetchChart();
  }, [startDate, endDate]);

  // --------------------------------------------------------
  // CHART CONFIGS
  // --------------------------------------------------------
  const revenueChartData = useMemo(
    () => ({
      labels: chartData.map(d => d.day),
      datasets: [
        {
          label: 'Revenue',
          data: chartData.map(d => d.revenue),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.3)',
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    }),
    [chartData]
  );

  const profitChartData = useMemo(
    () => ({
      labels: chartData.map(d => d.day),
      datasets: [
        {
          label: 'Profit',
          data: chartData.map(d => d.profit),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.3)',
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
        },
      ],
    }),
    [chartData]
  );

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Revenue Dashboard</span>
      </div>

      <h1 className={styles.title}>Revenue Dashboard</h1>

      {/* DATE FILTERS */}
      <div className={styles.controlsRow}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>From:</label>
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            className={styles.datePickerInput}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>To:</label>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            className={styles.datePickerInput}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>{formatPrice(summary.revenue)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Cost</h3>
          <p className={styles.number}>{formatPrice(summary.cost)}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Profit</h3>
          <p className={styles.number}>{formatPrice(summary.profit)}</p>
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
              <th className={styles.th}>Revenue</th>
              <th className={styles.th}>Cost</th>
              <th className={styles.th}>Profit</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {chartData.map(d => (
              <tr key={d.day} className={styles.tr}>
                <td className={styles.td}>{formatDate(d.day)}</td>
                <td className={styles.td}>{formatPrice(d.revenue)}</td>
                <td className={styles.td}>{formatPrice(d.cost)}</td>
                <td className={styles.td}>{formatPrice(d.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
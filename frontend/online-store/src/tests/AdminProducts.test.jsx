// src/tests/AdminProducts.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import AdminProducts from '../pages/Admin/AdminProducts.jsx';

// mock productsApi used inside AdminProducts
vi.mock('../lib/productsApi', () => ({
  getAllProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

import { getAllProducts, deleteProduct } from '../lib/productsApi';

const mockProducts = [
  {
    product_id: 1,
    category_id: 1,
    name: 'Photon X1',
    model: 'P-X1-256',
    serial_number: 'SN-PX1-987A',
    price: 999.99,
    list_price: 999.99,
    discount_ratio: 0,
    quantity_in_stock: 5,
    warranty_status: '1 Year Manufacturer',
    distributor_info: 'Photon Devices',
  },
  {
    product_id: 2,
    category_id: 2,
    name: 'AeroBook Pro 16',
    model: 'ABP-16-M3',
    serial_number: 'SN-ABP16-456C',
    price: 2399.0,
    list_price: 2499.0,
    discount_ratio: 4,
    quantity_in_stock: 20,
    warranty_status: '2 Years Extended',
    distributor_info: 'Aero Computers',
  },
];

describe('AdminProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderAdminProducts() {
    return render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    );
  }

  it('loads and displays products in table', async () => {
    getAllProducts.mockResolvedValue({
      products: mockProducts,
      totalCount: mockProducts.length,
      currentPage: 1,
      limit: 10,
    });

    renderAdminProducts();

    expect(screen.getByRole('heading', { name: /product management/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Photon X1')).toBeInTheDocument();
      expect(screen.getByText('AeroBook Pro 16')).toBeInTheDocument();
    });

    // category badge text like "Category #1" should show
    expect(screen.getByText(/category #1/i)).toBeInTheDocument();
  });

  it('submits search and triggers a new fetch', async () => {
    getAllProducts
      .mockResolvedValueOnce({
        products: mockProducts,
        totalCount: mockProducts.length,
        currentPage: 1,
        limit: 10,
      })
      .mockResolvedValueOnce({
        products: [mockProducts[0]],
        totalCount: 1,
        currentPage: 1,
        limit: 10,
      });

    renderAdminProducts();

    await waitFor(() => {
      expect(screen.getByText('Photon X1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name or description/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'Photon');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(getAllProducts).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Photon X1')).toBeInTheDocument();
      expect(screen.queryByText('AeroBook Pro 16')).not.toBeInTheDocument();
    });
  });

  it('opens delete modal and deletes product on confirm', async () => {
    getAllProducts.mockResolvedValue({
      products: mockProducts,
      totalCount: mockProducts.length,
      currentPage: 1,
      limit: 10,
    });
    deleteProduct.mockResolvedValue({ message: 'Product deleted successfully' });

    renderAdminProducts();

    await waitFor(() => {
      expect(screen.getByText('Photon X1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    const deleteButtonsInDom = screen.getAllByRole('button', { name: /delete/i });
    const confirmBtn = deleteButtonsInDom[deleteButtonsInDom.length - 1];

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Photon X1')).not.toBeInTheDocument();
    });
  });

  it('closes delete modal on cancel without calling deleteProduct', async () => {
    getAllProducts.mockResolvedValue({
      products: mockProducts,
      totalCount: mockProducts.length,
      currentPage: 1,
      limit: 10,
    });

    renderAdminProducts();

    await waitFor(() => {
      expect(screen.getByText('Photon X1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      expect(deleteProduct).not.toHaveBeenCalled();
    });
  });
});

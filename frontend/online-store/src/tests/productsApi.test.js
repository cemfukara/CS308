// src/tests/productsApi.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as apiModule from '../lib/api';
import {
  getAllProducts,
  getProductsByCategory,
  getProductsById,
  deleteProduct,
} from '../lib/productsApi';

// We will spy on apiModule.api.get / apiModule.api.del
describe('productsApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getAllProducts builds correct query string with options', async () => {
    const getSpy = vi.spyOn(apiModule.api, 'get').mockResolvedValue([]);

    await getAllProducts({
      search: 'phone',
      category: 1,
      sortBy: 'price',
      sortOrder: 'DESC',
      page: 2,
      limit: 20,
    });

    expect(getSpy).toHaveBeenCalledWith(
      '/products?search=phone&category=1&sortBy=price&sortOrder=DESC&page=2&limit=20'
    );
  });

  it('getAllProducts uses plain /products when no options passed', async () => {
    const getSpy = vi.spyOn(apiModule.api, 'get').mockResolvedValue([]);

    await getAllProducts();

    expect(getSpy).toHaveBeenCalledWith('/products');
  });

  it('getProductsByCategory forwards to getAllProducts with category', async () => {
    const getSpy = vi.spyOn(apiModule.api, 'get').mockResolvedValue([]);

    await getProductsByCategory(5);

    expect(getSpy).toHaveBeenCalledWith('/products?category=5');
  });

  it('getProductsById hits /products/:id', async () => {
    const getSpy = vi.spyOn(apiModule.api, 'get').mockResolvedValue({});

    await getProductsById(10);

    expect(getSpy).toHaveBeenCalledWith('/products/10');
  });

  it('deleteProduct calls api.del with correct path', async () => {
    const delSpy = vi.spyOn(apiModule.api, 'del').mockResolvedValue({});

    await deleteProduct(7);

    expect(delSpy).toHaveBeenCalledWith('/products/7');
  });
});

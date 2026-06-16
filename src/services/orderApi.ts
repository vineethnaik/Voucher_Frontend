/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './apiClient';

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  voucherId: string;
  voucherTitle?: string;
  voucherProvider?: string;
  amount: number;
  utr?: string;
  upiLink: string;
  qrCodeData: string;
  paymentStatus: 'PENDING' | 'VERIFICATION_PENDING' | 'PAID' | 'REJECTED';
  voucherCode?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createOrder(token: string, voucherId: string): Promise<Order> {
  return apiFetch<Order>('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({ voucherId }),
  }, token);
}

export async function getOrderDetails(token: string, orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${orderId}`, {}, token);
}

export async function fetchMyOrders(token: string): Promise<Order[]> {
  return apiFetch<Order[]>('/api/orders/my-orders', {}, token);
}

export async function submitUtr(token: string, orderId: string, utr: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${orderId}/submit-utr`, {
    method: 'POST',
    body: JSON.stringify({ utr }),
  }, token);
}

// Admin Operations
export async function fetchAllOrdersAdmin(token: string): Promise<Order[]> {
  return apiFetch<Order[]>('/api/admin/orders', {}, token);
}

export async function fetchPendingOrdersAdmin(token: string): Promise<Order[]> {
  return apiFetch<Order[]>('/api/admin/orders/pending', {}, token);
}

export async function approveOrderAdmin(token: string, orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/admin/orders/${orderId}/approve`, {
    method: 'PUT',
  }, token);
}

export async function rejectOrderAdmin(token: string, orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/admin/orders/${orderId}/reject`, {
    method: 'PUT',
  }, token);
}

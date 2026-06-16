/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Voucher } from '../types';
import { apiFetch } from './apiClient';

export type VoucherInput = Omit<Voucher, 'id'>;

export async function fetchVouchers(): Promise<Voucher[]> {
  return apiFetch<Voucher[]>('/api/vouchers');
}

export async function createVoucher(token: string, voucher: VoucherInput): Promise<Voucher> {
  return apiFetch<Voucher>('/api/vouchers', {
    method: 'POST',
    body: JSON.stringify(voucher),
  }, token);
}

export async function updateVoucher(
  token: string,
  id: string,
  voucher: VoucherInput
): Promise<Voucher> {
  return apiFetch<Voucher>(`/api/vouchers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(voucher),
  }, token);
}

export async function deleteVoucher(token: string, id: string): Promise<void> {
  await apiFetch<void>(`/api/vouchers/${id}`, {
    method: 'DELETE',
  }, token);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Voucher } from '../types';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher as updateVoucherApi,
  deleteVoucher as deleteVoucherApi,
  VoucherInput,
} from '../services/voucherApi';
import {
  login,
  buildSession,
  getCurrentUser,
  isAdmin,
  UserSession,
} from '../services/authApi';
import {
  fetchAllOrdersAdmin,
  approveOrderAdmin,
  rejectOrderAdmin,
  Order,
} from '../services/orderApi';
import {
  Shield, Plus, Trash2, Pencil, ArrowLeft, LayoutGrid,
  DollarSign, Tag, FileText, ListChecks, Cloud, Save, X, Mail, Lock, Loader2,
  Check, XCircle, AlertCircle, Clock, Search, Calendar, User, Clipboard, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_SESSION_KEY = 'vpro_admin_session';

type VoucherProvider = Voucher['provider'];
type IconName = 'Cloud' | 'Server' | 'Shield' | 'Users' | 'Cpu' | 'Globe';

const PROVIDERS: VoucherProvider[] = ['AWS', 'Google Cloud', 'CompTIA', 'Salesforce', 'Azure'];
const ICONS: IconName[] = ['Cloud', 'Server', 'Shield', 'Users', 'Cpu', 'Globe'];

const emptyForm = (): VoucherInput => ({
  title: '',
  provider: 'AWS',
  iconName: 'Cloud',
  originalPrice: 0,
  discountPrice: 0,
  description: '',
  badge: '',
  requirements: [''],
});

function getStoredAdminSession(): UserSession | null {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

function saveAdminSession(session: UserSession): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function AdminPage() {
  const [adminSession, setAdminSession] = useState<UserSession | null>(() => getStoredAdminSession());
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState('admin@voucherpro.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Catalog state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [form, setForm] = useState<VoucherInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Orders verification state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [filterStatus, setFilterStatus] = useState<Order['paymentStatus'] | 'ALL'>('VERIFICATION_PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      const data = await fetchVouchers();
      setVouchers(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load vouchers.');
    } finally {
      setVouchersLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!adminSession?.token) return;
    setOrdersLoading(true);
    try {
      const data = await fetchAllOrdersAdmin(adminSession.token);
      setOrders(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [adminSession]);

  useEffect(() => {
    const verifySession = async () => {
      const stored = getStoredAdminSession();
      if (!stored?.token) {
        setAuthChecking(false);
        return;
      }

      try {
        const user = await getCurrentUser(stored.token);
        const session = buildSession({ ...user, token: stored.token });
        if (!isAdmin(session)) {
          clearAdminSession();
          setAdminSession(null);
          setIsAuthed(false);
          setAuthError('This account does not have admin access.');
        } else {
          saveAdminSession(session);
          setAdminSession(session);
          setIsAuthed(true);
        }
      } catch {
        clearAdminSession();
        setAdminSession(null);
        setIsAuthed(false);
      } finally {
        setAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (isAuthed) {
      if (activeTab === 'catalog') {
        loadVouchers();
      } else if (activeTab === 'orders') {
        loadOrders();
      }
    }
  }, [isAuthed, activeTab, loadVouchers, loadOrders]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);

    try {
      const auth = await login(email.trim(), password);
      const session = buildSession(auth);

      if (!isAdmin(session)) {
        setAuthError('Access denied. Admin credentials required.');
        return;
      }

      saveAdminSession(session);
      setAdminSession(session);
      setIsAuthed(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminSession(null);
    setIsAuthed(false);
    setPassword('');
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
  };

  const updateRequirement = (index: number, value: string) => {
    const next = [...form.requirements];
    next[index] = value;
    setForm({ ...form, requirements: next });
  };

  const addRequirement = () => {
    setForm({ ...form, requirements: [...form.requirements, ''] });
  };

  const removeRequirement = (index: number) => {
    if (form.requirements.length <= 1) return;
    setForm({ ...form, requirements: form.requirements.filter((_, i) => i !== index) });
  };

  const validateForm = (): boolean => {
    if (!form.title.trim()) {
      setFormError('Course name is required.');
      return false;
    }
    if (!form.badge.trim()) {
      setFormError('Exam badge / code is required.');
      return false;
    }
    if (!form.description.trim()) {
      setFormError('Description is required.');
      return false;
    }
    if (form.originalPrice <= 0 || form.discountPrice <= 0) {
      setFormError('Prices must be greater than zero.');
      return false;
    }
    if (form.discountPrice >= form.originalPrice) {
      setFormError('Discount price must be lower than original price.');
      return false;
    }
    const reqs = form.requirements.map((r) => r.trim()).filter(Boolean);
    if (reqs.length === 0) {
      setFormError('Add at least one prerequisite.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !adminSession?.token) return;

    const requirements = form.requirements.map((r) => r.trim()).filter(Boolean);
    const payload: VoucherInput = {
      ...form,
      title: form.title.trim(),
      badge: form.badge.trim(),
      description: form.description.trim(),
      requirements,
    };

    setIsSaving(true);
    setFormError('');

    try {
      if (editingId) {
        await updateVoucherApi(adminSession.token, editingId, payload);
        showToast('Voucher updated successfully.');
      } else {
        await createVoucher(adminSession.token, payload);
        showToast('Voucher added to the store.');
      }
      resetForm();
      await loadVouchers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save voucher.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setForm({
      title: voucher.title,
      provider: voucher.provider,
      iconName: voucher.iconName,
      originalPrice: voucher.originalPrice,
      discountPrice: voucher.discountPrice,
      description: voucher.description,
      badge: voucher.badge,
      requirements: voucher.requirements.length > 0 ? [...voucher.requirements] : [''],
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!adminSession?.token) return;
    if (!window.confirm(`Delete "${title}" from the voucher store?`)) return;

    try {
      await deleteVoucherApi(adminSession.token, id);
      if (editingId === id) resetForm();
      await loadVouchers();
      showToast('Voucher removed from the store.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete voucher.');
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!adminSession?.token) return;
    if (!window.confirm(`Approve payment for Order: ${orderId}? This generates and issues the Voucher Access Code.`)) return;

    setProcessingOrderId(orderId);
    try {
      await approveOrderAdmin(adminSession.token, orderId);
      showToast(`Order ${orderId} marked as PAID. Voucher code generated.`);
      loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!adminSession?.token) return;
    if (!window.confirm(`Reject payment verification for Order: ${orderId}?`)) return;

    setProcessingOrderId(orderId);
    try {
      await rejectOrderAdmin(adminSession.token, orderId);
      showToast(`Order ${orderId} marked as REJECTED.`);
      loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Filter orders based on status & search
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'ALL' || order.paymentStatus === filterStatus;
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.utr && order.utr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.userName && order.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0058be] animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-[#0058be]/10 text-[#0058be]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#191b23]">VoucherPro Admin</h1>
            <p className="text-sm text-[#424754]">Sign in with your admin account to manage vouchers & payments in MongoDB.</p>
          </div>

          {authError && (
            <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#191b23] block" htmlFor="admin-email">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@voucherpro.com"
                  className="w-full border border-[#c2c6d6]/50 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#005af2]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#191b23] block" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full border border-[#c2c6d6]/50 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#005af2]"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full bg-[#0058be] text-white font-semibold text-sm py-3 rounded-lg hover:bg-[#4648d4] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmittingAuth ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In to Admin'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Default admin: <span className="font-mono font-semibold">admin@voucherpro.com</span> / <span className="font-mono font-semibold">voucherpro-admin</span>
          </p>

          <a
            href="#/"
            className="block text-center text-sm font-semibold text-[#0058be] hover:underline"
          >
            ← Back to VoucherPro
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-sans text-[#191b23]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0058be] text-white px-6 py-3 rounded-full shadow-xl text-sm font-semibold"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-gradient-to-r from-[#0058be] via-[#4648d4] to-[#2170e4] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#ffddb8] text-xs font-bold uppercase tracking-widest mb-1">
              <Shield className="w-4 h-4" />
              Admin Management Console
            </div>
            <h1 className="text-2xl font-extrabold">VoucherPro Admin Panel</h1>
            <p className="text-white/80 text-sm mt-1">
              Control the discount voucher library and audit manual UPI payment transfers using transaction UTR codes.
            </p>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <a
              href="#/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-white/30 text-sm hover:bg-white/10 transition-all cursor-pointer bg-transparent text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Manage Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Payment Audit / Verification ({pendingCount})</span>
          </button>
        </div>

        {/* Tab 1: Manage Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-10">
            {/* Add / Edit Form */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingId ? (
                    <Pencil className="w-5 h-5 text-[#0058be]" />
                  ) : (
                    <Plus className="w-5 h-5 text-[#0058be]" />
                  )}
                  <h2 className="font-bold text-lg">
                    {editingId ? 'Edit Voucher' : 'Add New Voucher'}
                  </h2>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer bg-transparent border-none"
                  >
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {formError && (
                  <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Course Name *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. AWS Certified Solutions Architect - Associate"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Exam Badge / Code *
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="e.g. SAA-C03"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5" />
                      Provider *
                    </label>
                    <select
                      value={form.provider}
                      onChange={(e) => setForm({ ...form, provider: e.target.value as VoucherProvider })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2] bg-white"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Icon
                    </label>
                    <select
                      value={form.iconName}
                      onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2] bg-white"
                    >
                      {ICONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Original Price (INR) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.originalPrice || ''}
                      onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                      placeholder="150"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Discount Price (INR) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.discountPrice || ''}
                      onChange={(e) => setForm({ ...form, discountPrice: Number(e.target.value) })}
                      placeholder="75"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2]"
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Description *
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description of the certification and what it validates..."
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#005af2] resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" />
                      Prerequisites *
                    </label>
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="text-xs font-semibold text-[#0058be] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      + Add requirement
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.requirements.map((req, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => updateRequirement(idx, e.target.value)}
                          placeholder={`Prerequisite ${idx + 1}`}
                          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#005af2]"
                        />
                        {form.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRequirement(idx)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer bg-transparent"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0058be] text-white text-sm font-bold hover:bg-[#4648d4] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingId ? 'Save Changes' : 'Add to Store'}
                      </>
                    )}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer text-slate-700 bg-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Voucher List */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#0058be]" />
                <h2 className="font-bold text-lg">Current Catalog ({vouchers.length})</h2>
              </div>

              {vouchersLoading ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                  Loading catalog from MongoDB...
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                  No vouchers in the catalog yet. Add one above.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left">
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Badge</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map((v) => (
                          <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate" title={v.title}>
                              {v.title}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{v.badge}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{v.provider}</td>
                            <td className="px-4 py-3">
                              <span className="text-slate-400 line-through text-xs">₹{v.originalPrice}</span>
                              <span className="ml-2 font-bold text-[#0058be]">₹{v.discountPrice}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(v)}
                                  className="p-2 rounded-lg text-[#0058be] hover:bg-[#d8e2ff] transition-colors cursor-pointer bg-transparent border-none"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(v.id, v.title)}
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Payment Audit / Verification */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              {/* Filter controls */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  onClick={() => setFilterStatus('VERIFICATION_PENDING')}
                  className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    filterStatus === 'VERIFICATION_PENDING'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Pending Audit ({orders.filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length})
                </button>
                <button
                  onClick={() => setFilterStatus('PAID')}
                  className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    filterStatus === 'PAID'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Approved / Paid ({orders.filter(o => o.paymentStatus === 'PAID').length})
                </button>
                <button
                  onClick={() => setFilterStatus('REJECTED')}
                  className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    filterStatus === 'REJECTED'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Rejected ({orders.filter(o => o.paymentStatus === 'REJECTED').length})
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    filterStatus === 'PENDING'
                      ? 'bg-slate-600 border-slate-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Unpaid / Pending UTR ({orders.filter(o => o.paymentStatus === 'PENDING').length})
                </button>
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    filterStatus === 'ALL'
                      ? 'bg-[#0058be] border-[#0058be] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Transactions ({orders.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search order ID, UTR, user..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#005af2]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {ordersLoading ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                Loading orders from database...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                No orders match your filter criteria or search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => {
                  const isPendingAudit = order.paymentStatus === 'VERIFICATION_PENDING';
                  const isPaid = order.paymentStatus === 'PAID';
                  const isRejected = order.paymentStatus === 'REJECTED';
                  const isProcessing = processingOrderId === order.orderId;

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      {/* Left: Client & Order Details */}
                      <div className="space-y-3 w-full md:max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : isPendingAudit
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.paymentStatus === 'VERIFICATION_PENDING' ? 'PENDING AUDIT' : order.paymentStatus}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            ID: {order.orderId}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Customer Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.userName || 'Unknown User'}</span>
                            <span className="font-mono font-medium text-slate-400">({order.userEmail || order.userId})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800">{order.voucherTitle || 'Voucher Selection'}</span>
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{order.voucherProvider}</span>
                          </div>
                        </div>

                        {/* Payment Verification Information (UTR) */}
                        <div className="p-3 bg-[#f8fafc] border border-slate-200/60 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Submitted UTR Reference</span>
                            <span className="font-mono font-extrabold text-[#0058be] text-sm tracking-wide select-all">
                              {order.utr || 'NOT SUBMITTED YET'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Expected Credit Amount</span>
                            <span className="text-sm font-extrabold text-slate-800">₹{order.amount} INR</span>
                          </div>
                          {isPaid && order.voucherCode && (
                            <div className="w-full mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Generated Voucher Claim Code:</span>
                              <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 select-all">{order.voucherCode}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Action buttons (Approval / Rejection) */}
                      {isPendingAudit && (
                        <div className="flex sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
                          <button
                            onClick={() => handleApproveOrder(order.orderId)}
                            disabled={isProcessing}
                            className="flex-1 md:w-36 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve Payment</span>
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.orderId)}
                            disabled={isProcessing}
                            className="flex-1 md:w-36 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Reject & Void</span>
                          </button>
                        </div>
                      )}

                      {!isPendingAudit && (
                        <div className="text-xs font-semibold text-slate-400 select-none bg-slate-50 px-4 py-3 border border-slate-100 rounded-xl flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center">
                          {isPaid ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700">Audit Complete: Approved</span>
                            </>
                          ) : isRejected ? (
                            <>
                              <XCircle className="w-4 h-4 text-rose-500" />
                              <span className="text-rose-700">Audit Complete: Rejected</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>Awaiting Customer Payment</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Voucher } from '../types';
import { fetchVouchers } from '../services/voucherApi';
import {
  createOrder,
  fetchMyOrders,
  submitUtr,
  Order
} from '../services/orderApi';
import VoucherCard from './VoucherCard';
import ExamQuiz from './ExamQuiz';
import {
  LogOut, Tag, CheckCircle, Copy, Ticket,
  BookOpen, Trophy, ArrowRight, UserCheck, CreditCard, X, Sparkles, QrCode, AlertCircle, Clock, User, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  userEmail: string;
  userName: string;
  authToken: string;
  onLogout: () => void;
}

export default function Dashboard({ userEmail, userName, authToken, onLogout }: DashboardProps) {
  const [catalogVouchers, setCatalogVouchers] = useState<Voucher[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // Orders and history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const vouchers = await fetchVouchers();
      setCatalogVouchers(vouchers);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Failed to load vouchers.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const myOrders = await fetchMyOrders(authToken);
      setOrders(myOrders);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load order history.');
    } finally {
      setOrdersLoading(false);
    }
  }, [authToken]);

  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-vouchers' | 'practice-quiz' | 'profile'>('marketplace');

  useEffect(() => {
    loadOrders(); // Always load orders to filter the catalog and populate profile statistics
    if (activeTab === 'marketplace') {
      loadCatalog();
    }
  }, [activeTab, loadCatalog, loadOrders]);

  // Track exam quiz scores
  const [quizScores, setQuizScores] = useState<{ [examType: string]: number[] }>(() => {
    const saved = localStorage.getItem(`scores_${userEmail}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return {}; }
    }
    return { AWS: [3], 'Google Cloud': [] };
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedVoucherToBuy, setSelectedVoucherToBuy] = useState<Voucher | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'payment' | 'success'>('checkout');

  // Payment inputs & errors
  const [utrValue, setUtrValue] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  const handleClaimVoucherClick = (voucher: Voucher) => {
    setSelectedVoucherToBuy(voucher);
    setCheckoutStep('checkout');
    setActiveOrder(null);
    setUtrValue('');
    setUtrError('');
  };

  const handleCreateOrder = async () => {
    if (!selectedVoucherToBuy) return;
    setCreatingOrder(true);
    setUtrError('');
    try {
      const order = await createOrder(authToken, selectedVoucherToBuy.id);
      setActiveOrder(order);
      setCheckoutStep('payment');
    } catch (err) {
      setUtrError(err instanceof Error ? err.message : 'Failed to create payment order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (!utrValue.trim() || utrValue.trim().length < 8) {
      setUtrError('Please enter a valid UTR number (at least 8 characters).');
      return;
    }

    setSubmittingUtr(true);
    setUtrError('');
    try {
      const updatedOrder = await submitUtr(authToken, activeOrder.orderId, utrValue.trim());
      setActiveOrder(updatedOrder);
      setCheckoutStep('success');
      loadOrders(); // Refresh order history in background
      triggerToast('🎉 Payment submitted for manual verification.');
    } catch (err) {
      setUtrError(err instanceof Error ? err.message : 'Failed to submit UTR. Please check details.');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    triggerToast('📋 Promo code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResumePayment = (order: Order) => {
    // Resolve voucher from catalog or simulate
    const matchedVoucher = catalogVouchers.find(v => v.id === order.voucherId) || {
      id: order.voucherId,
      title: order.voucherTitle || 'Exam Voucher',
      discountPrice: order.amount,
      badge: order.voucherProvider || 'Certification'
    } as Voucher;

    setSelectedVoucherToBuy(matchedVoucher);
    setActiveOrder(order);
    setCheckoutStep(order.paymentStatus === 'PENDING' ? 'payment' : 'success');
    setUtrValue('');
    setUtrError('');
  };

  const handleScoreSave = (examType: 'AWS' | 'Google Cloud', score: number) => {
    const currentScores = quizScores[examType] || [];
    const nextScores = [...currentScores, score];
    const updatedScores = { ...quizScores, [examType]: nextScores };
    setQuizScores(updatedScores);
    localStorage.setItem(`scores_${userEmail}`, JSON.stringify(updatedScores));
    triggerToast(`⭐ Quiz recorded: You scored ${score}/5!`);
  };

  // Filter out vouchers that have a matching order with a PAID status
  const availableVouchers = catalogVouchers.filter(
    (voucher) => !orders.some(o => o.voucherId === voucher.id && o.paymentStatus === 'PAID')
  );

  // Compute stats
  const totalClaimed = orders.filter(o => o.paymentStatus === 'PAID').length;
  const pendingVerification = orders.filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length;
  const quizScoresList = Object.values(quizScores).flat() as number[];
  const avgQuizScore = quizScoresList.length > 0
    ? (quizScoresList.reduce((a: number, b: number) => a + b, 0) / quizScoresList.length).toFixed(1)
    : '5.0';

  const getStatusBadge = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>PAID</span>
          </span>
        );
      case 'VERIFICATION_PENDING':
        return (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>VERIFYING</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>UNPAID</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-sans text-[#191b23] flex flex-col">
      {/* Toast alert overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0058be] text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3.5 text-sm font-semibold whitespace-nowrap border border-white/20"
          >
            <Sparkles className="w-4 h-4 text-[#ffb95f]" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner & Gradient */}
      <header className="relative bg-gradient-to-r from-[#0058be] via-[#4648d4] to-[#2170e4] text-white overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-white/20 animate-pulse">
                <Ticket className="w-5 h-5 text-[#ffb95f]" />
              </span>
              <span className="text-sm font-bold uppercase tracking-widest text-[#ffddb8]">Professional Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">VoucherPro Dashboard</h1>
            <p className="text-white/80 text-sm max-w-xl">
              Accelerating careers through exclusive 100% verified certification vouchers, tools, and mock practice systems.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 pl-4 pr-4 rounded-2xl border border-white/20 shadow-md hover:bg-white/15 transition-all duration-300">
            {/* Round profile avatar on the corner */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ffb95f] to-[#ffddb8] animate-pulse blur-xs opacity-75"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4648d4] to-[#0058be] flex items-center justify-center font-black text-lg text-white border-2 border-white/40 shadow-inner uppercase relative z-10 transition-transform duration-300 hover:scale-105">
                {userName.substring(0, 2)}
              </div>
            </div>

            <div className="text-left space-y-1">
              <div className="font-extrabold text-sm leading-none flex items-center gap-1.5 text-white">
                <span>{userName}</span>
                <UserCheck className="w-3.5 h-3.5 text-[#ffb95f]" />
              </div>
              <div className="text-[11px] text-white/80 font-mono font-medium">{userEmail}</div>
              <button
                onClick={onLogout}
                className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0058be] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bento Grid Panel */}
      <section className="bg-white border-b border-slate-100 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#f2f3fd] rounded-2xl border border-slate-100 flex items-center gap-4 transition-all duration-300 shadow-xs cursor-default"
          >
            <div className="p-3 bg-[#0058be]/10 text-[#0058be] rounded-xl">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#424754] uppercase tracking-wider">Acquired Vouchers</div>
              <div className="text-2xl font-extrabold text-slate-900">{totalClaimed}</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#f2f3fd] rounded-2xl border border-slate-100 flex items-center gap-4 transition-all duration-300 shadow-xs cursor-default"
          >
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#424754] uppercase tracking-wider">Pending Audit</div>
              <div className="text-2xl font-extrabold text-amber-600">{pendingVerification}</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#f2f3fd] rounded-2xl border border-slate-100 flex items-center gap-4 transition-all duration-300 shadow-xs cursor-default"
          >
            <div className="p-3 bg-amber-100 text-[#825100] rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#424754] uppercase tracking-wider">Average Score</div>
              <div className="text-2xl font-extrabold text-[#825100]">{avgQuizScore} <span className="text-xs text-slate-500">/5</span></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#f2f3fd] rounded-2xl border border-slate-100 flex items-center gap-4 transition-all duration-300 shadow-xs cursor-default col-span-2 md:col-span-1"
          >
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#424754] uppercase tracking-wider">Total Quizzes</div>
              <div className="text-2xl font-extrabold text-purple-700">{quizScoresList.length} completed</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-6 sm:px-8 py-10 w-full space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Voucher Store</span>
          </button>
          <button
            onClick={() => setActiveTab('my-vouchers')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'my-vouchers'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Orders / Claimed ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('practice-quiz')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'practice-quiz'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-6 font-bold text-sm border-b-2 cursor-pointer transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#0058be] text-[#0058be]'
                : 'border-transparent text-[#424754] hover:text-[#191b23]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>
        </div>

        {/* Tab Panels */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === 'marketplace' && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#191b23]">Available Exam Vouchers</h2>
                  <p className="text-xs sm:text-sm text-[#424754]">
                    Unlock 100% genuine test slots with up to 50% discount codes instantly. Claim as many as you require.
                  </p>
                </div>

                {catalogLoading ? (
                  <div className="text-center py-16 text-sm text-slate-500">
                    Loading vouchers from server...
                  </div>
                ) : catalogError ? (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-sm text-red-600 font-medium">{catalogError}</p>
                    <button
                      onClick={loadCatalog}
                      className="px-4 py-2 bg-[#0058be] text-white text-xs font-semibold rounded-lg hover:bg-[#4648d4] cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : availableVouchers.length === 0 ? (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-16 bg-white border border-[#e1e2ec] rounded-3xl p-8 space-y-4 max-w-lg mx-auto shadow-xs"
                  >
                    <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600">
                      <Sparkles size={40} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">You're All Set!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2.5">
                        You have purchased all available exam vouchers on our store catalog. Check your copyable promo keys under the **My Orders** tab to register on PearsonVUE!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('my-vouchers')}
                      className="px-5 py-2.5 bg-[#0058be] text-white font-bold text-xs rounded-xl hover:bg-[#4648d4] transition-all cursor-pointer shadow-xs"
                    >
                      View My Vouchers
                    </button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableVouchers.map((voucher) => (
                      <motion.div 
                        key={voucher.id} 
                        whileHover={{ y: -4 }}
                        className="flex flex-col transition-all duration-300"
                      >
                        <VoucherCard
                          voucher={voucher}
                          isClaimed={false}
                          onClaim={handleClaimVoucherClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'my-vouchers' && (
              <motion.div
                key="my-vouchers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-1 flex flex-col sm:flex-row justify-between sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[#191b23]">Your Order History & Claim Codes</h2>
                    <p className="text-xs sm:text-sm text-[#424754]">
                      Follow payment verification status below. Once PAID, copy your discount codes for exam booking.
                    </p>
                  </div>
                  {orders.length > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full w-fit mt-1 sm:mt-0">
                      🛡️ Protected Account State
                    </span>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="text-center py-16 text-sm text-slate-500">
                    Loading your orders...
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-sm text-red-600 font-medium">{ordersError}</p>
                    <button
                      onClick={loadOrders}
                      className="px-4 py-2 bg-[#0058be] text-white text-xs font-semibold rounded-lg hover:bg-[#4648d4] cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[#e1e2ec] rounded-2xl space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400">
                      <Ticket size={40} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">No active claimed vouchers</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Visit the Voucher Store tab above to obtain special exam slots at up to 50% discount!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('marketplace')}
                      className="px-4 py-2 bg-[#0058be] text-white font-semibold text-xs rounded-lg hover:bg-[#4648d4] transition-all cursor-pointer"
                    >
                      Browse Store
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orders.map((order) => {
                      const isPaid = order.paymentStatus === 'PAID';
                      const isVerify = order.paymentStatus === 'VERIFICATION_PENDING';
                      const isPending = order.paymentStatus === 'PENDING';

                      return (
                        <motion.div
                          key={order.id}
                          whileHover={{ scale: 1.01 }}
                          className={`bg-white rounded-2xl border border-slate-100 overflow-hidden relative shadow-xs flex flex-col justify-between transition-all duration-300 ${
                            isPaid ? 'hover:shadow-md' : 'opacity-90'
                          }`}
                        >
                          <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            isPaid ? 'bg-emerald-500' : isVerify ? 'bg-amber-500' : 'bg-slate-400'
                          }`}></span>

                          <div className="p-6 pl-8 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusBadge(order.paymentStatus)}
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {order.orderId}</span>
                                </div>
                                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                                  {order.voucherTitle || 'Voucher purchase'}
                                </h3>
                              </div>
                              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold uppercase">
                                {order.voucherProvider || 'PRO'}
                              </span>
                            </div>

                            {/* Coupon Code or QR Code Resume Trigger */}
                            {isPaid ? (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">EXAM VOUCHER CODE</span>
                                  <span className="font-mono font-bold text-sm tracking-wide text-emerald-800 select-all">
                                    {order.voucherCode}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCopyCode(order.voucherCode || '')}
                                  className="p-2.5 rounded-lg bg-white text-emerald-600 hover:bg-emerald-100 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                                  title="Copy Promotion Code"
                                >
                                  {copiedCode === order.voucherCode ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Amount Due</span>
                                  <span className="text-sm font-bold text-slate-800">₹{order.amount} INR</span>
                                </div>
                                {order.utr && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-medium">Submitted UTR:</span>
                                    <span className="font-mono font-semibold text-slate-700">{order.utr}</span>
                                  </div>
                                )}
                                {isPending && (
                                  <button
                                    onClick={() => handleResumePayment(order)}
                                    className="w-full mt-2 py-2 bg-[#0058be] text-white font-bold rounded-lg text-xs hover:bg-[#4648d4] transition-colors cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Complete Payment / Submit UTR</span>
                                  </button>
                                )}
                                {isVerify && (
                                  <div className="pt-1.5 text-[11px] text-slate-500 leading-tight">
                                    ⏳ Verification is in progress. The administrator is cross-checking your bank statement/UPI transaction. Please check back later.
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-[10px] pt-1">
                              <div>
                                <span className="uppercase font-bold text-slate-400 tracking-wider block">CREATED AT</span>
                                <span className="font-semibold text-slate-700">
                                  {new Date(order.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="uppercase font-bold text-slate-400 tracking-wider block">LAST UPDATED</span>
                                <span className="font-semibold text-slate-700">
                                  {new Date(order.updatedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'practice-quiz' && (
              <motion.div
                key="practice-quiz"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                <ExamQuiz onScoreSave={handleScoreSave} />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Profile Cover & Main Info Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative group">
                  <div className="h-32 bg-gradient-to-r from-[#0058be] via-[#4648d4] to-[#2170e4] relative">
                    <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent"></div>
                  </div>

                  <div className="px-8 pb-8 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-10">
                    {/* Avatar with dynamic ring animation */}
                    <div className="relative shrink-0">
                      <div 
                        style={{ animationDuration: '6s' }}
                        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0058be] to-[#ffb95f] animate-spin blur-xs"
                      ></div>
                      <div className="w-24 h-24 rounded-full bg-white p-1 relative z-10 shadow-md">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4648d4] to-[#0058be] flex items-center justify-center font-black text-2xl text-white uppercase shadow-inner">
                          {userName.substring(0, 2)}
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="text-center md:text-left space-y-1.5 md:mb-2 flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{userName}</h2>
                        <span className="text-[10px] font-bold bg-[#0058be]/10 text-[#0058be] border border-[#0058be]/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit mx-auto md:mx-0">
                          Verified Candidate
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500 font-mono">{userEmail}</p>
                    </div>

                    {/* Role badge */}
                    <div className="md:mb-2 shrink-0">
                      <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Shield className="w-4 h-4 text-[#0058be]" />
                        <span>Role: Standard USER</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid stats and detail cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Detailed statistics */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 hover:shadow-sm transition-all duration-300"
                  >
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-[#ffb95f]" />
                      <span>Exam Progress</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                        <span>Total Vouchers Unlocked</span>
                        <span className="text-[#0058be] text-lg font-black">{totalClaimed}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                        <span>Pending Auditing</span>
                        <span className="text-amber-500 text-lg font-black">{pendingVerification}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                        <span>Mock Exams Passed</span>
                        <span className="text-purple-700 text-lg font-black">{quizScoresList.filter(s => s >= 4).length}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Practice performance details */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 hover:shadow-sm transition-all duration-300"
                  >
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span>Simulations Performance</span>
                    </h3>
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Average Test Score</span>
                          <span>{avgQuizScore} / 5</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(parseFloat(avgQuizScore) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Syllabus Covered</span>
                          <span>{totalClaimed > 0 ? '60%' : '10%'}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: totalClaimed > 0 ? '60%' : '10%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Account Information details */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 hover:shadow-sm transition-all duration-300"
                  >
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Account Metadata</span>
                    </h3>
                    <div className="space-y-3 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Database Registry</span>
                        <span className="text-slate-900 font-mono uppercase">MongoDB Atlas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Authorization Method</span>
                        <span className="text-slate-900 font-mono">HMAC JWT Token</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Portal Security</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">SSL Active</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* UPI Payment Flow Modal */}
      <AnimatePresence>
        {selectedVoucherToBuy && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0058be]" />
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    {checkoutStep === 'checkout' && 'Voucher Details'}
                    {checkoutStep === 'payment' && 'Scan & Pay UPI'}
                    {checkoutStep === 'success' && 'Verification Pending'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedVoucherToBuy(null);
                    setActiveOrder(null);
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Checkout Confirmation */}
              {checkoutStep === 'checkout' && (
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-[#f2f3fd] border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <span>SELECTION</span>
                      <span>{selectedVoucherToBuy.badge}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {selectedVoucherToBuy.title}
                    </h4>
                    <div className="pt-2 flex justify-between items-baseline font-bold">
                      <span className="text-xs text-slate-400">Platform rate:</span>
                      <span className="text-xl text-[#0058be]">₹{selectedVoucherToBuy.discountPrice} INR</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl flex gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Clicking "Initiate Order" will lock the coupon rate and generate your custom UPI Payment link/QR code. Manual auditing takes up to 12-24 hours.
                    </span>
                  </div>

                  {utrError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl font-medium">
                      ⚠️ {utrError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedVoucherToBuy(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder}
                      className="flex-1 py-2.5 rounded-xl bg-[#0058be] text-white text-xs font-bold hover:bg-[#4648d4] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {creatingOrder ? (
                        <span>Initiating...</span>
                      ) : (
                        <>
                          <span>Initiate Order</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Page with QR Code & UTR input */}
              {checkoutStep === 'payment' && activeOrder && (
                <form onSubmit={handleUtrSubmit} className="p-6 space-y-6">
                  {/* Order Details Banner */}
                  <div className="flex justify-between items-center text-xs bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Order ID</span>
                      <span className="text-slate-800 font-mono">{activeOrder.orderId}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Amount Due</span>
                      <span className="text-sm font-extrabold text-[#0058be]">₹{activeOrder.amount} INR</span>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-inner relative group">
                    <img
                      src={activeOrder.qrCodeData}
                      alt="UPI QR Code"
                      className="w-48 h-48 border border-slate-100 rounded-lg"
                    />
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-3 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#0058be]" />
                      <span>SCAN VIA ANY UPI APP (PhonePe, GPay, Paytm)</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2 text-xs">
                    <h5 className="font-bold text-[#0058be] uppercase tracking-wider">Payment Steps:</h5>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700 font-medium">
                      <li>Scan the QR code above or pay to the UPI address.</li>
                      <li>Pay the exact amount requested above.</li>
                      <li>Copy the 12-digit **UTR / Transaction Ref Number** from your payment receipt.</li>
                      <li>Enter that reference ID below to submit for manual approval.</li>
                    </ol>
                  </div>

                  {/* UTR Input Form */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                      Enter UPI Transaction Reference (UTR / Txn ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 614298172901"
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono text-[#191b23] focus:outline-none focus:border-[#005af2] focus:ring-1 focus:ring-[#005af2] tracking-wider"
                      value={utrValue}
                      onChange={(e) => setUtrValue(e.target.value)}
                      required
                    />
                  </div>

                  {utrError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl font-medium">
                      ⚠️ {utrError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoucherToBuy(null);
                        setActiveOrder(null);
                        loadOrders(); // Reload orders in background to show incomplete order
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 bg-white"
                    >
                      Pay Later
                    </button>
                    <button
                      type="submit"
                      disabled={submittingUtr}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {submittingUtr ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <span>Submit UTR Reference</span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Success Pending Verification */}
              {checkoutStep === 'success' && activeOrder && (
                <div className="p-6 space-y-6 text-center">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Clock size={32} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold text-base text-slate-800">Order Locked & Under Audit</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Thank you! Your order **{activeOrder.orderId}** with UTR Reference **{activeOrder.utr}** has been recorded successfully.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-normal bg-slate-50 border border-slate-200/50 p-3 rounded-lg max-w-sm mx-auto">
                      ⚠️ Payment verification is pending administrative review. We cross-reference statements manually. Once confirmed, your claim code will unlock instantly in the "My Orders" tab.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVoucherToBuy(null);
                      setActiveOrder(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0058be] text-white text-xs font-bold hover:bg-[#4648d4] transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="shrink-0 bg-white border-t border-slate-100 py-6 text-center text-xs text-[#424754]">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p>© 2026 VoucherPro Inc. All rights reserved. Accelerating cloud and professional success globally.</p>
          <a
            href="#/admin"
            className="inline-block text-[#0058be] font-semibold hover:underline"
          >
            Admin Panel
          </a>
        </div>
      </footer>
    </div>
  );
}

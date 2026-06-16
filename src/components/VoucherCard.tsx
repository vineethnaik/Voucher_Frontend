/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Voucher } from '../types';
import { Cloud, Server, Shield, Users, Cpu, Globe, CheckCircle } from 'lucide-react';

interface VoucherCardProps {
  voucher: Voucher;
  onClaim: (voucher: Voucher) => void;
  isClaimed: boolean;
}

const formatProviderColor = (provider: Voucher['provider']) => {
  switch (provider) {
    case 'AWS':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        accentBar: 'bg-amber-500',
        iconBg: 'bg-amber-100 text-amber-700',
      };
    case 'Google Cloud':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        accentBar: 'bg-blue-500',
        iconBg: 'bg-blue-100 text-blue-700',
      };
    case 'CompTIA':
      return {
        bg: 'bg-green-50 text-green-700 border-green-200',
        accentBar: 'bg-green-500',
        iconBg: 'bg-green-100 text-green-700',
      };
    case 'Salesforce':
      return {
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        accentBar: 'bg-cyan-500',
        iconBg: 'bg-cyan-100 text-cyan-700',
      };
    default:
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        accentBar: 'bg-purple-500',
        iconBg: 'bg-purple-100 text-purple-700',
      };
  }
};

const getProviderIcon = (name: string, size = 20) => {
  switch (name) {
    case 'Cloud':
      return <Cloud size={size} />;
    case 'Server':
      return <Server size={size} />;
    case 'Shield':
      return <Shield size={size} />;
    case 'Users':
      return <Users size={size} />;
    case 'Cpu':
      return <Cpu size={size} />;
    default:
      return <Globe size={size} />;
  }
};

export default function VoucherCard({ voucher, onClaim, isClaimed }: VoucherCardProps) {
  const styles = formatProviderColor(voucher.provider);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
      {/* Dynamic Left accent bar to create "VoucherPro" soft look */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.accentBar}`}></span>

      <div className="p-6 pl-8 space-y-4 flex-grow">
        {/* Row 1: Header Badge & Price Reduction */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${styles.bg}`}>
              {voucher.provider}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {voucher.badge}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 line-through block font-medium">
              ₹{voucher.originalPrice}
            </span>
            <span className="text-lg font-bold text-slate-900">
              ₹{voucher.discountPrice}
            </span>
          </div>
        </div>

        {/* Row 2: Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${styles.iconBg} shrink-0`}>
              {getProviderIcon(voucher.iconName, 18)}
            </div>
            <h4 className="font-bold text-sm text-slate-800 leading-snug group-hover:text-[#0058be] transition-colors">
              {voucher.title}
            </h4>
          </div>
          <p className="text-xs text-[#424754] leading-relaxed pl-8">
            {voucher.description}
          </p>
        </div>

        {/* Row 3: Requirements */}
        <div className="pl-8 pt-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prerequisites</div>
          <ul className="space-y-1 text-xs text-slate-600 font-medium">
            {voucher.requirements.map((req, rIdx) => (
              <li key={rIdx} className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#0058be] shrink-0 mt-0.5" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Buy Button */}
      <div className="px-6 pb-6 pl-8 pt-2">
        <button
          onClick={() => onClaim(voucher)}
          disabled={isClaimed}
          className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
            isClaimed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed flex items-center justify-center gap-1.5'
              : 'bg-[#0058be] text-white hover:bg-[#4648d4] shadow-xs hover:shadow-sm'
          }`}
        >
          {isClaimed ? (
            <>
              <span>Claimed Account-Wide</span>
            </>
          ) : (
            `Instantly Secure Voucher • ₹${voucher.discountPrice}`
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Award, Plus, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { login, register, buildSession, UserSession } from '../services/authApi';

interface AuthScreenProps {
  onAuthSuccess: (session: UserSession) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all core fields.');
      return;
    }
    if (!isSignIn && !fullName) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!isSignIn && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const auth = isSignIn
        ? await login(email.trim(), password)
        : await register(fullName.trim(), email.trim(), password);

      onAuthSuccess(buildSession(auth));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-[#f9f9ff] font-sans text-[#191b23]">
      {/* Left Side: Brand & Visuals (Hidden on smaller screens) */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#f2f3fd] overflow-hidden items-center justify-center p-16">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d8e2ff] via-[#f9f9ff] to-[#e1e0ff] opacity-60"></div>
        {/* Contextual Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            alt="Abstract tech background"
            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpOQf9LCDr4ISm2s8h9GgYeKfpDSCX4xvnK2LoIKrJevnCUQT8RJtJnR4f1MPzUBsYUQaCERZKmnAThiqUojqPyNmPtdw-Fa_DFpU7dlqbmhZPeI2ZN9LMv16bA-eIa6HGwEn2VVeerUVK2cMMJOhsLKhUjuop7UGc-Qlr8EZkNoSt7dvZBTeNbnPkBVVPNTHR-Bw6YTUMn4JySvFvwzFWSx5K18IOjqlO6_MHFYRakbd3qHA9fbA56qKUv9fboeyK5SbOLWQ6Rg"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#f2f3fd] via-[#f2f3fd]/40 to-transparent"></div>

        {/* Brand Messaging Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg space-y-6 text-center bg-[#ffffff]/80 backdrop-blur-md p-10 rounded-2xl border border-[#e1e2ec] shadow-md"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2170e4] text-[#fefcff] mb-2 shadow-lg">
            <Award className="w-8 h-8 font-bold" />
          </div>
          <h1 className="font-sans text-4xl font-bold tracking-tight text-[#191b23] leading-tight">
            Master Your Next Exam.
          </h1>
          <p className="font-sans text-lg text-[#424754]">
            Access premium certification vouchers and tools designed to accelerate your professional growth.
          </p>

          {/* Trust Indicators */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <div className="flex -space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-[#e1e0ff] border-2 border-white flex items-center justify-center text-[#07006c] font-semibold text-xs shadow-sm">
                JD
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ffddb8] border-2 border-white flex items-center justify-center text-[#2a1700] font-semibold text-xs shadow-sm">
                AS
              </div>
              <div className="w-10 h-10 rounded-full bg-[#d8e2ff] border-2 border-white flex items-center justify-center text-[#001a42] font-semibold text-xs shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
            </div>
            <span className="font-sans text-sm font-semibold text-[#424754]">
              Join 10,000+ professionals
            </span>
          </div>
        </motion.div>
      </section>

      {/* Right Side: Interaction Canvas (Form) */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#f9f9ff]">
        {/* Mobile Brand Logo */}
        <div className="absolute top-8 left-8 lg:hidden">
          <span className="text-2xl font-bold text-[#0058be] tracking-tight">VoucherPro</span>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-[#c2c6d6]/30"
        >
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="hidden lg:block text-2xl font-bold text-[#0058be] tracking-tight mb-4">
              VoucherPro
            </div>
            <h2 className="text-2xl font-bold text-[#191b23]">
              {isSignIn ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-[#424754]">
              {isSignIn ? 'Enter your details to access your dashboard.' : 'Sign up to accelerate your professional growth.'}
            </p>
          </div>

          {/* Action Toggle */}
          <div className="flex p-1 bg-[#e6e7f2] rounded-lg">
            <button
              onClick={() => {
                setIsSignIn(true);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-md font-semibold text-sm text-center transition-all duration-200 ${
                isSignIn
                  ? 'bg-white shadow-sm text-[#0058be] border border-[#c2c6d6]/20'
                  : 'text-[#424754] hover:text-[#191b23]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignIn(false);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-md font-semibold text-sm text-center transition-all duration-200 ${
                !isSignIn
                  ? 'bg-white shadow-sm text-[#0058be] border border-[#c2c6d6]/20'
                  : 'text-[#424754] hover:text-[#191b23]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Area */}
          <div className="space-y-5">
            <div className="p-3 text-xs bg-[#f2f3fd] text-[#424754] rounded-lg border border-[#c2c6d6]/30 font-medium text-center">
              Sign in with your email and password. Accounts are stored securely in MongoDB.
            </div>

            {/* Alert Message */}
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Traditional Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <div className="space-y-1 relative group">
                  <label className="text-sm font-semibold text-[#191b23] block" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] group-focus-within:text-[#0058be] transition-colors">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      className="w-full bg-white border border-[#c2c6d6]/50 rounded-lg pl-12 pr-4 py-3 text-sm text-[#191b23] focus:outline-none focus:border-[#005af2] focus:ring-4 focus:ring-[#005af2]/10 transition-all duration-200 placeholder:text-[#c2c6d6]"
                      id="fullName"
                      placeholder="Jane Doe"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 relative group">
                <label className="text-sm font-semibold text-[#191b23] block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] group-focus-within:text-[#0058be] transition-colors">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    className="w-full bg-white border border-[#c2c6d6]/50 rounded-lg pl-12 pr-4 py-3 text-sm text-[#191b23] focus:outline-none focus:border-[#005af2] focus:ring-4 focus:ring-[#005af2]/10 transition-all duration-200 placeholder:text-[#c2c6d6]"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 relative group">
                <label className="text-sm font-semibold text-[#191b23] block" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] group-focus-within:text-[#0058be] transition-colors">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    className="w-full bg-white border border-[#c2c6d6]/50 rounded-lg pl-12 pr-4 py-3 text-sm text-[#191b23] focus:outline-none focus:border-[#005af2] focus:ring-4 focus:ring-[#005af2]/10 transition-all duration-200 placeholder:text-[#c2c6d6]"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#c2c6d6] text-[#0058be] focus:ring-[#0058be] focus:ring-offset-0 w-4 h-4 bg-white transition-all cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#424754] group-hover:text-[#191b23] transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset link has been dispatched to your email address.")}
                  className="text-xs font-semibold text-[#0058be] hover:text-[#4648d4] hover:underline transition-all cursor-pointer bg-transparent border-none"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-2">
                <button
                  className="w-full bg-[#0058be] text-white font-semibold text-sm py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-[1px] hover:bg-[#4648d4] active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isSignIn ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignIn ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer within card */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-xs text-[#424754]">
              By continuing, you agree to our{' '}
              <a className="text-[#0058be] hover:underline" href="#">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="text-[#0058be] hover:underline" href="#">
                Privacy Policy
              </a>
              .
            </p>
            <a
              href="#/admin"
              className="inline-block text-xs font-semibold text-[#0058be] hover:underline"
            >
              Admin login →
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

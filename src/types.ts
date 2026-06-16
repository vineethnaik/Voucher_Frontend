/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Voucher {
  id: string;
  title: string;
  provider: 'AWS' | 'Google Cloud' | 'CompTIA' | 'Salesforce' | 'Azure';
  iconName: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
  badge: string;
  requirements: string[];
}

export interface UserVoucher {
  id: string;
  voucherId: string;
  voucher: Voucher;
  code: string;
  claimedAt: string;
  expiryDate: string;
  status: 'Active' | 'Used';
}

export interface QuizQuestion {
  id: string;
  examType: 'AWS' | 'Google Cloud';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  quizScores: { [examType: string]: number[] };
  claimedVouchers: UserVoucher[];
  userEmail: string;
  userName: string;
}

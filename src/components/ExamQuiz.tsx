/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { quizQuestions } from '../data/quizData';
import { QuizQuestion } from '../types';
import { Check, X, ArrowRight, RefreshCw, Award, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamQuizProps {
  onScoreSave: (examType: 'AWS' | 'Google Cloud', score: number) => void;
}

export default function ExamQuiz({ onScoreSave }: ExamQuizProps) {
  const [selectedExam, setSelectedExam] = useState<'AWS' | 'Google Cloud'>('AWS');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const filteredQuestions = quizQuestions.filter((q) => q.examType === selectedExam);
  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const handleSelectAnswer = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);

    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      onScoreSave(selectedExam, score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0));
    }
  };

  const handleResetQuiz = (examType?: 'AWS' | 'Google Cloud') => {
    if (examType) {
      setSelectedExam(examType);
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e1e2ec] p-6 space-y-6">
      {/* Header Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e2ec] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#d8e2ff] text-[#0058be]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#191b23]">Exam Simulator</h3>
            <p className="text-xs text-[#424754]">Test your readiness and unlock special vouchers.</p>
          </div>
        </div>

        <div className="inline-flex rounded-lg p-1 bg-[#e6e7f2]">
          <button
            onClick={() => handleResetQuiz('AWS')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              selectedExam === 'AWS' && !quizFinished
                ? 'bg-white text-[#0058be] shadow-sm'
                : 'text-[#424754] hover:text-[#191b23]'
            }`}
          >
            AWS Practice
          </button>
          <button
            onClick={() => handleResetQuiz('Google Cloud')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              selectedExam === 'Google Cloud' && !quizFinished
                ? 'bg-white text-[#0058be] shadow-sm'
                : 'text-[#424754] hover:text-[#191b23]'
            }`}
          >
            Google Cloud Practice
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!quizFinished ? (
          <motion.div
            key={`${selectedExam}-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Question Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#424754]">
                <span>Question {currentQuestionIndex + 1} of {filteredQuestions.length}</span>
                <span>{Math.round(((currentQuestionIndex) / filteredQuestions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0058be] to-[#4648d4] transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text */}
            <h4 className="text-base sm:text-lg font-medium text-[#191b23] leading-relaxed">
              {currentQuestion.question}
            </h4>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                let optionStyle = 'border-[#c2c6d6]/50 bg-white hover:bg-[#f2f3fd] hover:border-[#c2c6d6]';
                let iconToRender = null;

                if (selectedAnswer === idx) {
                  optionStyle = 'border-[#0058be] bg-[#d8e2ff]/30 text-[#001a42] ring-2 ring-[#0058be]/20';
                }

                if (isAnswerSubmitted) {
                  if (idx === currentQuestion.correctAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950';
                    iconToRender = <Check className="w-4 h-4 text-emerald-600 shrink-0" />;
                  } else if (selectedAnswer === idx) {
                    optionStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                    iconToRender = <X className="w-4 h-4 text-rose-600 shrink-0" />;
                  } else {
                    optionStyle = 'border-[#c2c6d6]/30 bg-white opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border shrink-0 ${
                        selectedAnswer === idx ? 'bg-[#0058be] text-white border-transparent' : 'border-[#c2c6d6] text-[#424754]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>
                    {iconToRender}
                  </button>
                );
              })}
            </div>

            {/* Action buttons / Explanation */}
            <div className="pt-2">
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full py-3 rounded-xl bg-[#0058be] text-white font-semibold text-sm hover:bg-[#4648d4] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Confirm Answer
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Explanatory notes */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 border border-[#e1e2ec] rounded-xl space-y-1"
                  >
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">EXPLANATION</span>
                    <p className="text-xs sm:text-sm text-[#424754] leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>

                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3 rounded-xl bg-[#0058be] text-white font-semibold text-sm hover:bg-[#4648d4] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex === filteredQuestions.length - 1 ? 'Finish Simulator' : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <div className="inline-flex p-4 rounded-full bg-[#ffddb8] text-[#825100] shadow-md animate-bounce">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-[#191b23]">Quiz Completed!</h4>
              <p className="text-sm text-[#424754] max-w-md mx-auto">
                Excellent effort in checking your technical skills. Scoring well helps build certified confidence.
              </p>
            </div>

            {/* Interactive Score Card */}
            <div className="bg-[#f2f3fd] border border-[#e1e2ec] max-w-xs mx-auto rounded-2xl p-6 shadow-xs">
              <div className="text-xs font-bold text-[#424754] uppercase tracking-wider">YOUR SCORE</div>
              <div className="text-5xl font-extrabold text-[#0058be] my-2">
                {score} <span className="text-2xl text-[#727785] font-normal">/ {filteredQuestions.length}</span>
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                {score >= 4 ? '🎉 Passed with Architect honors!' : '💡 A great stepping stone! Practice makes perfect.'}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
              <button
                onClick={() => handleResetQuiz()}
                className="flex-1 py-3 px-4 rounded-xl border border-[#c2c6d6] text-sm font-semibold hover:bg-[#ecedf7] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[#191b23]"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => handleResetQuiz(selectedExam === 'AWS' ? 'Google Cloud' : 'AWS')}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0058be] text-white text-sm font-semibold hover:bg-[#4648d4] transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Try {selectedExam === 'AWS' ? 'Google Cloud' : 'AWS'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

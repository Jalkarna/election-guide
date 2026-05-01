"use client"

/**
 * @module QuizEngine
 * Interactive civic literacy quiz with 10 ECI-sourced questions.
 *
 * Features:
 * - Per-question navigation dots
 * - Animated answer feedback (correct / incorrect)
 * - Results review with explanations
 * - Score tracking with percentage
 * - Accessible keyboard navigation
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, ChevronRight, RotateCcw, Trophy } from "lucide-react"
import { QUIZ_QUESTIONS, type QuizQuestion } from "@/lib/civic-data"

type AnswerState = "idle" | "correct" | "wrong"

interface QuizState {
  currentIndex: number
  answers: Record<number, number>
  answerState: AnswerState
  phase: "quiz" | "results"
}

/** Single question view with animated feedback */
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  answerState,
  selectedOption,
}: {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (optionIndex: number) => void
  answerState: AnswerState
  selectedOption: number | null
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--saffron)]/80">
          {question.topic}
        </span>
        <span className="text-xs text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <h3 className="mt-2 text-base font-semibold leading-snug sm:text-lg">
        {question.question}
      </h3>

      <div className="mt-5 space-y-2.5" role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index
          const isCorrect = index === question.correct
          let className =
            "group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all "

          if (answerState === "idle") {
            className += "border-border/50 bg-background/60 hover:border-[color:var(--saffron)]/40 hover:bg-[color:var(--saffron)]/5 active:scale-[0.99] cursor-pointer"
          } else if (isCorrect) {
            className += "border-emerald-500/50 bg-emerald-500/10 cursor-default"
          } else if (isSelected && !isCorrect) {
            className += "border-red-500/50 bg-red-500/10 cursor-default"
          } else {
            className += "border-border/30 bg-background/30 opacity-50 cursor-default"
          }

          return (
            <button
              key={index}
              onClick={() => answerState === "idle" && onAnswer(index)}
              disabled={answerState !== "idle"}
              className={className}
              aria-label={`Option ${index + 1}: ${option}`}
              aria-pressed={isSelected}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                isCorrect && answerState !== "idle"
                  ? "border-emerald-400 bg-emerald-400 text-white"
                  : isSelected && answerState !== "idle"
                  ? "border-red-400 bg-red-400 text-white"
                  : "border-border/60 bg-muted/50 text-muted-foreground group-hover:border-[color:var(--saffron)]/60"
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className={`${isCorrect && answerState !== "idle" ? "text-emerald-300" : isSelected && !isCorrect && answerState !== "idle" ? "text-red-300 line-through" : ""}`}>
                {option}
              </span>
              {isCorrect && answerState !== "idle" && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              )}
              {isSelected && !isCorrect && answerState !== "idle" && (
                <AlertCircle className="ml-auto h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {answerState !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className={`overflow-hidden rounded-xl border p-4 text-sm ${
              answerState === "correct"
                ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-200"
                : "border-red-500/20 bg-red-500/5 text-foreground"
            }`}
          >
            <p className="font-semibold mb-1">
              {answerState === "correct" ? "✓ Correct!" : "✗ Incorrect"}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">{question.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** Results screen with score and per-question review */
function ResultsScreen({
  score,
  total,
  answers,
  onRetry,
}: {
  score: number
  total: number
  answers: Record<number, number>
  onRetry: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const level =
    pct >= 90 ? { label: "Civic Expert", color: "text-emerald-400", emoji: "🏆" } :
    pct >= 70 ? { label: "Well Informed", color: "text-blue-400", emoji: "🎓" } :
    pct >= 50 ? { label: "Getting There", color: "text-[color:var(--saffron)]", emoji: "📚" } :
    { label: "Keep Learning", color: "text-muted-foreground", emoji: "🌱" }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--saffron)]/10 ring-2 ring-[color:var(--saffron)]/30 text-3xl">
          {level.emoji}
        </div>
        <div className={`text-4xl font-bold ${level.color}`}>{pct}%</div>
        <div className="mt-1 text-base font-semibold">{level.label}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {score} correct out of {total} questions
        </div>
      </div>

      <div className="mb-6 space-y-2">
        {QUIZ_QUESTIONS.map((q, i) => {
          const userAnswer = answers[q.id]
          const isCorrect = userAnswer === q.correct
          return (
            <div key={q.id} className={`flex items-start gap-3 rounded-xl border p-3 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/15 bg-red-500/4"}`}>
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium leading-snug">{q.question}</div>
                {!isCorrect && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Correct: <span className="text-emerald-400">{q.options[q.correct]}</span>
                  </div>
                )}
              </div>
              {isCorrect
                ? <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-400" />
                : <AlertCircle className="ml-auto h-4 w-4 shrink-0 text-red-400" />
              }
            </div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-semibold transition-all hover:bg-accent active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="https://voters.eci.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-5 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Trophy className="h-4 w-4" />
          Check your voter registration
        </a>
      </div>
    </motion.div>
  )
}

/** Top-level quiz orchestrator */
export function QuizEngine() {
  const [state, setState] = React.useState<QuizState>({
    currentIndex: 0,
    answers: {},
    answerState: "idle",
    phase: "quiz",
  })

  const currentQuestion = QUIZ_QUESTIONS[state.currentIndex]

  const handleAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === currentQuestion.correct
    setState(s => ({
      ...s,
      answers: { ...s.answers, [currentQuestion.id]: optionIndex },
      answerState: isCorrect ? "correct" : "wrong",
    }))
  }

  const handleNext = () => {
    const nextIndex = state.currentIndex + 1
    if (nextIndex >= QUIZ_QUESTIONS.length) {
      setState(s => ({ ...s, phase: "results" }))
    } else {
      setState(s => ({ ...s, currentIndex: nextIndex, answerState: "idle" }))
    }
  }

  const handleRetry = () => {
    setState({ currentIndex: 0, answers: {}, answerState: "idle", phase: "quiz" })
  }

  const score = Object.entries(state.answers).filter(
    ([id, ans]) => QUIZ_QUESTIONS.find(q => q.id === Number(id))?.correct === ans
  ).length

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-6">
      {/* Navigation dots */}
      {state.phase === "quiz" && (
        <div className="mb-6 flex items-center gap-1.5" role="navigation" aria-label="Question progress">
          {QUIZ_QUESTIONS.map((q, i) => {
            const answered = state.answers[q.id] !== undefined
            const isCorrect = state.answers[q.id] === q.correct
            const isCurrent = i === state.currentIndex
            return (
              <div
                key={q.id}
                className={`h-2 rounded-full transition-all ${
                  isCurrent ? "w-6 bg-[color:var(--saffron)]" :
                  answered && isCorrect ? "w-2 bg-emerald-500" :
                  answered ? "w-2 bg-red-500/70" :
                  "w-2 bg-muted"
                }`}
                aria-label={`Question ${i + 1}${isCurrent ? " (current)" : answered ? (isCorrect ? " (correct)" : " (incorrect)") : ""}`}
              />
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {state.phase === "quiz" ? (
          <div key="quiz">
            <QuestionCard
              question={currentQuestion}
              questionNumber={state.currentIndex + 1}
              totalQuestions={QUIZ_QUESTIONS.length}
              onAnswer={handleAnswer}
              answerState={state.answerState}
              selectedOption={state.answers[currentQuestion.id] ?? null}
            />

            {state.answerState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex justify-end"
              >
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-5 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {state.currentIndex < QUIZ_QUESTIONS.length - 1 ? "Next question" : "See results"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <ResultsScreen
            key="results"
            score={score}
            total={QUIZ_QUESTIONS.length}
            answers={state.answers}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

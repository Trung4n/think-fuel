import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'

export default function QuizPage() {
  const { user } = useAuth()
  const [question, setQuestion] = useState(null)
  const [fuel, setFuel] = useState(null)
  const [maxFuel, setMaxFuel] = useState(1000)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null) // {correct, explanation, rewardFuel, newFuel}
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function loadQuestion() {
    setLoading(true)
    setSelected(null)
    setResult(null)
    try {
      const [qRes, dRes] = await Promise.all([
        api.get(`/quiz/next/${user.id}`),
        api.get(`/students/${user.id}/dashboard`),
      ])
      setQuestion(qRes.data.data)
      setFuel(dRes.data.data.brainFuel)
      setMaxFuel(dRes.data.data.maxFuel)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuestion() }, [user.id])

  async function handleAnswer(choice) {
    if (selected || submitting) return
    setSelected(choice)
    setSubmitting(true)
    try {
      const res = await api.post('/quiz/submit', {
        userId: user.id,
        questionId: question.questionId,
        answer: choice,
      })
      const d = res.data.data
      setResult(d)
      if (d.newFuel !== undefined) setFuel(d.newFuel)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const diffColor = {
    easy: 'text-green-400 border-green-800',
    medium: 'text-amber-400 border-amber-800',
    hard: 'text-rose-400 border-rose-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">Loading question...</span>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">No questions available.</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Fuel bar */}
      {fuel !== null && (
        <div className="mb-6">
          <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
        </div>
      )}

      {/* Question card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">{question.topic}</span>
          <span
            className={`text-xs border px-2 py-0.5 rounded font-mono capitalize ${
              diffColor[question.difficulty] || 'text-gray-400 border-gray-700'
            }`}
          >
            {question.difficulty}
          </span>
        </div>
        <p className="text-sm text-white leading-relaxed">{question.question}</p>
      </div>

      {/* Choices */}
      <div className="space-y-2 mb-4">
        {question.choices?.map((choice, i) => {
          let cls = 'border-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
          if (selected) {
            if (choice === selected) {
              cls = result?.correct
                ? 'border-green-600 bg-green-950 text-green-300'
                : 'border-rose-600 bg-rose-950 text-rose-300'
            } else {
              cls = 'border-gray-800 text-gray-600 opacity-60'
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(choice)}
              disabled={!!selected || submitting}
              className={`w-full text-left px-4 py-3 bg-gray-900 border rounded-md text-sm transition-colors disabled:cursor-default ${cls}`}
            >
              <span className="text-gray-500 mr-2 font-mono">
                {String.fromCharCode(65 + i)}.
              </span>
              {choice}
            </button>
          )
        })}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`border rounded-md p-4 mb-4 text-sm ${
            result.correct
              ? 'border-green-800 bg-green-950 text-green-300'
              : 'border-rose-800 bg-rose-950 text-rose-300'
          }`}
        >
          <div className="font-medium mb-1">
            {result.correct ? 'Correct!' : 'Incorrect'}
            {result.correct && result.rewardFuel > 0 && (
              <span className="ml-2 text-cyan-400 font-mono text-xs">
                +{result.rewardFuel} fuel
              </span>
            )}
          </div>
          {result.explanation && (
            <p className="text-xs leading-relaxed opacity-80">{result.explanation}</p>
          )}
        </div>
      )}

      {result && (
        <button
          onClick={loadQuestion}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          Next Question
        </button>
      )}
    </div>
  )
}

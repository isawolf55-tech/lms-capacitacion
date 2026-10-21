'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ExerciseCard from '@/components/ExerciseCard';

export default function ModuleEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const { moduleId } = params as { moduleId: string };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/quiz/${moduleId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando evaluación:', err);
        setLoading(false);
      });
  }, [moduleId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Preparando tu evaluación de módulo...</p>
      </div>
    );
  }

  const moduleItem = data?.module;
  const exercises = data?.exercises || [];
  const config = data?.config;
  const userStats = data?.userStats;

  const handleAnswerSelect = (exId: string, optId: string) => {
    setAnswers((prev) => ({ ...prev, [exId]: optId }));
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < exercises.length) {
      if (!confirm(`Has respondido ${answeredCount} de ${exercises.length} preguntas. ¿Deseas enviar tu evaluación ahora?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${moduleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const resData = await res.json();
      setResult(resData);
    } catch (err) {
      console.error('Error enviando evaluación:', err);
      alert('Hubo un problema enviando tu evaluación. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Volver al Menú
        </Link>
        <span className="text-xs text-blue-400 font-semibold bg-blue-950/40 border border-blue-800/40 px-3 py-1 rounded-full">
          📝 EVALUACIÓN DE MÓDULO
        </span>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100">
          Evaluación: {moduleItem?.title}
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Para aprobar este módulo y desbloquear el siguiente, necesitas un mínimo de{' '}
          <strong className="text-slate-200">{config?.minScore || 80}%</strong> de aciertos.
        </p>

        {userStats?.bestScore > 0 && (
          <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between">
            <span className="text-slate-400">Mejor puntaje registrado:</span>
            <span className={`font-bold ${userStats.isPassed ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {userStats.bestScore}% {userStats.isPassed ? '(Aprobado ✅)' : '(No aprobado)'}
            </span>
          </div>
        )}
      </div>

      {/* Pantalla de Resultados si ya envió */}
      {result ? (
        <div className="space-y-6">
          <div
            className={`border rounded-2xl p-8 text-center shadow-2xl ${
              result.passed
                ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200'
                : 'bg-red-950/20 border-red-800/80 text-red-200'
            }`}
          >
            <div className="text-4xl mb-3">{result.passed ? '🎉' : '⚠️'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {result.passed ? '¡Módulo Aprobado!' : 'No alcanzaste el puntaje mínimo'}
            </h2>
            <p className="text-sm opacity-90 max-w-md mx-auto mb-6">
              {result.passed
                ? 'Has demostrado el dominio de las reglas de este módulo. El siguiente módulo ya está desbloqueado.'
                : `Obtuviste ${result.score}%. Se requiere al menos ${result.minScore}% para avanzar. Revisa tus errores y vuelve a intentarlo.`}
            </p>

            <div className="inline-flex items-center gap-6 bg-slate-950/60 px-6 py-3 rounded-2xl border border-slate-800/80 text-xs font-medium">
              <div>
                <div className="text-slate-400">Calificación</div>
                <div className="text-xl font-bold font-mono text-slate-100">{result.score}%</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-slate-400">Aciertos</div>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {result.correctCount} / {result.totalCount}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                ← Volver al Dashboard
              </Link>
              {!result.passed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  🔄 Reintentar Evaluación
                </button>
              )}
            </div>
          </div>

          {/* Desglose de Respuestas */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Desglose de Preguntas</h3>
            {result.breakdown.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border text-xs leading-relaxed ${
                  item.isCorrect
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : 'bg-red-950/10 border-red-900/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200 mb-2">
                  <span>Pregunta {idx + 1}: {item.questionText}</span>
                  <span>{item.isCorrect ? '✅ Correcta' : '❌ Incorrecta'}</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <div>Tu respuesta: <span className="text-slate-200">{item.selectedOption}</span></div>
                  {!item.isCorrect && (
                    <div>Respuesta correcta: <span className="text-emerald-400">{item.correctOption}</span></div>
                  )}
                </div>
                {item.explanation && (
                  <p className="mt-2 text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    💡 {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Formulario de Evaluación */
        <div className="space-y-8">
          {exercises.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
              No hay preguntas cargadas en la evaluación de este módulo.
            </div>
          ) : (
            exercises.map((ex: any, idx: number) => (
              <div key={ex.id} className="space-y-2">
                <div className="text-xs text-slate-500 font-mono">
                  Pregunta {idx + 1} de {exercises.length}
                </div>
                <ExerciseCard
                  exercise={ex}
                  isPractice={false}
                  showImmediateFeedback={false}
                  onAnswerSelected={handleAnswerSelect}
                  selectedOptionId={answers[ex.id]}
                />
              </div>
            ))
          )}

          {exercises.length > 0 && (
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Respondidas: {Object.keys(answers).length} de {exercises.length}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Calificando...' : 'Enviar Evaluación'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

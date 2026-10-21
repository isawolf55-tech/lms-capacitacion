'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExerciseCard from '@/components/ExerciseCard';

export default function FinalExamPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/final-exam')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando examen final:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Cargando Examen Final de Certificación...</p>
      </div>
    );
  }

  if (!data?.isUnlocked) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h1 className="text-2xl font-bold text-slate-100">Examen Final Bloqueado</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Debes completar y aprobar todos los módulos anteriores con al menos {data?.minScore || 80}% para poder presentar la evaluación final de certificación.
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition"
          >
            ← Volver a los Módulos
          </Link>
        </div>
      </div>
    );
  }

  const questions = data?.questions || [];
  const cert = data?.certification;

  const handleAnswerSelect = (exId: string, optId: string) => {
    setAnswers((prev) => ({ ...prev, [exId]: optId }));
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      if (!confirm(`Has respondido ${answeredCount} de ${questions.length} preguntas. ¿Deseas enviar tu examen final ahora?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/final-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const resData = await res.json();
      setResult(resData);
    } catch (err) {
      console.error('Error enviando examen final:', err);
      alert('Hubo un problema enviando el examen. Intenta de nuevo.');
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
        <span className="text-xs text-purple-300 font-semibold bg-purple-950/40 border border-purple-800/40 px-3 py-1 rounded-full">
          🎓 CERTIFICACIÓN FINAL
        </span>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-800/40 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100">
          Examen Final de Certificación para Anotadores
        </h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Esta prueba evalúa tu conocimiento integral en todas las situaciones de anotación (Reconocimiento de Agaves, Huecos, No Visibles, Patrones de Distancia, Casos Especiales y Plataforma CVAT).
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block">Mínimo Aprobatorio:</span>
            <span className="font-bold text-slate-100">{data?.minScore || 80}%</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block">Intentos Restantes:</span>
            <span className="font-bold text-purple-300">{data?.attemptsRemaining} de {data?.maxAttempts}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block">Total de Preguntas:</span>
            <span className="font-bold text-slate-100">{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Resultados si ya se envió */}
      {result ? (
        <div className="space-y-6">
          <div
            className={`border rounded-2xl p-8 text-center shadow-2xl ${
              result.passed
                ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200'
                : 'bg-red-950/20 border-red-800/80 text-red-200'
            }`}
          >
            <div className="text-5xl mb-3">{result.passed ? '🎓' : '❌'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {result.passed ? '¡Aprobado! Certificación Otorgada' : 'No Aprobado'}
            </h2>
            <p className="text-sm opacity-90 max-w-lg mx-auto mb-6">
              {result.passed
                ? 'Felicidades, has demostrado los estándares de calidad requeridos para trabajar en tareas de anotación real.'
                : `Obtuviste ${result.score}%. Se requiere al menos ${result.minScore}% para obtener la certificación.`}
            </p>

            <div className="inline-flex items-center gap-6 bg-slate-950/60 px-6 py-3.5 rounded-2xl border border-slate-800/80 text-xs font-medium mb-6">
              <div>
                <div className="text-slate-400">Puntaje Final</div>
                <div className="text-2xl font-bold font-mono text-slate-100">{result.score}%</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-slate-400">Aciertos</div>
                <div className="text-2xl font-bold font-mono text-slate-100">
                  {result.correctCount} / {result.totalCount}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-slate-400">Fecha y Hora</div>
                <div className="text-[11px] font-mono text-slate-300">
                  {new Date(result.submittedAt).toLocaleString('es-MX')}
                </div>
              </div>
            </div>

            {result.certification && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-200 max-w-md mx-auto mb-6 font-mono">
                Código Único de Verificación: <strong className="text-emerald-100">{result.certification.verificationCode}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                ← Volver al Dashboard
              </Link>
            </div>
          </div>

          {/* Desglose por Competencia */}
          {result.competencies && result.competencies.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100">Desglose por Competencia / Módulo</h3>
              <div className="space-y-3">
                {result.competencies.map((c: any) => (
                  <div key={c.code} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{c.title}</span>
                      <span className="font-mono font-bold">{c.correct}/{c.total} ({c.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.percentage >= 80 ? 'bg-emerald-500' : c.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalle de Preguntas */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100">Revisión de Respuestas</h3>
            {result.breakdown.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  item.isCorrect
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : 'bg-red-950/10 border-red-900/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200 mb-1.5">
                  <span>Pregunta {idx + 1}: {item.questionText}</span>
                  <span>{item.isCorrect ? '✅' : '❌'}</span>
                </div>
                <div className="text-slate-400 space-y-0.5">
                  <div>Tu opción: <span className="text-slate-200">{item.selectedOption}</span></div>
                  {!item.isCorrect && (
                    <div>Opción correcta: <span className="text-emerald-400">{item.correctOption}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Formulario del Examen */
        <div className="space-y-8">
          {questions.map((ex: any, idx: number) => (
            <div key={ex.id} className="space-y-2">
              <div className="text-xs text-slate-500 font-mono">
                Pregunta {idx + 1} de {questions.length}
              </div>
              <ExerciseCard
                exercise={ex}
                isPractice={false}
                showImmediateFeedback={false}
                onAnswerSelected={handleAnswerSelect}
                selectedOptionId={answers[ex.id]}
              />
            </div>
          ))}

          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Respondidas: {Object.keys(answers).length} de {questions.length}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="py-3 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Calificando...' : 'Finalizar y Entregar Examen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

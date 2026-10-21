'use client';

import React, { useState } from 'react';
import ImageViewer from './ImageViewer';

interface Option {
  id: string;
  optionLetter: string;
  optionText: string;
  imageUrl?: string | null;
}

interface ExerciseCardProps {
  exercise: {
    id: string;
    questionText: string;
    imageUrl?: string | null;
    options: Option[];
  };
  isPractice?: boolean;
  onAnswerSelected?: (exerciseId: string, optionId: string) => void;
  selectedOptionId?: string;
  showImmediateFeedback?: boolean;
}

export default function ExerciseCard({
  exercise,
  isPractice = true,
  onAnswerSelected,
  selectedOptionId,
  showImmediateFeedback = true,
}: ExerciseCardProps) {
  const [selected, setSelected] = useState<string | null>(selectedOptionId || null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctOptionId?: string;
    explanation?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (optId: string) => {
    if (selected && showImmediateFeedback && feedback) return; // Ya respondido

    setSelected(optId);
    if (onAnswerSelected) {
      onAnswerSelected(exercise.id, optId);
    }

    if (showImmediateFeedback) {
      setLoading(true);
      try {
        const res = await fetch(`/api/exercises/${exercise.id}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId: optId, isPractice }),
        });
        const data = await res.json();
        setFeedback(data);
      } catch (err) {
        console.error('Error enviando respuesta:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Banner de Modo */}
      {isPractice ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          MODO PRÁCTICA (Sin nota • Feedback inmediato)
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full mb-4">
          <span>📝 EVALUACIÓN CALIFICADA</span>
        </div>
      )}

      {/* Pregunta */}
      <h3 className="text-lg font-semibold text-slate-100 mb-4 leading-relaxed">
        {exercise.questionText}
      </h3>

      {/* Imagen asociada si existe */}
      {exercise.imageUrl && (
        <div className="mb-6 flex justify-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <ImageViewer src={exercise.imageUrl} alt="Referencia para ejercicio" />
        </div>
      )}

      {/* Opciones */}
      <div className="space-y-3">
        {exercise.options.map((opt) => {
          const isCurrentSelected = selected === opt.id;
          let btnStyle = 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 text-slate-200';

          if (feedback) {
            if (opt.id === feedback.correctOptionId) {
              btnStyle = 'border-emerald-500 bg-emerald-950/30 text-emerald-200 font-medium';
            } else if (isCurrentSelected && !feedback.isCorrect) {
              btnStyle = 'border-red-500 bg-red-950/30 text-red-200';
            }
          } else if (isCurrentSelected) {
            btnStyle = 'border-blue-500 bg-blue-950/30 text-blue-200 font-medium';
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={loading || (!!feedback && showImmediateFeedback)}
              className={`w-full text-left p-4 rounded-lg border transition duration-150 flex items-start gap-3.5 ${btnStyle}`}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-xs font-bold shrink-0 mt-0.5 border border-slate-700">
                {opt.optionLetter}
              </span>
              <div className="flex-1 text-sm leading-relaxed">
                {opt.optionText}
                {opt.imageUrl && (
                  <div className="mt-2">
                    <ImageViewer src={opt.imageUrl} />
                  </div>
                )}
              </div>
              {feedback && opt.id === feedback.correctOptionId && (
                <span className="text-emerald-400 font-bold shrink-0">✅ Correcta</span>
              )}
              {feedback && isCurrentSelected && !feedback.isCorrect && (
                <span className="text-red-400 font-bold shrink-0">❌ Incorrecta</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explicación en modo práctica */}
      {feedback && showImmediateFeedback && (
        <div
          className={`mt-6 p-4 rounded-lg border text-sm leading-relaxed ${
            feedback.isCorrect
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/20 border-red-800/60 text-red-200'
          }`}
        >
          <div className="font-bold mb-1 flex items-center gap-1.5">
            {feedback.isCorrect ? '✅ ¡Respuesta Correcta!' : '❌ Explicación Pedagógica:'}
          </div>
          <p className="text-slate-300">{feedback.explanation}</p>
        </div>
      )}
    </div>
  );
}

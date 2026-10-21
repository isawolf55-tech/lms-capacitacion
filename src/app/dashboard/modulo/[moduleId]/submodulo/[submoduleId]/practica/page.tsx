'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ExerciseCard from '@/components/ExerciseCard';

export default function PracticePage() {
  const params = useParams();
  const { moduleId, submoduleId } = params as { moduleId: string; submoduleId: string };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submodules/${submoduleId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando práctica:', err);
        setLoading(false);
      });
  }, [submoduleId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Cargando ejercicios de práctica...</p>
      </div>
    );
  }

  const submodule = data?.submodule;
  const exercises = submodule?.exercises || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href={`/dashboard/modulo/${moduleId}/submodulo/${submoduleId}`}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Volver a la Teoría
        </Link>
        <span className="text-xs text-yellow-400 font-semibold bg-yellow-950/40 border border-yellow-800/40 px-3 py-1 rounded-full">
          🟡 MODO PRÁCTICA
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Práctica: {submodule?.title}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Los intentos en este modo no afectan tu calificación. Prueba tantas veces como necesites y lee las explicaciones pedagógicas.
        </p>
      </div>

      {/* Lista de Ejercicios */}
      {exercises.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          Este submódulo es puramente explicativo y no contiene ejercicios de práctica adicionales.
        </div>
      ) : (
        <div className="space-y-8">
          {exercises.map((ex: any, idx: number) => (
            <div key={ex.id} className="space-y-2">
              <div className="text-xs text-slate-500 font-mono">
                Ejercicio {idx + 1} de {exercises.length}
              </div>
              <ExerciseCard exercise={ex} isPractice={true} showImmediateFeedback={true} />
            </div>
          ))}
        </div>
      )}

      {/* Acciones Inferiores */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
        <Link
          href={`/dashboard/modulo/${moduleId}/submodulo/${submoduleId}`}
          className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
        >
          📖 Repasar Conceptos
        </Link>

        <Link
          href={`/dashboard/modulo/${moduleId}/evaluacion`}
          className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-md shadow-blue-600/10"
        >
          Ir a Evaluación Calificada del Módulo →
        </Link>
      </div>
    </div>
  );
}

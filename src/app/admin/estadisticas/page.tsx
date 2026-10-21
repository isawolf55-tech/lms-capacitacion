'use client';

import React, { useEffect, useState } from 'react';
import ImageViewer from '@/components/ImageViewer';

export default function AdminErrorStatsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/error-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.errorStats || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando estadísticas:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Preguntas con Mayor Índice de Error</h1>
        <p className="text-xs text-slate-400 mt-1">
          Identifica qué conceptos o reglas específicas están causando más confusión en los anotadores.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Calculando estadísticas de errores...</div>
      ) : stats.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Aún no hay suficientes intentos de evaluación para calcular preguntas con errores.
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((st, idx) => (
            <div
              key={st.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-800/80 text-red-300 font-mono">
                    #{idx + 1} Tasa de error: {st.errorRate}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {st.moduleName} • {st.submoduleName}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-200">
                  {st.questionText}
                </h3>

                <div className="text-xs text-slate-400 font-mono">
                  {st.failedAttempts} fallos en {st.totalAttempts} intentos totales
                </div>
              </div>

              {st.imageUrl && (
                <div className="shrink-0">
                  <ImageViewer src={st.imageUrl} className="max-w-[120px]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

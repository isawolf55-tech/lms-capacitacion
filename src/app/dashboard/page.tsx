'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando módulos:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Cargando tu ruta de aprendizaje...</p>
      </div>
    );
  }

  const modules = data?.modules || [];
  const finalExamUnlocked = data?.finalExamUnlocked || false;
  const cert = data?.certification;

  // Calcular progreso global
  let totalSubs = 0;
  let completedSubs = 0;
  modules.forEach((m: any) => {
    if (m.isEvaluated) {
      m.submodules.forEach((s: any) => {
        totalSubs++;
        if (s.isCompleted) completedSubs++;
      });
    }
  });

  const overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Banner Superior de Bienvenida */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full mb-3">
            🎯 Formación y Certificación de Anotadores
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Ruta de Capacitación CVAT & ML
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Completa cada módulo de forma secuencial. Estudia los conceptos con las imágenes interactivas, practica sin nota y aprueba cada evaluación con un mínimo de {data?.config?.minScore || 80}% para desbloquear el siguiente nivel.
          </p>

          <div className="mt-6 max-w-md">
            <ProgressBar value={overallProgress} label="Progreso General del Curso" />
          </div>
        </div>

        {cert?.passed && (
          <div className="mt-6 sm:mt-0 sm:absolute sm:top-8 sm:right-8 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-300 text-xs flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <div className="font-bold text-sm text-emerald-200">¡Certificación Obtenida!</div>
              <div>Nota Final: {cert.finalScore}%</div>
              <div className="font-mono text-[10px] text-emerald-400/80">Código: {cert.verificationCode}</div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Módulos */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <span>📚</span>
          <span>Módulos de Capacitación</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod: any, idx: number) => {
            const firstSub = mod.submodules[0];
            const isUnlocked = mod.isUnlocked;

            return (
              <div
                key={mod.id}
                className={`bg-slate-900 border rounded-2xl p-6 transition duration-200 shadow-lg flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-blue-400 font-mono">
                      {mod.code}
                    </span>
                    {mod.isCompleted ? (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        ✅ Aprobado
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-xs font-semibold text-blue-400 bg-blue-950/40 border border-blue-800/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        🔓 En Curso
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                        🔒 Bloqueado
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-2 leading-snug">
                    {mod.title}
                  </h3>

                  {/* Submódulos list */}
                  <div className="space-y-1.5 my-4">
                    {mod.submodules.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-slate-950/50 text-slate-300"
                      >
                        <span className="truncate max-w-[240px]">• {sub.title}</span>
                        {sub.isCompleted ? (
                          <span className="text-emerald-400 font-mono font-bold">100%</span>
                        ) : sub.isUnlocked ? (
                          <span className="text-blue-400">Disponible</span>
                        ) : (
                          <span className="text-slate-600">🔒</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3">
                  {isUnlocked && firstSub ? (
                    <>
                      <Link
                        href={`/dashboard/modulo/${mod.id}/submodulo/${firstSub.id}`}
                        className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/10"
                      >
                        {mod.isCompleted ? 'Repasar Módulo' : 'Continuar Aprendizaje →'}
                      </Link>
                      {mod.isEvaluated && (
                        <Link
                          href={`/dashboard/modulo/${mod.id}/evaluacion`}
                          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                        >
                          Evaluación
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center py-2.5 text-xs text-slate-500 font-medium bg-slate-950/40 rounded-xl border border-slate-800/40">
                      🔒 Requiere aprobar el módulo anterior
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner de Examen Final */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 transition shadow-2xl ${
          finalExamUnlocked
            ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-800/50'
            : 'bg-slate-900/40 border-slate-800/60 opacity-70'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-full mb-3">
              🎓 EXAMEN FINAL DE CERTIFICACIÓN
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              Evaluación Final Integral de Calidad
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Mínimo aprobatorio: {data?.config?.finalExamMinScore || 80}%. Máximo {data?.config?.finalExamMaxAttempts || 3} intentos. Al aprobar, se genera tu registro y certificado oficial de anotador.
            </p>
          </div>

          <div>
            {finalExamUnlocked ? (
              <Link
                href="/dashboard/examen-final"
                className="inline-block py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition whitespace-nowrap"
              >
                {cert?.passed ? 'Ver Certificado / Repetir' : 'Iniciar Examen Final →'}
              </Link>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 font-medium">
                🔒 Bloqueado hasta aprobar todos los módulos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

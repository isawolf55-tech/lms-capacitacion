'use client';

import React, { useEffect, useState } from 'react';

export default function AdminConfigPage() {
  const [minScore, setMinScore] = useState(80);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [finalExamMinScore, setFinalExamMinScore] = useState(80);
  const [finalExamMaxAttempts, setFinalExamMaxAttempts] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setMinScore(data.config.minScore || 80);
          setMaxAttempts(data.config.maxAttempts || 3);
          setFinalExamMinScore(data.config.finalExamMinScore || 80);
          setFinalExamMaxAttempts(data.config.finalExamMaxAttempts || 3);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando config:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minScore: Number(minScore),
          maxAttempts: Number(maxAttempts),
          finalExamMinScore: Number(finalExamMinScore),
          finalExamMaxAttempts: Number(finalExamMaxAttempts),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: data.error || 'Error al guardar configuración' });
      } else {
        setMsg({ type: 'ok', text: '✅ Parámetros de evaluación actualizados exitosamente.' });
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: 'Error de conexión al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Cargando configuración...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración de Evaluaciones</h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajusta los criterios de aprobación y límites de intentos para los módulos y el examen final.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-xs ${
            msg.type === 'ok'
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border border-red-800 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            📚 Evaluaciones por Módulo
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Porcentaje Mínimo de Aprobación (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              required
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Por defecto: 80%. Determina si el alumno puede desbloquear el siguiente módulo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Máximo de Intentos Recomendados
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            🎓 Examen Final de Certificación
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Porcentaje Mínimo para Certificar (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              required
              value={finalExamMinScore}
              onChange={(e) => setFinalExamMinScore(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Límite Estricto de Intentos
            </label>
            <input
              type="number"
              min="1"
              max="5"
              required
              value={finalExamMaxAttempts}
              onChange={(e) => setFinalExamMaxAttempts(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Por defecto: 3 intentos antes de requerir revisión manual del supervisor.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

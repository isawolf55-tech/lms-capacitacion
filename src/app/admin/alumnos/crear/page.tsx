'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateStudentsPage() {
  const router = useRouter();

  // Individual Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Anotador2026!');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMsg, setSingleMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Bulk Form
  const [rawList, setRawList] = useState('');
  const [bulkPassword, setBulkPassword] = useState('Anotador2026!');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleMsg(null);
    setSingleLoading(true);

    try {
      const res = await fetch('/api/admin/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSingleMsg({ type: 'err', text: data.error || 'Error al crear alumno' });
      } else {
        setSingleMsg({ type: 'ok', text: `Alumno ${data.user.email} registrado con éxito.` });
        setName('');
        setEmail('');
      }
    } catch (err: any) {
      setSingleMsg({ type: 'err', text: 'Error de conexión' });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkMsg(null);
    setBulkLoading(true);

    try {
      const res = await fetch('/api/admin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawList, defaultPassword: bulkPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkMsg({ type: 'err', text: data.error || 'Error en carga masiva' });
      } else {
        setBulkMsg({
          type: 'ok',
          text: `Se crearon ${data.createdCount} alumnos correctamente. ${data.skippedCount > 0 ? `(${data.skippedCount} omitidos por ya existir o formato inválido)` : ''}`,
        });
        setRawList('');
      }
    } catch (err: any) {
      setBulkMsg({ type: 'err', text: 'Error de conexión' });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/admin/alumnos"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Volver a la Lista
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Alta de Anotadores</h1>
        <p className="text-xs text-slate-400 mt-1">
          Crea anotadores individualmente o pega una lista completa de correos electrónicos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario Individual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>👤</span>
            <span>Registro Individual</span>
          </h2>

          {singleMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                singleMsg.type === 'ok'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/40 border border-red-800 text-red-300'
              }`}
            >
              {singleMsg.text}
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contraseña Inicial
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={singleLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50 mt-2"
            >
              {singleLoading ? 'Guardando...' : 'Crear Alumno'}
            </button>
          </form>
        </div>

        {/* Carga Masiva */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>📋</span>
            <span>Carga Masiva de Correos</span>
          </h2>

          {bulkMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                bulkMsg.type === 'ok'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/40 border border-red-800 text-red-300'
              }`}
            >
              {bulkMsg.text}
            </div>
          )}

          <form onSubmit={handleBulkSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lista de Correos (uno por línea o separados por comas)
              </label>
              <textarea
                required
                rows={6}
                value={rawList}
                onChange={(e) => setRawList(e.target.value)}
                placeholder={"anotador1@empresa.com\nanotador2@empresa.com\nMaria Lopez <maria@empresa.com>"}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contraseña común para todos
              </label>
              <input
                type="text"
                required
                value={bulkPassword}
                onChange={(e) => setBulkPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={bulkLoading}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50 mt-2"
            >
              {bulkLoading ? 'Procesando...' : 'Importar Lista de Alumnos'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

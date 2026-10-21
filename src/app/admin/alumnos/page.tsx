'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/students')
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando alumnos:', err);
        setLoading(false);
      });
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Alumnos y Progreso</h1>
          <p className="text-xs text-slate-400 mt-1">
            Seguimiento en tiempo real de todos los anotadores registrados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/alumnos/crear"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Dar de Alta Alumnos</span>
          </Link>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="bg-transparent text-slate-100 placeholder-slate-500 text-xs w-full focus:outline-none"
        />
      </div>

      {/* Tabla de Alumnos */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Cargando lista de alumnos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No hay alumnos registrados aún.{' '}
          <Link href="/admin/alumnos/crear" className="text-blue-400 hover:underline">
            Crea el primero o carga una lista de correos
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Alumno</th>
                  <th className="py-3.5 px-4">Progreso General</th>
                  <th className="py-3.5 px-4">Módulo Actual</th>
                  <th className="py-3.5 px-4">Estado Final</th>
                  <th className="py-3.5 px-4">Última Actividad</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-100">{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                    </td>
                    <td className="py-4 px-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              st.progressPct >= 80 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${st.progressPct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">{st.progressPct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <span className="truncate block max-w-xs">{st.currentModule}</span>
                    </td>
                    <td className="py-4 px-4">
                      {st.isCertified ? (
                        <span className="px-2.5 py-1 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-md font-semibold text-[11px]">
                          🎓 Aprobado ({st.finalScore}%)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">En Proceso</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(st.lastActivity).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/alumnos/${st.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                      >
                        Ver Detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

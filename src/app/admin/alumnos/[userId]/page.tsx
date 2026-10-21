'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StudentDetailPage() {
  const params = useParams();
  const { userId } = params as { userId: string };

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/students/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setStudent(data.student);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando detalle de alumno:', err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">Cargando expediente del alumno...</div>
    );
  }

  if (!student) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">Alumno no encontrado.</div>
    );
  }

  const cert = student.certification;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/admin/alumnos"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Volver a la Lista de Alumnos
        </Link>
      </div>

      {/* Ficha del Alumno */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono mb-2">
            ID: {student.id}
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{student.name}</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{student.email}</p>
        </div>

        {cert ? (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 text-emerald-300 text-xs">
            <div className="font-bold text-sm text-emerald-200">🎓 Certificado Aprobado</div>
            <div>Calificación Final: {cert.finalScore}%</div>
            <div className="font-mono text-[10px] mt-1 text-emerald-400/80">Código: {cert.verificationCode}</div>
          </div>
        ) : (
          <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            ⏳ Examen final pendiente o en curso
          </div>
        )}
      </div>

      {/* Métricas de Registro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Total de Intentos</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{student.totalAttemptsCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Intentos de Evaluación</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{student.scoredAttemptsCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Prácticas Realizadas</div>
          <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">{student.practiceAttemptsCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Submódulos Completados</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {student.progress.filter((p: any) => p.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Historial Detallado de Respuestas (Prioridad 6: Registro Solo Lectura) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100">
          Registro Histórico de Intentos (Solo Lectura)
        </h2>

        {student.recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No hay intentos registrados para este alumno.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Módulo</th>
                  <th className="py-2.5 px-3">Pregunta</th>
                  <th className="py-2.5 px-3">Opción Marcada</th>
                  <th className="py-2.5 px-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {student.recentAttempts.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(att.date).toLocaleString('es-MX')}
                    </td>
                    <td className="py-3 px-3">
                      {att.isPractice ? (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-950/40 text-yellow-400 text-[10px]">
                          PRÁCTICA
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 text-[10px]">
                          EVALUACIÓN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans text-xs">{att.moduleName}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans text-xs truncate max-w-xs">
                      {att.questionText}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-xs truncate max-w-xs">
                      {att.selectedOption}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {att.isCorrect ? (
                        <span className="text-emerald-400 font-bold">✅ Correcta</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌ Error</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

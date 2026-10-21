'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageViewer from '@/components/ImageViewer';

export default function SubmoduleViewerPage() {
  const params = useParams();
  const router = useRouter();
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
        console.error('Error cargando submódulo:', err);
        setLoading(false);
      });
  }, [submoduleId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Cargando contenido...</p>
      </div>
    );
  }

  const submodule = data?.submodule;
  const navigation = data?.navigation;
  const blocks = submodule?.contentBlocks || [];
  const exercises = submodule?.exercises || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Barra de Navegación Superior */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          ← Volver al Menú Principal
        </Link>
        <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2.5 py-1 rounded border border-blue-900/50">
          {submodule?.module?.code} • {submodule?.module?.title}
        </span>
      </div>

      {/* Encabezado del Submódulo */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          {submodule?.title}
        </h1>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-3">
          <span>⏱️ Tiempo estimado: {submodule?.estimatedMinutes || 10} min</span>
          {exercises.length > 0 && (
            <span>📝 {exercises.length} ejercicios prácticos disponibles</span>
          )}
        </p>
      </div>

      {/* Bloques de Contenido Teórico y Visual */}
      <div className="space-y-6">
        {blocks.map((block: any) => {
          let mediaItems: any[] = [];
          if (block.mediaJson) {
            try {
              mediaItems = JSON.parse(block.mediaJson);
            } catch (e) {
              mediaItems = [];
            }
          }

          return (
            <div
              key={block.id}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-md"
            >
              {block.title && (
                <h2 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
                  {block.title}
                </h2>
              )}

              {/* Contenido HTML formateado */}
              {block.bodyMarkdown && (
                <div
                  className="lms-content text-slate-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: block.bodyMarkdown }}
                />
              )}

              {/* Imágenes interactivas con Zoom y Pan */}
              {mediaItems.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mediaItems.map((m: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <ImageViewer src={m.url} caption={m.caption} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acceso a Práctica sin nota o Evaluación */}
      <div className="bg-gradient-to-r from-yellow-950/30 via-slate-900 to-slate-900 border border-yellow-800/40 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-yellow-400 font-bold text-sm flex items-center gap-2">
            <span>🎯</span>
            <span>Práctica Interactiva sin Nota</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pon a prueba tu comprensión de las reglas con feedback y explicaciones inmediatas.
          </p>
        </div>

        <Link
          href={`/dashboard/modulo/${moduleId}/submodulo/${submoduleId}/practica`}
          className="w-full sm:w-auto text-center py-2.5 px-6 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-yellow-500/10 whitespace-nowrap"
        >
          Iniciar Práctica ({exercises.length} Ejercicios) →
        </Link>
      </div>

      {/* Navegación Inferior Prev / Next */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
        {navigation?.prevSub ? (
          <Link
            href={`/dashboard/modulo/${moduleId}/submodulo/${navigation.prevSub.id}`}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            ← {navigation.prevSub.title}
          </Link>
        ) : (
          <div />
        )}

        {navigation?.nextSub ? (
          <Link
            href={`/dashboard/modulo/${moduleId}/submodulo/${navigation.nextSub.id}`}
            className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-md shadow-blue-600/10"
          >
            Siguiente: {navigation.nextSub.title} →
          </Link>
        ) : (
          <Link
            href={`/dashboard/modulo/${moduleId}/evaluacion`}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-md shadow-emerald-600/10"
          >
            Ir a la Evaluación del Módulo →
          </Link>
        )}
      </div>
    </div>
  );
}

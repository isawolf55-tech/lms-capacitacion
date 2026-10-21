'use client';

import React, { useState } from 'react';

export default function AdminFinalExamBankPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const sampleJson = `[
  {
    "questionText": "¿Cómo se marca un espacio con maleza alta donde no se ve la tierra ni los agaves?",
    "imageUrl": "/content/image 13.png",
    "options": [
      { "letter": "A", "text": "No Visible (BBox Azul)" },
      { "letter": "B", "text": "Hueco (BBox Amarillo)" },
      { "letter": "C", "text": "Agave (BBox Rojo)" }
    ],
    "correctLetter": "A",
    "explanation": "La maleza con volumen que oculta el suelo requiere la etiqueta No Visible."
  }
]`;

  const sampleCsv = `pregunta,imagen,opcionA,opcionB,opcionC,correcta,explicacion
"¿Qué se debe marcar si la maleza está al ras de suelo?","/content/image 14.png","Hueco","No visible","Agave","A","La maleza al ras permite verificar la ausencia de agave."`;

  const handleImport = async () => {
    if (!content.trim()) return;
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/final-exam/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: data.error || 'Error al importar preguntas' });
      } else {
        setMsg({ type: 'ok', text: `✅ ${data.message}` });
        setContent('');
      }
    } catch (err: any) {
      setMsg({ type: 'err', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Banco del Examen Final</h1>
        <p className="text-xs text-slate-400 mt-1">
          Carga o actualiza preguntas para la evaluación final de certificación mediante JSON o CSV sin tocar código.
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

      {/* Caja de Importación */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200">
            Pegar Preguntas (JSON o CSV)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setContent(sampleJson)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Cargar Ejemplo JSON
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setContent(sampleCsv)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Cargar Ejemplo CSV
            </button>
          </div>
        </div>

        <textarea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Pega aquí tu lista en formato JSON o CSV..."
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading || !content.trim()}
            className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            {loading ? 'Importando...' : 'Guardar en el Banco de Examen'}
          </button>
        </div>
      </div>
    </div>
  );
}

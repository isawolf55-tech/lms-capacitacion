'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/alumnos', label: '👥 Alumnos y Progreso' },
    { href: '/admin/alumnos/crear', label: '➕ Alta / Carga Masiva' },
    { href: '/admin/examen', label: '📝 Banco Examen Final' },
    { href: '/admin/estadisticas', label: '📊 Preguntas con Más Errores' },
    { href: '/admin/configuracion', label: '⚙️ Configuración' },
  ];

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto">
        <div className="flex gap-1 py-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <a
          href="/api/admin/export"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3.5 py-2 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0"
        >
          📥 Exportar CSV
        </a>
      </div>
    </div>
  );
}

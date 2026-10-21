'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-100 tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-extrabold shadow-lg shadow-blue-500/20">
              GA
            </span>
            <span>Plataforma de Capacitación ML</span>
          </Link>
          <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">v2.0</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin/alumnos"
                className="text-xs px-3 py-1.5 rounded-md bg-purple-950/40 border border-purple-800/60 text-purple-300 hover:bg-purple-900/50 transition font-medium"
              >
                ⚙️ Panel Admin
              </Link>
            )}

            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-300 transition"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

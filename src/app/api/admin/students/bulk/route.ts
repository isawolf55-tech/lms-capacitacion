import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { rawList, defaultPassword = 'Anotador2026!' } = await request.json();

    if (!rawList || typeof rawList !== 'string') {
      return NextResponse.json({ error: 'La lista de correos es requerida' }, { status: 400 });
    }

    const lines = rawList.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
    const createdUsers = [];
    const skippedUsers = [];

    const defaultHashed = await hashPassword(defaultPassword);

    for (const item of lines) {
      // Formato puede ser: email o "Nombre <email>" o "Nombre,email"
      let email = item;
      let name = item.split('@')[0];

      if (item.includes('<') && item.includes('>')) {
        const parts = item.match(/(.*)<([^>]+)>/);
        if (parts) {
          name = parts[1].trim() || name;
          email = parts[2].trim();
        }
      }

      email = email.toLowerCase().trim();

      if (!email.includes('@')) {
        skippedUsers.push({ email, reason: 'Formato de correo no válido' });
        continue;
      }

      const existing = await db.user.findUnique({
        where: { email },
      });

      if (existing) {
        skippedUsers.push({ email, reason: 'Ya registrado' });
        continue;
      }

      const user = await db.user.create({
        data: {
          name,
          email,
          password: defaultHashed,
          role: 'ANNOTATOR',
          isActive: true,
        },
      });

      createdUsers.push({ id: user.id, email: user.email, name: user.name });
    }

    return NextResponse.json({
      success: true,
      createdCount: createdUsers.length,
      skippedCount: skippedUsers.length,
      createdUsers,
      skippedUsers,
      defaultPasswordUsed: defaultPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en carga masiva' }, { status: 500 });
  }
}

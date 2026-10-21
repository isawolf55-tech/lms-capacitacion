import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getLMSConfig, saveLMSConfig } from '@/lib/config';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return NextResponse.json({ config: getLMSConfig() });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = saveLMSConfig({
      minScore: Number(body.minScore) || 80,
      maxAttempts: Number(body.maxAttempts) || 3,
      finalExamMinScore: Number(body.finalExamMinScore) || 80,
      finalExamMaxAttempts: Number(body.finalExamMaxAttempts) || 3,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al guardar configuración' }, { status: 500 });
  }
}

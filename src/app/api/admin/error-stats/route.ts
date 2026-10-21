import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Obtener todos los intentos y calcular tasa de error por ejercicio
  const exercises = await db.exercise.findMany({
    include: {
      submodule: {
        include: {
          module: true,
        },
      },
      attempts: true,
    },
  });

  const stats = exercises
    .map((ex) => {
      const totalAttempts = ex.attempts.length;
      const failedAttempts = ex.attempts.filter((a) => !a.isCorrect).length;
      const errorRate = totalAttempts > 0 ? Math.round((failedAttempts / totalAttempts) * 100) : 0;

      return {
        id: ex.id,
        questionText: ex.questionText,
        imageUrl: ex.imageUrl,
        moduleName: ex.submodule?.module?.title || 'General',
        submoduleName: ex.submodule?.title || 'General',
        totalAttempts,
        failedAttempts,
        errorRate,
      };
    })
    .filter((s) => s.totalAttempts > 0)
    .sort((a, b) => b.errorRate - a.errorRate || b.failedAttempts - a.failedAttempts)
    .slice(0, 25);

  return NextResponse.json({ errorStats: stats });
}

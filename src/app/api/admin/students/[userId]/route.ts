import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { userId } = params;

  const student = await db.user.findUnique({
    where: { id: userId },
    include: {
      progress: {
        include: {
          submodule: {
            include: {
              module: true,
            },
          },
        },
      },
      certifications: true,
      attempts: {
        orderBy: { createdAt: 'desc' },
        include: {
          exercise: {
            include: {
              submodule: {
                include: {
                  module: true,
                },
              },
            },
          },
          selectedOption: true,
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
  }

  // Agrupar intentos por módulo y práctica vs examen
  const scoredAttempts = student.attempts.filter((a) => !a.isPractice);
  const practiceAttempts = student.attempts.filter((a) => a.isPractice);

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      isActive: student.isActive,
      createdAt: student.createdAt,
      certification: student.certifications[0] || null,
      progress: student.progress,
      totalAttemptsCount: student.attempts.length,
      scoredAttemptsCount: scoredAttempts.length,
      practiceAttemptsCount: practiceAttempts.length,
      recentAttempts: student.attempts.slice(0, 50).map((a) => ({
        id: a.id,
        date: a.createdAt,
        isPractice: a.isPractice,
        moduleName: a.exercise?.submodule?.module?.title || 'General',
        questionText: a.exercise?.questionText || 'Pregunta',
        selectedOption: a.selectedOption ? `${a.selectedOption.optionLetter}. ${a.selectedOption.optionText}` : 'N/A',
        isCorrect: a.isCorrect,
      })),
    },
  });
}

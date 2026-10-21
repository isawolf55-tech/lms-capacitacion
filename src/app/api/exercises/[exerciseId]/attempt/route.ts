import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { exerciseId: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { exerciseId } = params;
  const { optionId, isPractice = true } = await request.json();

  const exercise = await db.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      options: true,
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
  }

  const selectedOption = exercise.options.find((o) => o.id === optionId);
  const correctOption = exercise.options.find((o) => o.isCorrect);

  const isCorrect = selectedOption ? selectedOption.isCorrect : false;

  // Registrar intento en BD (Prioridad 6: Registro)
  const attempt = await db.quizAttempt.create({
    data: {
      userId: session.userId,
      exerciseId: exercise.id,
      selectedOptionId: optionId || null,
      isCorrect: isCorrect,
      isPractice: isPractice,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    isCorrect,
    correctOptionId: correctOption?.id,
    explanation: exercise.explanation || 'Revisa el contenido teórico del módulo para confirmar la regla.',
  });
}

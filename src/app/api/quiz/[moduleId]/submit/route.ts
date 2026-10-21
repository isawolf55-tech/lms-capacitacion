import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { getLMSConfig } from '@/lib/config';

export async function POST(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { moduleId } = params;
  const { answers } = await request.json(); // { [exerciseId: string]: string (optionId) }

  if (!answers || Object.keys(answers).length === 0) {
    return NextResponse.json({ error: 'No se enviaron respuestas' }, { status: 400 });
  }

  const config = getLMSConfig();
  const exerciseIds = Object.keys(answers);

  const exercises = await db.exercise.findMany({
    where: { id: { in: exerciseIds } },
    include: {
      options: true,
      submodule: true,
    },
  });

  let correctCount = 0;
  const breakdown: any[] = [];

  for (const ex of exercises) {
    const selectedOptionId = answers[ex.id];
    const selectedOption = ex.options.find((o) => o.id === selectedOptionId);
    const correctOption = ex.options.find((o) => o.isCorrect);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    if (isCorrect) correctCount++;

    // Guardar intento en BD (Prioridad 6)
    await db.quizAttempt.create({
      data: {
        userId: session.userId,
        exerciseId: ex.id,
        selectedOptionId: selectedOptionId || null,
        isCorrect: isCorrect,
        isPractice: false,
      },
    });

    breakdown.push({
      exerciseId: ex.id,
      questionText: ex.questionText,
      selectedOption: selectedOption ? `${selectedOption.optionLetter}. ${selectedOption.optionText}` : 'Sin responder',
      correctOption: correctOption ? `${correctOption.optionLetter}. ${correctOption.optionText}` : 'N/A',
      isCorrect,
      explanation: ex.explanation,
    });
  }

  const scorePercentage = Math.round((correctCount / exercises.length) * 100);
  const passed = scorePercentage >= config.minScore;

  // Actualizar progreso en todos los submódulos de este módulo
  const subIds = Array.from(new Set(exercises.map((e) => e.submoduleId).filter(Boolean))) as string[];

  for (const subId of subIds) {
    const prevProg = await db.userProgress.findUnique({
      where: {
        userId_submoduleId: {
          userId: session.userId,
          submoduleId: subId,
        },
      },
    });

    const bestScore = Math.max(prevProg?.bestScore || 0, scorePercentage);

    await db.userProgress.upsert({
      where: {
        userId_submoduleId: {
          userId: session.userId,
          submoduleId: subId,
        },
      },
      update: {
        status: passed ? 'COMPLETED' : 'IN_PROGRESS',
        bestScore: bestScore,
        completedAt: passed ? new Date() : prevProg?.completedAt,
      },
      create: {
        userId: session.userId,
        submoduleId: subId,
        status: passed ? 'COMPLETED' : 'IN_PROGRESS',
        bestScore: scorePercentage,
        completedAt: passed ? new Date() : null,
      },
    });
  }

  return NextResponse.json({
    score: scorePercentage,
    correctCount,
    totalCount: exercises.length,
    passed,
    minScore: config.minScore,
    breakdown,
  });
}

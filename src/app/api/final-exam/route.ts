import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { getLMSConfig } from '@/lib/config';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const config = getLMSConfig();

  // Verificar si aprobó todos los módulos evaluados
  const evaluatedModules = await db.module.findMany({
    where: { isEvaluated: true },
    include: {
      submodules: true,
    },
  });

  const subIds = evaluatedModules.flatMap((m) => m.submodules.map((s) => s.id));

  const progressList = await db.userProgress.findMany({
    where: {
      userId: session.userId,
      submoduleId: { in: subIds },
    },
  });

  const completedCount = progressList.filter(
    (p) => p.status === 'COMPLETED' || (p.bestScore !== null && p.bestScore >= config.minScore)
  ).length;

  const isUnlocked = completedCount >= subIds.length && subIds.length > 0;

  // Obtener preguntas del examen final (o banco representativo de todos los módulos)
  let examQuestions = await db.exercise.findMany({
    where: {
      evaluationContext: 'FINAL_EXAM',
      isComplete: true,
    },
    include: {
      options: {
        select: {
          id: true,
          optionLetter: true,
          optionText: true,
          imageUrl: true,
        },
      },
      submodule: {
        include: {
          module: true,
        },
      },
    },
  });

  // Si aún no se importaron preguntas dedicadas al examen final, tomar una muestra equilibrada de los módulos existentes
  if (examQuestions.length === 0) {
    examQuestions = await db.exercise.findMany({
      where: { isComplete: true },
      take: 20,
      include: {
        options: {
          select: {
            id: true,
            optionLetter: true,
            optionText: true,
            imageUrl: true,
          },
        },
        submodule: {
          include: {
            module: true,
          },
        },
      },
    });
  }

  // Contar intentos previos del examen final
  const cert = await db.certification.findFirst({
    where: { userId: session.userId },
  });

  const finalAttempts = await db.quizAttempt.findMany({
    where: {
      userId: session.userId,
      exercise: {
        id: { in: examQuestions.map((e) => e.id) },
      },
      isPractice: false,
    },
  });

  const attemptsUsed = cert ? 1 : Math.floor(finalAttempts.length / Math.max(1, examQuestions.length));
  const attemptsRemaining = Math.max(0, config.finalExamMaxAttempts - attemptsUsed);

  return NextResponse.json({
    isUnlocked,
    totalModulesRequired: evaluatedModules.length,
    completedModulesCount: Math.min(evaluatedModules.length, Math.floor(completedCount / Math.max(1, subIds.length / evaluatedModules.length))),
    questions: isUnlocked ? examQuestions.sort(() => Math.random() - 0.5) : [],
    attemptsUsed,
    attemptsRemaining,
    maxAttempts: config.finalExamMaxAttempts,
    minScore: config.finalExamMinScore,
    certification: cert,
  });
}

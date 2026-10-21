import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { getLMSConfig } from '@/lib/config';

export async function GET(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { moduleId } = params;
  const config = getLMSConfig();

  const moduleItem = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      submodules: {
        include: {
          exercises: {
            where: { isComplete: true },
            include: {
              options: {
                select: {
                  id: true,
                  optionLetter: true,
                  optionText: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!moduleItem) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
  }

  // Recolectar todos los ejercicios del módulo
  let allExercises: any[] = [];
  moduleItem.submodules.forEach((sub) => {
    allExercises = allExercises.concat(sub.exercises);
  });

  // Si no hay ejercicios propios, buscar ejercicios generales del módulo
  if (allExercises.length === 0) {
    allExercises = await db.exercise.findMany({
      where: { moduleId: moduleItem.id },
      include: {
        options: {
          select: {
            id: true,
            optionLetter: true,
            optionText: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  // Barajar ejercicios aleatoriamente
  const shuffled = allExercises.sort(() => Math.random() - 0.5);

  // Contar intentos previos del usuario en este módulo
  const subIds = moduleItem.submodules.map((s) => s.id);
  const attempts = await db.quizAttempt.findMany({
    where: {
      userId: session.userId,
      isPractice: false,
      exercise: {
        submoduleId: { in: subIds },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Obtener progreso actual del módulo
  const progressList = await db.userProgress.findMany({
    where: {
      userId: session.userId,
      submoduleId: { in: subIds },
    },
  });

  const bestScore = progressList.reduce((max, p) => Math.max(max, p.bestScore || 0), 0);

  return NextResponse.json({
    module: {
      id: moduleItem.id,
      code: moduleItem.code,
      title: moduleItem.title,
    },
    exercises: shuffled,
    config: {
      minScore: config.minScore,
      maxAttempts: config.maxAttempts,
    },
    userStats: {
      bestScore,
      totalAttempts: attempts.length > 0 ? Math.ceil(attempts.length / Math.max(1, allExercises.length)) : 0,
      isPassed: bestScore >= config.minScore,
    },
  });
}

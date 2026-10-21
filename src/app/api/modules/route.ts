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

  const modules = await db.module.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      submodules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: {
            select: { id: true, isComplete: true },
          },
        },
      },
    },
  });

  const userProgress = await db.userProgress.findMany({
    where: { userId: session.userId },
  });

  const progressMap = new Map(userProgress.map((p) => [p.submoduleId, p]));

  // Determinar desbloqueo secuencial
  let previousModulePassed = true;
  let allEvaluatedPassed = true;

  const enrichedModules = modules.map((mod, modIdx) => {
    // Si es el primer módulo, siempre está desbloqueado. Si no, depende del anterior
    const isModuleUnlocked = modIdx === 0 || previousModulePassed;

    let subPreviousCompleted = isModuleUnlocked;

    const enrichedSubmodules = mod.submodules.map((sub, subIdx) => {
      const prog = progressMap.get(sub.id);
      const isSubUnlocked = isModuleUnlocked && (subIdx === 0 || subPreviousCompleted);
      const isCompleted = prog?.status === 'COMPLETED' || (prog?.bestScore !== null && (prog?.bestScore ?? 0) >= config.minScore);

      if (!isCompleted) {
        subPreviousCompleted = false;
      }

      return {
        ...sub,
        status: isSubUnlocked ? (prog?.status || 'AVAILABLE') : 'LOCKED',
        bestScore: prog?.bestScore ?? null,
        isUnlocked: isSubUnlocked,
        isCompleted: isCompleted,
      };
    });

    const allSubsCompleted = enrichedSubmodules.every((s) => s.isCompleted);
    if (!allSubsCompleted && mod.isEvaluated) {
      previousModulePassed = false;
      allEvaluatedPassed = false;
    }

    return {
      ...mod,
      isUnlocked: isModuleUnlocked,
      isCompleted: allSubsCompleted,
      submodules: enrichedSubmodules,
    };
  });

  const cert = await db.certification.findFirst({
    where: { userId: session.userId },
  });

  return NextResponse.json({
    modules: enrichedModules,
    finalExamUnlocked: allEvaluatedPassed,
    certification: cert,
    config: {
      minScore: config.minScore,
      maxAttempts: config.maxAttempts,
      finalExamMinScore: config.finalExamMinScore,
      finalExamMaxAttempts: config.finalExamMaxAttempts,
    },
  });
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { submoduleId: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { submoduleId } = params;

  const submodule = await db.submodule.findUnique({
    where: { id: submoduleId },
    include: {
      module: {
        include: {
          submodules: {
            orderBy: { orderIndex: 'asc' },
            select: { id: true, title: true, orderIndex: true },
          },
        },
      },
      contentBlocks: {
        orderBy: { orderIndex: 'asc' },
      },
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          options: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              optionLetter: true,
              optionText: true,
              imageUrl: true,
              // isCorrect se oculta al enviar preguntas para evaluación, pero en práctica se resuelve vía attempt
            },
          },
        },
      },
    },
  });

  if (!submodule) {
    return NextResponse.json({ error: 'Submódulo no encontrado' }, { status: 404 });
  }

  // Registrar progreso inicial si no existe
  let progress = await db.userProgress.findUnique({
    where: {
      userId_submoduleId: {
        userId: session.userId,
        submoduleId: submodule.id,
      },
    },
  });

  if (!progress) {
    progress = await db.userProgress.create({
      data: {
        userId: session.userId,
        submoduleId: submodule.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  // Encontrar submódulo anterior y siguiente
  const allSubs = submodule.module.submodules;
  const currentIdx = allSubs.findIndex((s) => s.id === submodule.id);
  const prevSub = currentIdx > 0 ? allSubs[currentIdx - 1] : null;
  const nextSub = currentIdx < allSubs.length - 1 ? allSubs[currentIdx + 1] : null;

  return NextResponse.json({
    submodule,
    progress,
    navigation: {
      prevSub,
      nextSub,
    },
  });
}

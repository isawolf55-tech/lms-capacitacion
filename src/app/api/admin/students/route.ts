import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { getLMSConfig } from '@/lib/config';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const config = getLMSConfig();

  const students = await db.user.findMany({
    where: { role: 'ANNOTATOR' },
    orderBy: { createdAt: 'desc' },
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
        take: 1,
      },
    },
  });

  const totalEvaluatedSubs = await db.submodule.count({
    where: { module: { isEvaluated: true } },
  });

  const formatted = students.map((st) => {
    const completedSubs = st.progress.filter(
      (p) => p.status === 'COMPLETED' || (p.bestScore !== null && p.bestScore >= config.minScore)
    );

    const progressPct = totalEvaluatedSubs > 0 ? Math.round((completedSubs.length / totalEvaluatedSubs) * 100) : 0;
    const cert = st.certifications[0];
    const lastActivity = st.attempts[0]?.createdAt || st.progress[0]?.updatedAt || st.createdAt;

    // Encontrar último módulo activo
    const latestProgress = st.progress.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const currentModule = latestProgress?.submodule?.module?.title || 'Sin iniciar';

    return {
      id: st.id,
      name: st.name,
      email: st.email,
      isActive: st.isActive,
      createdAt: st.createdAt,
      lastActivity,
      progressPct,
      completedSubsCount: completedSubs.length,
      totalSubsCount: totalEvaluatedSubs,
      currentModule,
      isCertified: cert?.passed || false,
      finalScore: cert?.finalScore ?? null,
      certCode: cert?.verificationCode ?? null,
    };
  });

  return NextResponse.json({ students: formatted });
}

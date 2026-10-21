import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { getLMSConfig } from '@/lib/config';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { answers } = await request.json();
  if (!answers || Object.keys(answers).length === 0) {
    return NextResponse.json({ error: 'No se enviaron respuestas' }, { status: 400 });
  }

  const config = getLMSConfig();
  const exerciseIds = Object.keys(answers);

  const exercises = await db.exercise.findMany({
    where: { id: { in: exerciseIds } },
    include: {
      options: true,
      submodule: {
        include: {
          module: true,
        },
      },
    },
  });

  let correctCount = 0;
  const competencyMap: { [key: string]: { total: number; correct: number; title: string } } = {};
  const breakdown: any[] = [];

  for (const ex of exercises) {
    const selectedOptionId = answers[ex.id];
    const selectedOption = ex.options.find((o) => o.id === selectedOptionId);
    const correctOption = ex.options.find((o) => o.isCorrect);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    if (isCorrect) correctCount++;

    // Desglose por competencia / módulo
    const modTitle = ex.submodule?.module?.title || 'Conocimiento General';
    const modCode = ex.submodule?.module?.code || 'GEN';
    if (!competencyMap[modCode]) {
      competencyMap[modCode] = { total: 0, correct: 0, title: modTitle };
    }
    competencyMap[modCode].total++;
    if (isCorrect) competencyMap[modCode].correct++;

    // Registrar intento individual en BD (Prioridad 6)
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
  const passed = scorePercentage >= config.finalExamMinScore;

  // Generar o actualizar certificación si aprobó
  let certification = null;
  if (passed) {
    const verificationCode = `CERT-${Date.now().toString(36).toUpperCase()}-${session.userId.slice(-4).toUpperCase()}`;
    certification = await db.certification.create({
      data: {
        userId: session.userId,
        finalScore: scorePercentage,
        passed: true,
        verificationCode: verificationCode,
        issuedAt: new Date(),
      },
    });
  }

  // Preparar desglose por competencias en array
  const competencies = Object.entries(competencyMap).map(([code, data]) => ({
    code,
    title: data.title,
    total: data.total,
    correct: data.correct,
    percentage: Math.round((data.correct / data.total) * 100),
  }));

  return NextResponse.json({
    score: scorePercentage,
    correctCount,
    totalCount: exercises.length,
    passed,
    minScore: config.finalExamMinScore,
    competencies,
    certification,
    breakdown,
    submittedAt: new Date().toISOString(),
  });
}

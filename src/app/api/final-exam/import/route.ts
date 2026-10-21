import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { questions, format = 'json' } = body;

    let parsedQuestions: any[] = [];

    if (Array.isArray(questions)) {
      parsedQuestions = questions;
    } else if (typeof questions === 'string') {
      // Intentar parsear CSV o JSON string
      try {
        parsedQuestions = JSON.parse(questions);
      } catch {
        // Parsear CSV simple: question,imageUrl,optionA,optionB,optionC,correctLetter,explanation
        const lines = questions.trim().split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 6) {
            parsedQuestions.push({
              questionText: cols[0],
              imageUrl: cols[1] || null,
              options: [
                { letter: 'A', text: cols[2] },
                { letter: 'B', text: cols[3] },
                { letter: 'C', text: cols[4] || '' },
              ].filter((o) => o.text),
              correctLetter: cols[5]?.toUpperCase() || 'A',
              explanation: cols[6] || '',
            });
          }
        }
      }
    }

    if (parsedQuestions.length === 0) {
      return NextResponse.json({ error: 'No se encontraron preguntas válidas para importar' }, { status: 400 });
    }

    let importedCount = 0;

    for (const q of parsedQuestions) {
      if (!q.questionText || !q.options || q.options.length < 2) continue;

      const createdEx = await db.exercise.create({
        data: {
          exerciseType: 'SINGLE_CHOICE',
          evaluationContext: 'FINAL_EXAM',
          questionText: q.questionText,
          imageUrl: q.imageUrl || null,
          explanation: q.explanation || 'Respuesta validada por el equipo de control de calidad.',
          isComplete: true,
          orderIndex: importedCount + 1,
        },
      });

      for (let idx = 0; idx < q.options.length; idx++) {
        const opt = q.options[idx];
        const letter = opt.letter || String.fromCharCode(65 + idx);
        const isCorrect = q.correctLetter ? letter === q.correctLetter.toUpperCase() : opt.isCorrect || false;

        await db.exerciseOption.create({
          data: {
            exerciseId: createdEx.id,
            orderIndex: idx + 1,
            optionLetter: letter,
            optionText: opt.text || opt,
            isCorrect: isCorrect,
          },
        });
      }
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Se importaron ${importedCount} preguntas al banco del examen final.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al importar banco' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const attempts = await db.quizAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
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
  });

  // Generar CSV
  const headers = [
    'ID_Intento',
    'Fecha_Hora',
    'Alumno_Nombre',
    'Alumno_Email',
    'Modulo_Codigo',
    'Modulo_Titulo',
    'Submodulo_Titulo',
    'Pregunta',
    'Opcion_Seleccionada',
    'Es_Correcta',
    'Modo_Practica',
  ];

  const escapeCsv = (str: string | null | undefined) => {
    if (!str) return '""';
    return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  };

  const rows = attempts.map((a) => [
    escapeCsv(a.id),
    escapeCsv(a.createdAt.toISOString()),
    escapeCsv(a.user.name),
    escapeCsv(a.user.email),
    escapeCsv(a.exercise?.submodule?.module?.code || 'GEN'),
    escapeCsv(a.exercise?.submodule?.module?.title || 'General'),
    escapeCsv(a.exercise?.submodule?.title || 'General'),
    escapeCsv(a.exercise?.questionText),
    escapeCsv(a.selectedOption ? `${a.selectedOption.optionLetter}. ${a.selectedOption.optionText}` : 'Sin responder'),
    a.isCorrect ? 'SI' : 'NO',
    a.isPractice ? 'PRACTICA' : 'EVALUACION',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte_capacitacion_anotadores_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

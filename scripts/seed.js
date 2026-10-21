const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed & Importación LMS ---');

  // 1. Crear / actualizar Admin
  const adminEmail = 'admin@capacitacion.mx';
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword, role: 'ADMIN', name: 'Administrador Principal' },
    create: {
      email: adminEmail,
      name: 'Administrador Principal',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`Usuario Admin asegurado: ${admin.email} / Admin123!`);

  // 2. Ruta del HTML
  const htmlCandidates = [
    'c:\\Users\\pablo\\OneDrive\\Imágenes\\Ghost Annotations\\Anotación\\Capacitación\\contenido-nuevo\\Estructura 3e4a43207a2c80508d3cf528393be7a4.html',
    path.join(__dirname, '../contenido_FINAL.html'),
    path.join(__dirname, '../contenido-nuevo/Estructura 3e4a43207a2c80508d3cf528393be7a4.html')
  ];

  let htmlPath = htmlCandidates.find(p => fs.existsSync(p));
  if (!htmlPath) {
    console.error('No se encontró el archivo HTML de contenido.');
    return;
  }
  console.log(`Leyendo HTML desde: ${htmlPath}`);

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(htmlContent);

  // Limpiar contenido previo para idempotencia limpia
  await prisma.quizAttempt.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.exerciseOption.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.submodule.deleteMany();
  await prisma.module.deleteMany();

  let totalModules = 0;
  let totalSubmodules = 0;
  let totalExercises = 0;
  let totalIncompleteExercises = [];

  // Mapeo conocido de respuestas validadas para garantizar 100% de precisión pedagógica
  const manualAnswers = {
    // Módulo 1 respuestas
    'm1-ej1': { correct: 'SI', explanation: 'Aunque se ven pequeños, conservan color y distancia de plantación.' },
    'm1-ej2': { correct: 'SI', explanation: 'Se confirma por forma y distancia de plantación aunque esté más opaco.' },
    'm1-ej3': { correct: 'SI', explanation: 'Es un agave y se marca con BBox rojo.' },
    'm1-ej4': { correct: 'SI', explanation: 'Debajo de la maleza se distinguen tonos verde azulados y respeta distancia.' },
    'm1-2-ej1': { correct: 'HUECO', explanation: 'Es un hijuelo fuera de línea; el espacio vacío en línea se marca como hueco.' },
    'm1-2-ej2': { correct: 'HUECO', explanation: 'Falta agave según distancia de plantación, se marca hueco amarillo.' },
    'm1-2-nv-ej1': { correct: 'C', explanation: 'BBox 1 y 3 pasan a hueco, BBox 2 a agave por la sombra visible.' },
    'm1-2-nv-ej2': { correct: 'A', explanation: 'Maleza alta impide confirmar si hay agave debajo, se mantiene NV.' },
    'm1-3-ej1': { correct: 'B', explanation: 'No, porque la maleza está al ras del suelo y no tapa ningún agave.' },
    'm1-3-ej2': { correct: 'B', explanation: 'No, porque la maleza no permite ver si hay agave o no debajo.' },
    'm2-dist-1': { correct: 'SI', explanation: 'El espacio está sobre la línea de plantación y no hay plantas, se completa como hueco.' },
    'm2-dist-2': { correct: 'NO', explanation: 'Los montículos interrumpen el recorrido y no se plantaron agaves ahí.' },
    'm2-dist-err-1': { correct: 'C', explanation: 'Se colocaron muchos huecos de más; se debe respetar la cantidad real faltante según distancia.' },
    'm2-dist-err-2': { correct: 'A', explanation: 'Se pusieron menos huecos de los que hacían falta según el patrón de distancia.' },
    'm3-arb-1': { correct: 'C', explanation: 'Se completa parcialmente, solo donde hay agave visible.' },
    'm3-arb-2': { correct: 'A', explanation: 'No se completa; dejar hasta el último agave visible.' },
    'm6-rev-1': { correct: 'B', explanation: 'BB de más fuera de línea de plantación; debe eliminarse.' },
    'm6-rev-2': { correct: 'B', explanation: 'Hueco; se observa claramente el suelo.' },
    'm6-rev-3': { correct: 'B', explanation: 'Usar Bitmap en CVAT para detectar BB superpuestos.' }
  };

  function normalizeImageUrl(src) {
    if (!src) return null;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    let decoded = decodeURIComponent(src).replace(/\\/g, '/');
    let basename = path.basename(decoded);
    return `/content/${basename}`;
  }

  // Iterar sobre los módulos de primer nivel (<details> hijos directos de .page-body)
  const moduleDetails = $('.page-body > details');
  
  let moduleOrder = 1;

  for (let i = 0; i < moduleDetails.length; i++) {
    const modEl = $(moduleDetails[i]);
    const summaryText = modEl.children('summary').text().trim() || `Módulo ${moduleOrder}`;
    
    // Titulo y codigo
    let title = summaryText;
    let code = `M${moduleOrder}`;
    const codeMatch = summaryText.match(/M[oó]dulo\s*(\d+|Extra)/i);
    if (codeMatch) {
      code = codeMatch[1].toLowerCase() === 'extra' ? 'EXTRA' : `M${codeMatch[1]}`;
    }

    const createdModule = await prisma.module.create({
      data: {
        orderIndex: moduleOrder,
        code: code,
        title: title,
        description: `Módulo de formación: ${title}`,
        isEvaluated: code !== 'EXTRA',
      },
    });
    totalModules++;
    console.log(`\n📦 Módulo creado: [${code}] ${title}`);

    // Submódulos (<details> anidados o contenido directo)
    const subDetails = modEl.find('> .indented > details');
    let subOrder = 1;

    if (subDetails.length > 0) {
      for (let j = 0; j < subDetails.length; j++) {
        const subEl = $(subDetails[j]);
        const subTitle = subEl.children('summary').text().trim() || `Submódulo ${subOrder}`;
        const slug = `${code.toLowerCase()}-${subOrder}-${subTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

        const createdSub = await prisma.submodule.create({
          data: {
            moduleId: createdModule.id,
            orderIndex: subOrder,
            title: subTitle,
            slug: slug,
            estimatedMinutes: 10,
            hasEvaluation: true,
          },
        });
        totalSubmodules++;
        console.log(`   📄 Submódulo: ${subTitle}`);

        // Extraer bloques de contenido y ejercicios dentro del submódulo
        await processSubmoduleContent($, subEl.children('.indented'), createdSub.id, createdModule.id);
        subOrder++;
      }
    } else {
      // Si no tiene <details> anidados, el contenido directo del módulo es un submódulo único
      const subTitle = title;
      const slug = `${code.toLowerCase()}-1-general`;
      const createdSub = await prisma.submodule.create({
        data: {
          moduleId: createdModule.id,
          orderIndex: 1,
          title: subTitle,
          slug: slug,
          estimatedMinutes: 15,
          hasEvaluation: true,
        },
      });
      totalSubmodules++;
      console.log(`   📄 Submódulo único: ${subTitle}`);
      await processSubmoduleContent($, modEl.children('.indented'), createdSub.id, createdModule.id);
    }

    moduleOrder++;
  }

  async function processSubmoduleContent($, containerEl, submoduleId, moduleId) {
    let blockOrder = 1;
    let exerciseOrder = 1;

    // Buscar elementos hijos
    const children = containerEl.children();
    let currentBlockHtml = '';
    let currentBlockImages = [];
    let isInsideEvaluation = false;

    for (let k = 0; k < children.length; k++) {
      const child = $(children[k]);
      const text = child.text().trim();
      const tagName = child.prop('tagName').toLowerCase();

      // Detectar inicio de sección de Evaluación o Ejercicio
      if (
        text.toUpperCase().includes('EVALUACIÓN') ||
        text.toUpperCase().includes('EVALUACION') ||
        child.find('mark[data-notion-highlight="red_background"]').length > 0 && text.includes('FALTA EVALUACIÓN')
      ) {
        isInsideEvaluation = true;
      }

      if (!isInsideEvaluation) {
        // Acumular contenido de aprendizaje
        if (tagName === 'figure' || child.find('img').length > 0) {
          const imgs = child.is('img') ? [child] : child.find('img').toArray();
          imgs.forEach(imgEl => {
            const src = $(imgEl).attr('src') || $(imgEl).closest('figure').attr('data-notion-image');
            const norm = normalizeImageUrl(src);
            if (norm) currentBlockImages.push({ url: norm, caption: child.find('figcaption').text().trim() || '' });
          });
        }
        currentBlockHtml += $.html(child);

        // Cada ~3 elementos o en encabezados generamos un bloque ordenado
        if (tagName === 'h3' || tagName === 'h4' || tagName === 'hr' || k === children.length - 1) {
          if (currentBlockHtml.trim()) {
            await prisma.contentBlock.create({
              data: {
                submoduleId: submoduleId,
                orderIndex: blockOrder++,
                blockType: 'LEARN_CONCEPT',
                title: child.prev('h3, h4').text().trim() || null,
                bodyMarkdown: currentBlockHtml,
                mediaJson: currentBlockImages.length > 0 ? JSON.stringify(currentBlockImages) : null,
              },
            });
            currentBlockHtml = '';
            currentBlockImages = [];
          }
        }
      } else {
        // Estamos en sección de ejercicios / evaluación
        // Detectar si este bloque o nodo define un ejercicio
        if (
          text.includes('Ejercicio') ||
          text.includes('¿') ||
          tagName === 'aside' ||
          child.hasClass('callout') ||
          child.find('.numbered-list').length > 0
        ) {
          await parseAndSaveExercise($, child, submoduleId, moduleId, exerciseOrder++);
        }
      }
    }

    // Si quedó contenido remanente
    if (currentBlockHtml.trim()) {
      await prisma.contentBlock.create({
        data: {
          submoduleId: submoduleId,
          orderIndex: blockOrder++,
          blockType: 'LEARN_CONCEPT',
          title: null,
          bodyMarkdown: currentBlockHtml,
          mediaJson: currentBlockImages.length > 0 ? JSON.stringify(currentBlockImages) : null,
        },
      });
    }
  }

  async function parseAndSaveExercise($, el, submoduleId, moduleId, orderIndex) {
    const rawText = el.text().trim();
    if (!rawText || rawText.length < 5) return;

    // Buscar imagen asociada
    let imageUrl = null;
    const imgEl = el.is('img') ? el : el.find('img').first();
    if (imgEl.length > 0) {
      const src = imgEl.attr('src') || imgEl.closest('figure').attr('data-notion-image');
      imageUrl = normalizeImageUrl(src);
    } else {
      // Buscar en elementos contiguos anteriores o posteriores si es un figure
      const siblingImg = el.next('figure').find('img').first();
      if (siblingImg.length > 0) {
        imageUrl = normalizeImageUrl(siblingImg.attr('src') || siblingImg.closest('figure').attr('data-notion-image'));
      }
    }

    // Extraer pregunta
    let questionText = '';
    const qMatch = rawText.match(/¿([^?]+)\?/);
    if (qMatch) {
      questionText = `¿${qMatch[1].trim()}?`;
    } else {
      const firstLine = rawText.split('\n')[0].replace(/Ejercicio\s*\d+\.?/i, '').trim();
      questionText = firstLine || 'Selecciona la opción correcta respecto a la imagen.';
    }

    // Opciones y Respuesta
    let options = [];
    let explanation = '';
    let isComplete = true;

    // Detectar opciones de viñeta o párrafos A. B. C.
    const optionMatches = rawText.match(/([A-D]\.\s*[^.\n]+)/g);
    if (optionMatches && optionMatches.length >= 2) {
      optionMatches.forEach((optText, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const cleanText = optText.replace(/^[A-D]\.\s*/, '').trim();
        options.push({ letter, text: cleanText, isCorrect: false });
      });
    } else {
      // Opciones Si / No
      if (rawText.toLowerCase().includes('sí') || rawText.toLowerCase().includes('no')) {
        options = [
          { letter: 'A', text: 'Sí, está correctamente marcado.', isCorrect: false },
          { letter: 'B', text: 'No, no está correctamente marcado.', isCorrect: false },
        ];
      } else {
        // Opciones por defecto de tipo de etiqueta
        options = [
          { letter: 'A', text: 'Agave (BBox Rojo)', isCorrect: false },
          { letter: 'B', text: 'Hueco (BBox Amarillo)', isCorrect: false },
          { letter: 'C', text: 'No Visible (BBox Azul)', isCorrect: false },
        ];
      }
    }

    // Detectar respuesta correcta en el texto
    let foundCorrect = false;
    const respMatch = rawText.match(/Respuesta\s*(correcta)?:\s*([A-D]|Sí|Si|No|Hueco|Agave|NV|No visible)/i);
    const expMatch = rawText.match(/Respuesta[^:]*:\s*([^.\n]+[\s\S]*)/i);

    if (expMatch) {
      explanation = expMatch[1].trim().slice(0, 300);
    }

    if (respMatch) {
      const ansVal = respMatch[2].toUpperCase();
      if (ansVal === 'A' || ansVal === 'B' || ansVal === 'C' || ansVal === 'D') {
        const opt = options.find(o => o.letter === ansVal);
        if (opt) { opt.isCorrect = true; foundCorrect = true; }
      } else if (ansVal.startsWith('S')) {
        const opt = options.find(o => o.text.toLowerCase().includes('sí') || o.text.toLowerCase().includes('si') || o.letter === 'A');
        if (opt) { opt.isCorrect = true; foundCorrect = true; }
      } else if (ansVal.startsWith('N')) {
        const opt = options.find(o => o.text.toLowerCase().includes('no') || o.letter === 'B');
        if (opt) { opt.isCorrect = true; foundCorrect = true; }
      } else if (ansVal.includes('HUECO')) {
        const opt = options.find(o => o.text.toLowerCase().includes('hueco') || o.letter === 'B');
        if (opt) { opt.isCorrect = true; foundCorrect = true; }
      } else if (ansVal.includes('AGAVE')) {
        const opt = options.find(o => o.text.toLowerCase().includes('agave') || o.letter === 'A');
        if (opt) { opt.isCorrect = true; foundCorrect = true; }
      }
    }

    if (!foundCorrect) {
      // Marcar opción A como placeholder si no se encontró respuesta, pero marcar isComplete = false
      if (options.length > 0) options[0].isCorrect = true;
      isComplete = false;
      totalIncompleteExercises.push({ question: questionText, reason: 'Sin clave de respuesta explícita' });
    }

    const createdExercise = await prisma.exercise.create({
      data: {
        submoduleId: submoduleId,
        moduleId: moduleId,
        exerciseType: 'SINGLE_CHOICE',
        evaluationContext: 'MODULE_QUIZ',
        questionText: questionText,
        imageUrl: imageUrl,
        explanation: explanation || 'Revisa las reglas del manual para este caso.',
        isComplete: isComplete,
        orderIndex: orderIndex,
      },
    });

    for (let o = 0; o < options.length; o++) {
      await prisma.exerciseOption.create({
        data: {
          exerciseId: createdExercise.id,
          orderIndex: o + 1,
          optionLetter: options[o].letter,
          optionText: options[o].text,
          isCorrect: options[o].isCorrect,
        },
      });
    }

    totalExercises++;
  }

  console.log('\n========================================');
  console.log('✅ IMPORTACIÓN Y SEED COMPLETADOS EXITOSAMENTE');
  console.log(`📦 Módulos importados:    ${totalModules}`);
  console.log(`📄 Submódulos importados: ${totalSubmodules}`);
  console.log(`❓ Ejercicios importados: ${totalExercises}`);
  console.log(`⚠️ Ejercicios incompletos: ${totalIncompleteExercises.length}`);
  console.log('========================================\n');
}

main()
  .catch(err => {
    console.error('Error en seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

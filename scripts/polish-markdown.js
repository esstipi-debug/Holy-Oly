const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const TARGET_DIRS = [
  'macrocycles/RAW_SOURCES',
  'axon',
  'volta',
  'engines'
];

async function polishMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Si ya tiene Frontmatter (YAML), lo ignoramos para no sobreescribirlo
  if (content.startsWith('---')) {
    console.log(`⏩ Saltando ${path.basename(filePath)} (Ya tiene formato).`);
    return;
  }

  console.log(`🛠️  Puliendo y estructurando: ${path.basename(filePath)}...`);

  const systemPrompt = `
Eres la Inteligencia Artificial Arquitectónica de Holy Oly.
Tu trabajo es tomar este texto crudo y darle un formato Markdown perfecto para ser ingerido por una base de datos vectorial (RAG).
Reglas estrictas:
1. INCLUYE UN FRONTMATTER YAML AL INICIO con las siguientes llaves: 
   - domain: (Determina si es Hyrox, Weightlifting, CrossFit/CompTrain, o Huberman/Salud)
   - engine_category: (Dieta, Pacing, Fuerza Máxima, Recuperación, etc.)
   - target: (De Principiante a Élite)
2. Mantén TODO el contenido original, no resumas información ni quites detalles médicos o matemáticos.
3. Asegura que los títulos sean descriptivos usando jerarquía estricta (##, ###).
4. Si hay fórmulas, asegúrate de que usen formato de bloque ($$).
`;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ],
      temperature: 0.1, // Para mantenerlo analítico y evitar que invente cosas
    });

    const polishedContent = response.data.choices[0].message.content;
    
    // Sobrescribir el archivo original con la versión limpia, formateada y con metadatos
    fs.writeFileSync(filePath, polishedContent, 'utf-8');
    console.log(`✅ Archivo pulido con éxito: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error procesando ${path.basename(filePath)}:`, error.message);
  }
}

async function runPolisher() {
  console.log('🧼 Iniciando Sistema de Pulido Automatizado (RAG Pre-processor)...');
  let allFiles = [];
  
  const findFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        findFiles(fullPath);
      } else if (fullPath.endsWith('.md') || fullPath.endsWith('.txt')) {
        allFiles.push(fullPath);
      }
    }
  };

  TARGET_DIRS.forEach(dir => findFiles(path.resolve(__dirname, '..', dir)));
  console.log(`Buscando posibles inconsistencias en ${allFiles.length} archivos...`);

  // Procesar secuencialmente (o podrías usar Promise.all con precaución para no saturar la API)
  for (const file of allFiles) {
    await polishMarkdownFile(file);
  }

  console.log('🏁 Sistema de Pulido Finalizado. Todos los archivos están listos para la digestión en Supabase.');
}

runPolisher().catch(console.error);

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// 1. Configuración de clientes (Supabase y OpenAI)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// Carpetas de Holy Oly donde se encuentra la teoría
const TARGET_DIRS = [
  'macrocycles/RAW_SOURCES',
  'axon',
  'volta',
  'engines'
];

async function generateEmbeddings() {
  console.log('🚀 Iniciando Pipeline RAG automatizado para Holy Oly...');

  let allFiles = [];
  
  // Buscar archivos de Markdown
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
  console.log(`Encontrados ${allFiles.length} documentos para procesar.`);

  for (const filePath of allFiles) {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    
    // Chunking súper rudimentario (Separar por dobles saltos de línea o títulos)
    // Para entornos en producción se recomienda LangChain MarkdownTextSplitter
    const chunks = rawContent.split(/\n\n#+/).map(chunk => chunk.trim()).filter(Boolean);

    for (const chunk of chunks) {
      if (chunk.length < 50) continue; // Ignorar chunks vacíos o muy cortos

      console.log(`Generando embedding para chunk de: ${path.basename(filePath)}`);
      
      // Llamar a OpenAI para el embedding (1536 dimensiones)
      const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      const embeddingVector = embeddingResponse.data.data[0].embedding;

      // Ingestar vector en Supabase
      const { error } = await supabase.from('documents').upsert({
        content: chunk,
        metadata: { source: filePath, filename: path.basename(filePath) },
        embedding: embeddingVector
      });

      if (error) {
        console.error(`Error guardando en Supabase:`, error.message);
      }
    }
  }

  console.log('✅ Pipeline completado. Supabase RAG actualizado.');
}

generateEmbeddings().catch(console.error);

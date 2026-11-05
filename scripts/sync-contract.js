const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetSpecPath = path.join(__dirname, '..', 'contracts', 'openapi.json');
const generatedTsPath = path.join(__dirname, '..', 'src', 'shared', 'api', 'generated.ts');

const sourceUrl = process.env.CONTRACT_SOURCE_URL || 'http://localhost:3001/openapi.json';
const sourceFile = process.env.CONTRACT_SOURCE_FILE || path.join(__dirname, '..', '..', 'server', 'documentation', 'api', 'openapi.json');

async function syncContract() {
  console.log('[contract:sync] Iniciando sincronización del contrato OpenAPI...');

  let specContent = null;

  // Intento 1: Descargar desde URL si el servidor está arriba
  try {
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      specContent = await response.text();
      console.log(`[contract:sync] Spec descargado exitosamente desde URL: ${sourceUrl}`);
    }
  } catch (err) {
    // Servidor no disponible en vivo
  }

  // Intento 2: Copiar desde archivo local exportado por server si existe
  if (!specContent && fs.existsSync(sourceFile)) {
    try {
      specContent = fs.readFileSync(sourceFile, 'utf8');
      console.log(`[contract:sync] Spec copiado desde archivo local: ${sourceFile}`);
    } catch (err) {
      // Continuar al fallback
    }
  }

  // Si se obtuvo nuevo contenido, actualizar copia versionada
  if (specContent) {
    fs.mkdirSync(path.dirname(targetSpecPath), { recursive: true });
    fs.writeFileSync(targetSpecPath, specContent, 'utf8');
  } else {
    console.log('[contract:sync] Usando copia versionada existente en contracts/openapi.json');
  }

  // Generar tipos de TypeScript con openapi-typescript
  try {
    fs.mkdirSync(path.dirname(generatedTsPath), { recursive: true });
    execSync(`npx openapi-typescript "${targetSpecPath}" -o "${generatedTsPath}"`, {
      stdio: 'inherit',
    });
    console.log(`[contract:sync] Tipos TypeScript generados exitosamente en: ${generatedTsPath}`);
  } catch (err) {
    console.error('[contract:sync] Error generando tipos con openapi-typescript:', err.message);
    process.exit(1);
  }
}

syncContract();

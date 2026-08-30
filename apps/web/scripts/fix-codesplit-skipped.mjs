import fs from 'fs';
import path from 'path';

const baseDir = 'D:\\Danta\\apps\\web\\src\\routes';

const files = [
  'dashboard/index.tsx',
  'patient-portal/dashboard/index.tsx',
  'patient-portal/appointments/index.tsx',
  'patient-portal/billing/index.tsx',
  'patient-portal/documents/index.tsx',
  'patient-portal/forms/index.tsx',
  'patient-portal/messages/index.tsx',
  'patient-portal/notifications/index.tsx',
  'patient-portal/payments/index.tsx',
  'patient-portal/treatment-plans/index.tsx',
];

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

let processed = 0;
let skipped = 0;
let errors = 0;

for (const relPath of files) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`);
    skipped++;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  const routeExportMatch = content.match(/export\s+const\s+Route\s*=/);
  if (!routeExportMatch) {
    console.log(`SKIP (no Route export): ${relPath}`);
    skipped++;
    continue;
  }

  const routeExportStart = routeExportMatch.index;
  const afterRouteExport = content.slice(routeExportStart);
  const componentMatch = afterRouteExport.match(/component:\s*(\w+)/);
  if (!componentMatch) {
    console.log(`SKIP (no component found): ${relPath}`);
    skipped++;
    continue;
  }

  const pageName = componentMatch[1];
  
  const funcMatch = content.match(new RegExp(`export\\s+function\\s+${pageName}\\s*\\(`));
  if (!funcMatch) {
    console.log(`SKIP (function not found): ${relPath} (${pageName})`);
    skipped++;
    continue;
  }

  const routeIndex = routeExportStart;
  const beforeRoute = content.slice(0, routeIndex).trimEnd();
  const routeExport = content.slice(routeIndex).trim();
  
  const beforeRouteLines = beforeRoute.split('\n');
  let lastImportIdx = -1;
  for (let i = beforeRouteLines.length - 1; i >= 0; i--) {
    if (beforeRouteLines[i].trim().startsWith('import ')) {
      lastImportIdx = i;
      break;
    }
  }
  
  if (lastImportIdx === -1) {
    console.log(`SKIP (no imports found): ${relPath}`);
    skipped++;
    continue;
  }

  const afterImportsButBeforeRoute = beforeRouteLines.slice(lastImportIdx + 1).join('\n');
  
  const importLines = beforeRouteLines.slice(0, lastImportIdx + 1);
  const indexImports = [];
  const pageImports = [];
  
  for (const line of importLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('import ')) {
      indexImports.push(line);
      continue;
    }
    
    const isFromTanstackRouter = line.includes("from '@tanstack/react-router'") || line.includes('from "@tanstack/react-router"');
    const hasCreateFileRoute = line.includes('createFileRoute');
    
    if (isFromTanstackRouter && hasCreateFileRoute) {
      const match = line.match(/import\s+\{([^}]*)\}/);
      if (match) {
        const parts = match[1].split(',').map(s => s.trim()).filter(s => s && s !== 'createFileRoute');
        if (parts.length > 0) {
          indexImports.push("import { createFileRoute } from '@tanstack/react-router';");
          pageImports.push(`import { ${parts.join(', ')} } from '@tanstack/react-router';`);
        } else {
          indexImports.push(line);
        }
      } else {
        indexImports.push(line);
      }
    } else if (isFromTanstackRouter && !hasCreateFileRoute) {
      pageImports.push(line);
    } else {
      pageImports.push(line);
    }
  }

  const newFileName = `-${toKebabCase(pageName)}.tsx`;
  const dir = path.dirname(fullPath);
  const newFilePath = path.join(dir, newFileName);
  
  const pageFileContent = [
    ...pageImports,
    '',
    content.slice(routeIndex).trimEnd()
  ].join('\n');
  
  const indexFileContent = [
    ...indexImports,
    `import { ${pageName} } from './${newFileName}';`,
    afterImportsButBeforeRoute,
    routeExport
  ].join('\n');

  fs.writeFileSync(newFilePath, pageFileContent);
  fs.writeFileSync(fullPath, indexFileContent);

  console.log(`OK: ${relPath} -> ${path.relative(baseDir, newFilePath)}`);
  processed++;
}

console.log(`\nProcessed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);

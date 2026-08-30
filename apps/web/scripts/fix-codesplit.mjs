import fs from 'fs';
import path from 'path';

const baseDir = 'D:\\Danta\\apps\\web\\src\\routes';

const files = [
  'settings/organisation/index.tsx',
  'settings/practice/index.tsx',
  'settings/locations/index.tsx',
  'settings/security/index.tsx',
  'settings/index.tsx',
  'api-keys/index.tsx',
  'audit/index.tsx',
  'availability/index.tsx',
  'chairs/index.tsx',
  'claim-integrations/index.tsx',
  'providers/index.tsx',
  'users/index.tsx',
  'roles/index.tsx',
  'locations/index.tsx',
  'calendar/index.tsx',
  'appointment-types/index.tsx',
  'appointment-reminders/index.tsx',
  'clinical-notes/index.tsx',
  'dental-charts/index.tsx',
  'templates/index.tsx',
  'tooth-conditions/index.tsx',
  'treatment-history/index.tsx',
  'treatment-plans/index.tsx',
  'periodontal-records/index.tsx',
  'appointments/index.tsx',
  'invoices/index.tsx',
  'payments/index.tsx',
  'refunds/index.tsx',
  'receipts/index.tsx',
  'statements/index.tsx',
  'fees/index.tsx',
  'messages/index.tsx',
  'communication-templates/index.tsx',
  'communication-preferences/index.tsx',
  'reports/index.tsx',
  'reports/dashboard/index.tsx',
  'reports/production/index.tsx',
  'reports/collections/index.tsx',
  'reports/appointments/index.tsx',
  'reports/practitioners/index.tsx',
  'reports/recalls/index.tsx',
  'reports/patients/index.tsx',
  'login/index.tsx',
  'register/index.tsx',
  'forbidden/index.tsx',
  'unauthorized/index.tsx',
  'notifications/index.tsx',
  'dashboard/index.tsx',
  'imaging-images/index.tsx',
  'imaging-studies/index.tsx',
  'imaging-integrations/index.tsx',
  'patient-portal/dashboard/index.tsx',
  'patient-portal/appointments/index.tsx',
  'patient-portal/billing/index.tsx',
  'patient-portal/documents/index.tsx',
  'patient-portal/forms/index.tsx',
  'patient-portal/login/index.tsx',
  'patient-portal/messages/index.tsx',
  'patient-portal/notifications/index.tsx',
  'patient-portal/payments/index.tsx',
  'patient-portal/treatment-plans/index.tsx',
  'patients/index.tsx',
  'patients/$id.tsx',
  'recalls/index.tsx',
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
  const pageMatch = content.match(/export\s+function\s+(\w+Page)\s*\(/);
  if (!pageMatch) {
    console.log(`SKIP (no page component): ${relPath}`);
    skipped++;
    continue;
  }

  const pageName = pageMatch[1];
  const routeMatch = content.match(/export\s+const\s+Route\s*=/);
  if (!routeMatch) {
    console.log(`SKIP (no Route export): ${relPath}`);
    skipped++;
    continue;
  }

  const routeIndex = routeMatch.index;
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

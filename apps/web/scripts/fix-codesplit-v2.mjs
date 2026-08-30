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

function splitImports(content) {
  const lines = content.split('\n');
  const imports = [];
  let currentImport = null;
  
  for (const line of lines) {
    if (/^\s*import\s/.test(line)) {
      if (currentImport !== null) {
        imports.push(currentImport);
      }
      currentImport = line;
    } else if (currentImport !== null) {
      currentImport += '\n' + line;
      if (line.includes(';')) {
        imports.push(currentImport);
        currentImport = null;
      }
    }
  }
  if (currentImport !== null) {
    imports.push(currentImport);
  }
  
  return imports;
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
  
  const routeMatch = content.match(/export\s+const\s+Route\s*=/);
  if (!routeMatch) {
    console.log(`SKIP (no Route export): ${relPath}`);
    skipped++;
    continue;
  }

  const routeIndex = routeMatch.index;
  
  const afterRoute = content.slice(routeIndex);
  const componentMatch = afterRoute.match(/component:\s*(\w+)/);
  if (!componentMatch) {
    console.log(`SKIP (no component in Route): ${relPath}`);
    skipped++;
    continue;
  }

  const pageName = componentMatch[1];
  
  const funcRegex = new RegExp(`export\\s+function\\s+${pageName}\\s*\\(`);
  const funcMatch = content.match(funcRegex);
  if (!funcMatch) {
    console.log(`SKIP (function not found): ${relPath} (${pageName})`);
    skipped++;
    continue;
  }

  // Find the end of the Route export block
  const routeBlockMatch = content.slice(routeIndex).match(/^export\s+const\s+Route\s*=[\s\S]*?^\}\);/m);
  const routeBlockEnd = routeBlockMatch ? routeIndex + routeBlockMatch[0].length : routeIndex;
  
  const beforeRoute = content.slice(0, routeIndex).trimEnd();
  const routeExport = content.slice(routeIndex, routeBlockEnd).trim();
  const afterRouteExport = content.slice(routeBlockEnd).trimStart();
  
  // Split imports
  const allImports = splitImports(beforeRoute);
  
  const indexImports = [];
  const pageImports = [];
  let foundCreateFileRoute = false;
  
  for (const imp of allImports) {
    const isFromTanstackRouter = imp.includes("from '@tanstack/react-router'") || imp.includes('from "@tanstack/react-router"');
    const hasCreateFileRoute = imp.includes('createFileRoute');
    
    if (isFromTanstackRouter && hasCreateFileRoute) {
      foundCreateFileRoute = true;
      const otherNames = [];
      const match = imp.match(/import\s+\{([^}]*)\}/);
      if (match) {
        const names = match[1].split(',').map(s => s.trim()).filter(s => s && s !== 'createFileRoute');
        otherNames.push(...names);
      }
      indexImports.push("import { createFileRoute } from '@tanstack/react-router';");
      if (otherNames.length > 0) {
        pageImports.push(`import { ${otherNames.join(', ')} } from '@tanstack/react-router';`);
      }
    } else if (isFromTanstackRouter && !hasCreateFileRoute) {
      pageImports.push(imp);
    } else {
      pageImports.push(imp);
    }
  }

  if (!foundCreateFileRoute) {
    console.log(`SKIP (no createFileRoute import): ${relPath}`);
    skipped++;
    continue;
  }

  const newFileName = `-${toKebabCase(pageName)}.tsx`;
  const dir = path.dirname(fullPath);
  const newFilePath = path.join(dir, newFileName);
  
  // Page file: its imports + everything after Route export
  const pageFileContent = [...pageImports, '', afterRouteExport].join('\n');
  
  // Index file: its imports + import of page component + Route export
  const indexFileContent = [...indexImports, `import { ${pageName} } from './${newFileName}';`, '', routeExport].join('\n');

  fs.writeFileSync(newFilePath, pageFileContent);
  fs.writeFileSync(fullPath, indexFileContent);

  console.log(`OK: ${relPath} -> ${path.relative(baseDir, newFilePath)}`);
  processed++;
}

console.log(`\nProcessed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);

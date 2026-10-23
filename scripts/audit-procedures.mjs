// Reproducible source audit; this is not physical recipe validation.
import {readFileSync, writeFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/procedure.ts','utf8').replace('import { isPreparation } from "./preparations";', 'const isPreparation = (r: any) => r.categoryId.startsWith("prep-");');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {getProcedure}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const catalog=JSON.parse(readFileSync('public/recipes.json','utf8'));
const rows=catalog.recipes.map(r=>{const p=getProcedure(r);return {id:r.id,name:r.englishName,verification:r.verification,originalSteps:r.steps.length,detailedSteps:p.steps.length,method:p.method,originalCupSizes:r.cupSizes,proposedTrialCup:p.proposedCup,warnings:p.warnings};});
writeFileSync('docs/procedure-audit.json', JSON.stringify({notice:'Source and generated instruction coverage only. No physical preparation or taste validation implied.',recipes:rows.length,withWarnings:rows.filter(r=>r.warnings.length).length,withMissingOriginalCup:rows.filter(r=>!r.originalCupSizes.length&&!r.id.startsWith('prep-')).length,rows},null,2)+'\n');
console.log(JSON.stringify({recipes:rows.length,minDetailedSteps:Math.min(...rows.map(r=>r.detailedSteps)),withWarnings:rows.filter(r=>r.warnings.length).length}));

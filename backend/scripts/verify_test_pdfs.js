import fs from 'fs';
import path from 'path';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const desktopDir = 'c:/Users/govin/OneDrive/Desktop';
const outDir = path.resolve('scratch_resumes');
const browserDir = 'C:/Users/govin/.gemini/antigravity-ide/brain/fb3830ae-a4af-47e1-9705-f696fbe75c1a/browser';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const file1 = path.join(desktopDir, '2tanisha.pdf');
const file2 = path.join(desktopDir, 'tanisha5.pdf');

// Copy to workspace scratch directory
fs.copyFileSync(file1, path.join(outDir, 'resume_1.pdf'));
fs.copyFileSync(file2, path.join(outDir, 'resume_2.pdf'));
fs.copyFileSync(file1, path.join(outDir, 'resume_3.pdf'));
fs.copyFileSync(file2, path.join(outDir, 'resume_4.pdf'));

// Copy to browser subagent folder
fs.copyFileSync(file1, path.join(browserDir, 'resume_1.pdf'));
fs.copyFileSync(file2, path.join(browserDir, 'resume_2.pdf'));
fs.copyFileSync(file1, path.join(browserDir, 'resume_3.pdf'));
fs.copyFileSync(file2, path.join(browserDir, 'resume_4.pdf'));

console.log("Copied 4 resumes into both scratch_resumes and browser directory!");

async function verifyPDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const parsedPdf = await pdf(fileBuffer);
    console.log(`Successfully parsed: ${path.basename(filePath)}`);
    console.log(`Text Length: ${parsedPdf.text.length}`);
  } catch (err) {
    console.error(`Error parsing ${path.basename(filePath)}:`, err.message);
  }
}

async function main() {
  await verifyPDF(path.join(outDir, 'resume_1.pdf'));
  await verifyPDF(path.join(outDir, 'resume_2.pdf'));
}
main();

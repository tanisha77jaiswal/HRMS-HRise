import fs from 'fs';
import path from 'path';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const outDir = path.resolve('scratch_resumes');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

function createMinimalPDF(filename, name, role, skills, experience) {
  const streamText = `BT
/F1 12 Tf
70 750 Td (${name} - ${role}) Tj
70 730 Td (Experience: ${experience}) Tj
70 710 Td (Skills: ${skills.join(', ')}) Tj
ET`;

  const streamLength = streamText.length;

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamText}
streamend
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000282 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`;

  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, pdfContent, 'utf-8');
  console.log(`Generated: ${filePath}`);
}

createMinimalPDF('john_doe.pdf', 'John Doe', 'Senior React Developer', ['React', 'Node.js', 'TypeScript', 'MongoDB'], '5 years');
createMinimalPDF('jane_smith.pdf', 'Jane Smith', 'Backend Engineer', ['Node.js', 'Express', 'PostgreSQL', 'Docker'], '4 years');
createMinimalPDF('bob_johnson.pdf', 'Bob Johnson', 'Product Manager', ['Product Strategy', 'Agile', 'Scrum', 'Jira'], '6 years');
createMinimalPDF('alice_williams.pdf', 'Alice Williams', 'Sales Executive', ['Lead Generation', 'Sales Pitch', 'Negotiation', 'CRM'], '3 years');

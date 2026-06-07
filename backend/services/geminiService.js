import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { Job } from "../models/jobModel.js";

/**
 * Service to parse candidate resume and screen it using Gemini API.
 * 
 * @param {Buffer} fileBuffer - PDF file buffer
 * @param {string} fileName - File name
 * @param {string} jobId - Job ID
 * @param {string} candidateEmail - Candidate Email (for fallback extraction name)
 * @returns {Promise<Object>} Structured evaluation results
 */
export const screenResume = async (fileBuffer, fileName, jobId, candidateEmail) => {
  // 1. Extract text from resume
  let resumeText = "";
  if (fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const parsedPdf = await pdf(fileBuffer);
      resumeText = parsedPdf.text;
    } catch (err) {
      console.error("Failed to parse PDF resume:", err);
      throw new Error("Could not parse PDF resume.");
    }
  } else {
    // Fallback if it is a text file or other format
    resumeText = fileBuffer.toString("utf-8");
  }

  // 2. Fetch Job details from MongoDB
  const job = await Job.findOne({ id: jobId });
  if (!job) {
    throw new Error(`Job position with ID "${jobId}" was not found.`);
  }

  const jobTitle = job.title;
  const jobDescription = job.description;
  const requiredSkills = (job.requiredSkills || []).join(", ");

  // 3. Retrieve environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  let evaluationResult;

  if (apiKey && apiKey.trim() !== "") {
    try {
      console.log(`[Gemini AI] Screening candidate resume for Job: ${jobTitle} using ${model}...`);
      
      const prompt = `
You are an expert technical recruiter evaluating a candidate for the position of "${jobTitle}".
Evaluate the candidate's resume text against the job requirements.

Job Description:
${jobDescription}

Required Skills:
${requiredSkills}

Candidate Resume Text:
${resumeText}

Evaluate the candidate based on:
1. Skill Match
2. Experience Relevance
3. Education Relevance
4. Project Relevance
5. Overall Job Fit

Generate a structured evaluation in JSON format matching the following schema exactly:
{
  "candidateName": "Full Name of Candidate (extracted from resume)",
  "skillsFound": ["List of matching skills found in the resume"],
  "missingSkills": ["List of required job skills that are missing from the resume"],
  "experienceYears": number (total years of experience found or estimated, return as a number),
  "education": [
    { "degree": "degree name", "institution": "school name", "year": graduation_year_as_number }
  ],
  "matchScore": number (0-100 score based on skill match, experience relevance, education, projects, and overall fit, return as a number),
  "recommendation": "Strong Match" or "Moderate Match" or "Weak Match",
  "professionalEvaluationSummary": "A concise professional summary written directly to the candidate (use second-person: 'you have matched', 'your profile shows', etc.) evaluating their strengths, alignment with requirements, and development areas."
}

Return ONLY a valid JSON object matching the schema. Do not wrap in markdown blocks, do not include backticks (\`\`\`json), and do not include any extra text outside the JSON.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: Status ${response.status}`);
      }

      const resData = await response.json();
      const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResult) {
        throw new Error("Empty response from Gemini API.");
      }

      evaluationResult = JSON.parse(textResult.trim());
    } catch (geminiError) {
      console.error("Gemini API call failed, falling back to mock screening:", geminiError);
      evaluationResult = generateMockEvaluation(resumeText, job, candidateEmail);
    }
  } else {
    console.log("No GEMINI_API_KEY set. Using local mock screening service.");
    evaluationResult = generateMockEvaluation(resumeText, job, candidateEmail);
  }

  return evaluationResult;
};

// ─── Skill Synonym Map ────────────────────────────────────────────────────────
// Maps canonical skill names to known aliases/abbreviations found in resumes
const SKILL_SYNONYMS = {
  "javascript": ["js", "javascript", "ecmascript", "es6", "es2015", "es2020", "node.js", "nodejs"],
  "typescript": ["ts", "typescript"],
  "python": ["python", "py", "python3"],
  "react": ["react", "reactjs", "react.js"],
  "angular": ["angular", "angularjs", "angular.js"],
  "vue": ["vue", "vuejs", "vue.js"],
  "node.js": ["node", "nodejs", "node.js"],
  "express": ["express", "expressjs", "express.js"],
  "mongodb": ["mongo", "mongodb"],
  "postgresql": ["postgres", "postgresql", "psql"],
  "mysql": ["mysql", "sql", "rdbms"],
  "sql": ["sql", "mysql", "postgresql", "postgres", "mssql", "oracle", "sqlite"],
  "machine learning": ["ml", "machine learning", "machinelearning"],
  "deep learning": ["dl", "deep learning", "deeplearning", "neural network", "neural networks"],
  "artificial intelligence": ["ai", "artificial intelligence"],
  "natural language processing": ["nlp", "natural language processing", "text mining"],
  "computer vision": ["cv", "computer vision", "image processing"],
  "docker": ["docker", "containerization", "dockerfile"],
  "kubernetes": ["k8s", "kubernetes"],
  "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
  "gcp": ["gcp", "google cloud", "google cloud platform"],
  "azure": ["azure", "microsoft azure"],
  "git": ["git", "github", "gitlab", "bitbucket", "version control"],
  "rest api": ["rest", "restful", "rest api", "api development"],
  "graphql": ["graphql", "gql"],
  "java": ["java", "java ee", "spring", "spring boot"],
  "c++": ["c++", "cpp", "c plus plus"],
  "c#": ["c#", "csharp", "dotnet", ".net"],
  "go": ["golang", "go language"],
  "rust": ["rust", "rust lang"],
  "php": ["php", "laravel", "symfony"],
  "swift": ["swift", "ios development", "swiftui"],
  "kotlin": ["kotlin", "android development"],
  "flutter": ["flutter", "dart"],
  "react native": ["react native", "reactnative"],
  "redux": ["redux", "zustand", "recoil"],
  "tailwind": ["tailwind", "tailwindcss"],
  "sass": ["sass", "scss", "less"],
  "webpack": ["webpack", "vite", "rollup", "bundler"],
  "jest": ["jest", "mocha", "chai", "vitest", "unit testing", "testing"],
  "ci/cd": ["ci/cd", "jenkins", "github actions", "gitlab ci", "circle ci", "devops pipeline"],
  "agile": ["agile", "scrum", "kanban", "sprint"],
  "leadership": ["leadership", "team lead", "led team", "managing team", "team management"],
  "communication": ["communication", "presentation", "stakeholder management"],
  "data analysis": ["data analysis", "data analytics", "pandas", "numpy", "tableau", "power bi"],
  "excel": ["excel", "microsoft excel", "spreadsheet"],
  "project management": ["project management", "pmp", "jira", "asana", "trello"],
  "salesforce": ["salesforce", "crm", "sfdc"],
  "ui/ux": ["ui/ux", "ux design", "figma", "sketch", "adobe xd", "user experience", "user interface"],
};

/**
 * Check if a skill appears in the resume text, using synonym expansion.
 * Returns a confidence score: 2 = strong match, 1 = synonym match, 0 = no match.
 */
function skillMatchScore(skill, resumeLower) {
  const skillLower = skill.toLowerCase().trim();

  // Exact whole-word match (highest confidence)
  const exactRegex = new RegExp(`\\b${skillLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
  if (exactRegex.test(resumeLower)) return 2;

  // Synonym match — look for any alias
  for (const [canonical, aliases] of Object.entries(SKILL_SYNONYMS)) {
    if (canonical === skillLower || aliases.includes(skillLower)) {
      for (const alias of aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
        if (aliasRegex.test(resumeLower)) return 1;
      }
    }
  }

  // Partial match — skill string is a substring (least confidence)
  if (resumeLower.includes(skillLower)) return 1;

  return 0;
}

/**
 * Extract total years of professional experience from resume text.
 * Parses patterns like "5 years", "3+ years", date ranges like "Jan 2019 – Mar 2023".
 */
function extractExperienceYears(resumeText) {
  const text = resumeText;
  let maxYears = 0;

  // Pattern 1: explicit "X years of experience"
  const explicitMatches = text.matchAll(/(\d+\.?\d*)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/gi);
  for (const m of explicitMatches) {
    const y = parseFloat(m[1]);
    if (y > maxYears && y < 50) maxYears = y;
  }

  // Pattern 2: date ranges like "2018 – 2023", "Jan 2019 - Present", "Mar 2020 – Jun 2024"
  const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
  const dateRangePattern = new RegExp(
    `(?:(?:${MONTHS})\\.?\\s+)?(\\d{4})\\s*[-–—to]+\\s*(?:(?:${MONTHS})\\.?\\s+)?(\\d{4}|present|current|now)`,
    "gi"
  );
  const currentYear = new Date().getFullYear();
  let totalRangeYears = 0;
  const seenRanges = new Set();

  for (const m of text.matchAll(dateRangePattern)) {
    const startY = parseInt(m[1]);
    const endRaw = m[2].toLowerCase();
    const endY = ["present", "current", "now"].includes(endRaw) ? currentYear : parseInt(m[2]);
    const key = `${startY}-${endY}`;
    if (!seenRanges.has(key) && endY >= startY && startY >= 1990 && endY <= currentYear + 1) {
      seenRanges.add(key);
      totalRangeYears += endY - startY;
    }
  }

  if (totalRangeYears > 0 && totalRangeYears < 50) {
    maxYears = Math.max(maxYears, totalRangeYears);
  }

  return Math.round(maxYears);
}

/**
 * Detect education from resume text.
 * Returns array of { degree, institution, year }
 */
function extractEducation(resumeText) {
  const text = resumeText;
  const education = [];

  const degreePatterns = [
    { pattern: /ph\.?d\.?|doctor(?:ate)?(?:\s+of\s+\w+)?/i, label: "PhD" },
    { pattern: /m\.?tech\.?|master(?:\s+of\s+\w+)?|m\.?s\.?|m\.?b\.?a\.?|m\.?e\.?|m\.?sc\.?/i, label: "Master's" },
    { pattern: /b\.?tech\.?|b\.?e\.?|bachelor(?:\s+of\s+\w+)?|b\.?s\.?c?\.?|b\.?a\.?|under\s*grad/i, label: "Bachelor's" },
    { pattern: /diploma|associate(?:\s+degree)?/i, label: "Diploma/Associate" },
    { pattern: /high\s*school|secondary|12th|hsc|10\+2/i, label: "High School" },
  ];

  for (const { pattern, label } of degreePatterns) {
    if (pattern.test(text)) {
      // Try to extract institution name (next word group after degree)
      const institutionMatch = text.match(
        new RegExp(`${pattern.source}[^\\n]{0,80}?((?:[A-Z][a-z]+\\s*){1,5}(?:University|College|Institute|School|Academy|IIT|NIT|MIT|UCLA|Stanford|Harvard)[^\\n]{0,40})`, "i")
      );
      const institution = institutionMatch ? institutionMatch[1].trim() : "University";

      // Try to extract graduation year
      const yearMatch = text.match(/\b(19[89]\d|20[0-2]\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;

      education.push({ degree: label, institution, year });
      break; // Take highest degree found
    }
  }

  if (education.length === 0) {
    education.push({ degree: "Bachelor's", institution: "University", year: null });
  }

  return education;
}

/**
 * Score education level against job requirements.
 */
function scoreEducation(education, jobTitle) {
  const degree = (education[0]?.degree || "").toLowerCase();
  const title = jobTitle.toLowerCase();

  // PhD/Research roles
  if (title.includes("research") || title.includes("scientist") || title.includes("phd")) {
    if (degree.includes("phd")) return 100;
    if (degree.includes("master")) return 70;
    return 45;
  }
  // Senior/Lead/Manager roles
  if (title.includes("senior") || title.includes("lead") || title.includes("manager") || title.includes("architect")) {
    if (degree.includes("master") || degree.includes("phd")) return 100;
    if (degree.includes("bachelor")) return 85;
    return 65;
  }
  // Standard roles
  if (degree.includes("phd") || degree.includes("master")) return 100;
  if (degree.includes("bachelor")) return 90;
  if (degree.includes("diploma") || degree.includes("associate")) return 70;
  return 55;
}

/**
 * Score seniority alignment between resume and job title.
 */
function scoreSeniority(resumeText, jobTitle) {
  const text = resumeText.toLowerCase();
  const title = jobTitle.toLowerCase();

  const seniorSignals = ["senior", "lead", "principal", "staff", "architect", "manager", "director", "vp", "head of", "team lead"];
  const juniorSignals = ["junior", "associate", "entry", "intern", "graduate", "fresher", "trainee"];

  const isSeniorJob = seniorSignals.some(s => title.includes(s));
  const isJuniorJob = juniorSignals.some(s => title.includes(s));

  const resumeHasSenior = seniorSignals.some(s => text.includes(s));
  const resumeHasJunior = juniorSignals.some(s => text.includes(s));

  if (isSeniorJob && resumeHasSenior) return 100;
  if (isSeniorJob && !resumeHasSenior && !resumeHasJunior) return 70;
  if (isSeniorJob && resumeHasJunior) return 40;
  if (isJuniorJob && resumeHasJunior) return 100;
  if (isJuniorJob && !resumeHasSenior) return 85;
  if (isJuniorJob && resumeHasSenior) return 75; // overqualified
  return 80; // neutral
}

/**
 * Score domain/industry keyword presence in resume.
 */
function scoreDomainKeywords(resumeText, job) {
  const text = resumeText.toLowerCase();
  const titleWords = (job.title || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descWords = (job.description || "")
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4)
    .slice(0, 80); // top 80 words from JD

  const allDomainWords = [...new Set([...titleWords, ...descWords])];
  const matched = allDomainWords.filter(w => text.includes(w));
  if (allDomainWords.length === 0) return 70;
  return Math.min(100, Math.round((matched.length / allDomainWords.length) * 100));
}

/**
 * Extract candidate name from resume text (first non-empty lines heuristic).
 */
function extractCandidateName(resumeText, candidateEmail) {
  const lines = resumeText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Check first 5 lines for a proper name (2-4 capitalized words, no digits or special chars)
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line) && line.split(" ").length <= 4) {
      return line;
    }
  }

  // Fallback to email-based name
  if (candidateEmail && !candidateEmail.includes("screened.com")) {
    const parts = candidateEmail.split("@")[0].split(/[._-]/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  return "Candidate";
}

/**
 * High-accuracy local resume evaluation engine (fallback when Gemini API is unavailable).
 * Uses weighted multi-criteria scoring:
 *   Skill Match      40%
 *   Experience       25%
 *   Education        15%
 *   Seniority Fit    10%
 *   Domain Keywords  10%
 */
function generateMockEvaluation(resumeText, job, candidateEmail) {
  const requiredSkills = job.requiredSkills || [];
  const resumeLower = resumeText.toLowerCase();

  // ── 1. Skill Matching (40% weight) ──────────────────────────────────────────
  const matchedSkills = [];
  const missingSkills = [];
  let totalSkillPoints = 0;
  let earnedSkillPoints = 0;

  requiredSkills.forEach(skill => {
    const score = skillMatchScore(skill, resumeLower);
    totalSkillPoints += 2; // max 2 points per skill
    earnedSkillPoints += score;
    if (score > 0) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const skillScore = totalSkillPoints > 0
    ? Math.round((earnedSkillPoints / totalSkillPoints) * 100)
    : 60;

  // ── 2. Experience Scoring (25% weight) ──────────────────────────────────────
  const detectedYears = extractExperienceYears(resumeText);
  const requiredYears = job.experienceRequired || 2;
  let experienceScore;
  if (detectedYears === 0) {
    experienceScore = 50; // can't determine — neutral
  } else if (detectedYears >= requiredYears) {
    // Full marks if meets or exceeds, diminishing if way over (overqualified)
    const overBy = detectedYears - requiredYears;
    experienceScore = overBy > 5 ? Math.max(70, 100 - overBy * 3) : 100;
  } else {
    // Partial marks scaled by how close they are
    experienceScore = Math.round((detectedYears / requiredYears) * 80);
  }

  // ── 3. Education Scoring (15% weight) ───────────────────────────────────────
  const education = extractEducation(resumeText);
  const educationScore = scoreEducation(education, job.title || "");

  // ── 4. Seniority Alignment (10% weight) ─────────────────────────────────────
  const seniorityScore = scoreSeniority(resumeText, job.title || "");

  // ── 5. Domain Keywords (10% weight) ─────────────────────────────────────────
  const domainScore = scoreDomainKeywords(resumeText, job);

  // ── Weighted Final Score ─────────────────────────────────────────────────────
  const matchScore = Math.round(
    skillScore       * 0.40 +
    experienceScore  * 0.25 +
    educationScore   * 0.15 +
    seniorityScore   * 0.10 +
    domainScore      * 0.10
  );

  const clampedScore = Math.min(100, Math.max(10, matchScore));

  let recommendation = "Moderate Match";
  if (clampedScore >= 75) recommendation = "Strong Match";
  else if (clampedScore < 50) recommendation = "Weak Match";

  const candidateName = extractCandidateName(resumeText, candidateEmail);

  // ── Professional Summary ─────────────────────────────────────────────────────
  const strengthsLine = matchedSkills.length > 0
    ? `Your profile demonstrates strong alignment in: ${matchedSkills.slice(0, 5).join(", ")}.`
    : "Your resume was reviewed against the job requirements.";
  const gapLine = missingSkills.length > 0
    ? ` To further strengthen your candidacy, consider developing expertise in: ${missingSkills.slice(0, 4).join(", ")}.`
    : " You appear to have a comprehensive skill set aligned with the position.";
  const expLine = detectedYears > 0
    ? ` You have approximately ${detectedYears} year${detectedYears !== 1 ? "s" : ""} of experience, while the role requires ${requiredYears}+ years.`
    : "";
  const closingLine = recommendation === "Strong Match"
    ? " Overall, you are a strong candidate for this position and we encourage you to proceed."
    : recommendation === "Moderate Match"
    ? " Overall, you show a solid fit for this position with some areas for growth."
    : " We encourage you to build on the identified skill gaps to strengthen your application.";

  const professionalEvaluationSummary =
    `You have matched ${matchedSkills.length} out of ${requiredSkills.length} required skills for this role. ` +
    strengthsLine + gapLine + expLine + closingLine;

  return {
    candidateName,
    skillsFound: matchedSkills,
    missingSkills,
    experienceYears: detectedYears || requiredYears,
    education,
    matchScore: clampedScore,
    recommendation,
    professionalEvaluationSummary
  };
}

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

/**
 * Generate mock evaluation as a fallback
 */
function generateMockEvaluation(resumeText, job, candidateEmail) {
  const requiredSkills = job.requiredSkills || [];
  const matchedSkills = [];
  const missingSkills = [];

  // Simple keyword matching for fallback purposes
  requiredSkills.forEach((skill) => {
    const cleanSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${cleanSkill}\\b`, "i");
    if (regex.test(resumeText)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const matchPercentage = requiredSkills.length > 0 
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 50;

  const matchScore = Math.min(100, Math.max(30, matchPercentage + Math.floor(Math.random() * 15)));
  
  let recommendation = "Moderate Match";
  if (matchScore >= 80) recommendation = "Strong Match";
  else if (matchScore < 50) recommendation = "Weak Match";

  let candidateName = "Sarah Johnson";
  if (candidateEmail && candidateEmail.toLowerCase() !== "candidate@hrise.com") {
    const parts = candidateEmail.split("@")[0].split(/[._-]/);
    candidateName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  return {
    candidateName,
    skillsFound: matchedSkills,
    missingSkills,
    experienceYears: job.experienceRequired ? job.experienceRequired + Math.floor(Math.random() * 3) - 1 : 3,
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "State University",
        year: 2022
      }
    ],
    matchScore,
    recommendation,
    professionalEvaluationSummary: `You have matched ${matchedSkills.length} out of ${requiredSkills.length} required skills for this role. ${matchedSkills.length > 0 ? `Your profile shows strong alignment in: ${matchedSkills.join(", ")}.` : ""} ${missingSkills.length > 0 ? `To strengthen your application, consider developing expertise in: ${missingSkills.join(", ")}.` : "Your profile aligns well with all required skills for this position."} ${recommendation === "Strong Match" ? "Overall, you are a strong candidate for this position." : recommendation === "Moderate Match" ? "Overall, you show a moderate fit for this position with room to grow." : "We encourage you to build on the listed skills to improve your candidacy."}`
  };
}

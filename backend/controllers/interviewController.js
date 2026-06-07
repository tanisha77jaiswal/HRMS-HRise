import { InterviewSession } from "../models/interviewModel.js";
import { Job } from "../models/jobModel.js";
import { Candidate } from "../models/candidateModel.js";

const syncCandidateStatus = async (session) => {
  if (!session || (session.status !== "completed" && session.status !== "analyzed")) return;
  try {
    const candidate = await Candidate.findOne({
      $or: [
        { id: session.candidateId },
        { email: session.candidateEmail },
        { name: session.candidateName }
      ]
    });
    if (candidate) {
      candidate.status = "interviewed";
      candidate.interviewCompleted = true;
      if (session.answers && session.answers.length > 0) {
        // filter out answers with 0 rating
        const ratedAnswers = session.answers.filter(a => a.analysis && a.analysis.overallRating > 0);
        if (ratedAnswers.length > 0) {
          const totalRating = ratedAnswers.reduce((acc, a) => acc + (a.analysis.overallRating || 0), 0);
          candidate.interviewScore = Math.round(totalRating / ratedAnswers.length);
        } else {
          const totalRating = session.answers.reduce((acc, a) => acc + (a.analysis?.overallRating || 0), 0);
          candidate.interviewScore = Math.round(totalRating / session.answers.length);
        }
      }
      await candidate.save();
      console.log(`[Sync] Auto-updated candidate ${candidate.name} (${candidate.id}) status to interviewed.`);
    }
  } catch (err) {
    console.error("[Sync Error] Failed to update candidate status for completed interview:", err.message);
  }
};

export const getAllInterviews = async (req, res) => {
  try {
    const list = await InterviewSession.find({});
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createInterview = async (req, res) => {
  try {
    const { id } = req.body;
    const isNew = !await InterviewSession.exists({ id });
    const fresh = await InterviewSession.findOneAndUpdate({ id }, req.body, { new: true, upsert: true });

    if (fresh) {
      await syncCandidateStatus(fresh);
    }

    if (fresh && isNew && fresh.status === "scheduled") {
      const { createNotification } = await import("../services/notificationService.js");
      await createNotification({
        title: "Interview Scheduled",
        message: `A video interview has been scheduled for ${fresh.candidateName} on ${fresh.scheduledDate}.`,
        type: "interview",
        recipientRole: "recruiter"
      });
      await createNotification({
        title: "Interview Scheduled",
        message: `Your video interview has been scheduled for ${fresh.scheduledDate}. Please complete it before the due date.`,
        type: "interview",
        recipientRole: "candidate",
        recipientUserId: fresh.candidateEmail
      });
    }

    res.status(201).json(fresh);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateInterview = async (req, res) => {
  try {
    const original = await InterviewSession.findOne({ id: req.params.id });
    const updated = await InterviewSession.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });

    if (updated) {
      await syncCandidateStatus(updated);
    }

    if (updated && req.body.status && req.body.status !== original?.status) {
      if (req.body.status === "completed" || req.body.status === "analyzed") {
        const { createNotification } = await import("../services/notificationService.js");
        await createNotification({
          title: "Interview Completed",
          message: `${updated.candidateName} has completed the video interview for "${updated.jobTitle || "Interview"}". AI analysis is ready.`,
          type: "interview",
          recipientRole: "recruiter"
        });
        await createNotification({
          title: "Interview Submitted",
          message: "Your video interview has been submitted successfully.",
          type: "interview",
          recipientRole: "candidate",
          recipientUserId: updated.candidateEmail
        });
      }
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Delete an interview session by id.
 * DELETE /api/interviews/:id
 */
export const deleteInterview = async (req, res) => {
  try {
    await InterviewSession.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: "Interview session deleted." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Reschedule an interview session — resets status, clears answers, pushes date.
 * PUT /api/interviews/:id/reschedule
 * Body: { daysFromNow?, reason? }
 */
export const rescheduleInterview = async (req, res) => {
  try {
    const { daysFromNow = 3, reason = "" } = req.body;
    const newDate = new Date(Date.now() + daysFromNow * 86400000).toISOString().slice(0, 10);
    const updated = await InterviewSession.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          status: "scheduled",
          answers: [],
          scheduledDate: newDate,
          rescheduledAt: new Date().toISOString(),
          rescheduleReason: reason || "Rescheduled by HR",
        }
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Interview session not found." });

    const { createNotification } = await import("../services/notificationService.js");
    await createNotification({
      title: "Interview Scheduled",
      message: `Interview rescheduled for ${updated.candidateName} to ${updated.scheduledDate}. Reason: ${updated.rescheduleReason}`,
      type: "interview",
      recipientRole: "recruiter"
    });
    await createNotification({
      title: "Interview Rescheduled",
      message: `Your interview has been rescheduled to ${updated.scheduledDate}.`,
      type: "interview",
      recipientRole: "candidate",
      recipientUserId: updated.candidateEmail
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Generate AI interview questions for a given job using Gemini.
 * POST /api/interviews/generate-questions
 * Body: { jobId, jobTitle, jobDescription, requiredSkills, count, difficulty }
 */
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { jobId, jobTitle: bodyTitle, jobDescription: bodyDesc, requiredSkills: bodySkills, count = 10, difficulty = "Mixed" } = req.body;

    // Prefer job data from DB if jobId given, fall back to body data
    let jobTitle = bodyTitle || "Software Engineer";
    let jobDescription = bodyDesc || "";
    let requiredSkills = bodySkills || [];

    if (jobId) {
      const job = await Job.findOne({ id: jobId });
      if (job) {
        jobTitle = job.title;
        jobDescription = job.description || "";
        requiredSkills = job.requiredSkills || [];
      }
    }

    const safeCount = Math.min(20, Math.max(5, Number(count)));
    const skillsText = Array.isArray(requiredSkills) ? requiredSkills.join(", ") : requiredSkills;
    const difficultyInstruction = difficulty === "Mixed"
      ? "Mix difficulties: roughly 30% easy (concepts), 50% medium (applied), 20% hard (advanced)."
      : `All questions should be at ${difficulty.toLowerCase()} difficulty level.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (apiKey && apiKey.trim() !== "") {
      try {
        console.log(`[Gemini AI] Generating ${safeCount} interview questions for: ${jobTitle} (${difficulty})...`);

        const prompt = `You are an expert technical recruiter generating a structured interview question set.

Job Title: ${jobTitle}
Job Description: ${jobDescription || "N/A"}
Required Skills: ${skillsText || "General software engineering"}
Number of Questions: ${safeCount}
Difficulty Distribution: ${difficultyInstruction}

Generate exactly ${safeCount} interview questions that are:
- Highly specific and relevant to the "${jobTitle}" role and the listed skills
- Covering a good spread of categories: Technical, Experience, Problem Solving, System Design, Behavioral
- Progressively increasing in depth
- NOT generic — each question must reference specific technologies, concepts, or scenarios from the job description/skills

Return ONLY a valid JSON array with no markdown, no backticks, and no extra text outside the JSON:
[
  {
    "id": "q1",
    "question": "The full interview question text",
    "category": "Technical | System Design | Experience | Behavioral | Problem Solving",
    "difficulty": "easy | medium | hard"
  }
]

Remember: Every question MUST be tailored specifically to the "${jobTitle}" role. Do not use generic filler questions.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const resData = await response.json();
        const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResult) throw new Error("Empty Gemini response");

        let questions = JSON.parse(textResult.trim());
        // Ensure IDs are unique and count matches
        questions = questions.slice(0, safeCount).map((q, i) => ({
          id: q.id || `gq-${Date.now()}-${i}`,
          question: q.question,
          category: q.category || "Technical",
          difficulty: (q.difficulty || "medium").toLowerCase()
        }));

        console.log(`[Gemini AI] Successfully generated ${questions.length} questions for: ${jobTitle}`);
        return res.json({ questions, source: "gemini", jobTitle });
      } catch (geminiErr) {
        console.error("Gemini question generation failed, using fallback:", geminiErr.message);
        // Fall through to local fallback
      }
    }

    // ─── Local Fallback: keyword-based question generation ───
    console.log(`[Fallback] Generating ${safeCount} local questions for: ${jobTitle}`);
    const questions = generateLocalQuestions(jobTitle, skillsText, safeCount, difficulty);
    return res.json({ questions, source: "local", jobTitle });

  } catch (e) {
    console.error("generateInterviewQuestions error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Local fallback question generator — creates role-specific questions from
 * job title and skill keywords when Gemini API is unavailable.
 */
function generateLocalQuestions(jobTitle, skillsText, count, difficulty) {
  const skills = skillsText ? skillsText.split(",").map(s => s.trim()).filter(Boolean) : [];
  const titleLower = jobTitle.toLowerCase();

  const questionTemplates = [
    // Experience
    { q: `Walk us through your most impactful project as a ${jobTitle}. What architectural decisions did you make?`, cat: "Experience", diff: "medium" },
    { q: `How many years of experience do you have with ${skills[0] || jobTitle}? Describe your most challenging work in this area.`, cat: "Experience", diff: "easy" },
    // Technical - per skill
    ...skills.slice(0, 8).map((skill, i) => ({
      q: `Explain a real-world scenario where you used ${skill} to solve a critical problem in a ${jobTitle} context.`,
      cat: "Technical",
      diff: i < 2 ? "easy" : i < 5 ? "medium" : "hard"
    })),
    // System Design
    { q: `Design a scalable system for a ${jobTitle} role that handles high concurrency. Walk through your architecture choices.`, cat: "System Design", diff: "hard" },
    { q: `How would you architect a production-ready ${jobTitle} system with observability, fault tolerance, and auto-scaling?`, cat: "System Design", diff: "hard" },
    // Problem Solving
    { q: `You've just discovered a critical performance bottleneck in production as a ${jobTitle}. How do you diagnose and resolve it?`, cat: "Problem Solving", diff: "hard" },
    { q: `How do you prioritize and approach debugging a complex bug reported by users in a ${jobTitle} environment?`, cat: "Problem Solving", diff: "medium" },
    // Behavioral
    { q: `Describe a time you had a technical disagreement with a teammate on a ${jobTitle} project. How did you resolve it?`, cat: "Behavioral", diff: "medium" },
    { q: `How do you stay current with best practices and emerging technologies relevant to the ${jobTitle} role?`, cat: "Behavioral", diff: "easy" },
    // Additional technical
    { q: `Compare two approaches to ${skills[1] || "data management"} in a ${jobTitle} context. When would you choose each?`, cat: "Technical", diff: "medium" },
    { q: `What testing strategies do you employ for ${skills[0] || "code"} in a ${jobTitle} project?`, cat: "Technical", diff: "medium" },
    { q: `How do you ensure security and compliance in your ${jobTitle} work, especially with ${skills[2] || "key systems"}?`, cat: "Technical", diff: "hard" },
    { q: `Explain your approach to code review and mentoring junior engineers on a ${jobTitle} team.`, cat: "Behavioral", diff: "easy" },
    { q: `What metrics do you track to measure the quality and performance of your work as a ${jobTitle}?`, cat: "Experience", diff: "medium" },
    { q: `How do you handle on-call incidents and production outages in a ${jobTitle} role?`, cat: "Problem Solving", diff: "hard" },
    { q: `Describe your CI/CD workflow for a ${jobTitle} project. What tools and best practices do you follow?`, cat: "Technical", diff: "medium" },
    { q: `Walk us through how you would onboard a new engineer to a ${jobTitle} codebase.`, cat: "Behavioral", diff: "easy" },
    { q: `What trade-offs do you consider when choosing between ${skills[0] || "solution A"} and ${skills[1] || "solution B"} for a ${jobTitle} task?`, cat: "System Design", diff: "hard" },
    { q: `How do you document your work as a ${jobTitle} to ensure long-term maintainability?`, cat: "Experience", diff: "easy" }
  ];

  // Filter by difficulty if not Mixed
  let filtered = difficulty === "Mixed"
    ? questionTemplates
    : questionTemplates.filter(t => t.diff === difficulty.toLowerCase());

  // If filtered is too short, fall back to all templates
  if (filtered.length < count) filtered = questionTemplates;

  return filtered.slice(0, count).map((t, i) => ({
    id: `lq-${Date.now()}-${i}`,
    question: t.q,
    category: t.cat,
    difficulty: t.diff
  }));
}

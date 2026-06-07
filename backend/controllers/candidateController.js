import { Candidate, CandidateProfile } from "../models/candidateModel.js";
import { Job } from "../models/jobModel.js";
import { InterviewSession } from "../models/interviewModel.js";
import { screenResume } from "../services/geminiService.js";

export const getAllCandidates = async (req, res) => {
  try {
    const list = await Candidate.find({});
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createCandidate = async (req, res) => {
  try {
    const { id } = req.body;
    const fresh = await Candidate.findOneAndUpdate({ id }, req.body, { new: true, upsert: true });
    res.status(201).json(fresh);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const bulkCreateCandidates = async (req, res) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      const operations = items.map((item) => ({
        updateOne: {
          filter: { id: item.id },
          update: { $set: item },
          upsert: true
        }
      }));
      const result = await Candidate.bulkWrite(operations);
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: "Bulk data must be an array." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const original = await Candidate.findOne({ id: req.params.id });
    const updated = await Candidate.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });

    if (updated && req.body.status && req.body.status !== original?.status) {
      const { createNotification } = await import("../services/notificationService.js");
      if (req.body.status === "shortlisted") {
        await createNotification({
          title: "Candidate Shortlisted",
          message: `${updated.name} has been shortlisted and progressed to the next stage.`,
          type: "shortlist",
          recipientRole: "recruiter"
        });
        await createNotification({
          title: "Application Shortlisted",
          message: "Great news! Your application has been shortlisted. Next step: prepare for your video interview.",
          type: "shortlist",
          recipientRole: "candidate",
          recipientUserId: updated.email
        });
      } else if (req.body.status === "selected") {
        await createNotification({
          title: "Candidate Selected",
          message: `${updated.name} has been selected! An onboarding checklist has been generated.`,
          type: "onboarding",
          recipientRole: "recruiter"
        });
        await createNotification({
          title: "Congratulations! 🎉",
          message: "You have been selected for the position! Please visit your dashboard to complete your onboarding.",
          type: "onboarding",
          recipientRole: "candidate",
          recipientUserId: updated.email
        });
      }
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    await Candidate.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const clearAllCandidates = async (req, res) => {
  try {
    await Candidate.deleteMany({});
    await CandidateProfile.deleteMany({});
    await InterviewSession.deleteMany({});
    await Job.updateMany({}, { $set: { applicantCount: 0 } });
    res.json({ success: true, message: "All candidate and screening data cleared successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


// ── Candidate Profile (Applicant side) ────────────────────────────────────────
export const getAllCandidateProfiles = async (req, res) => {
  try {
    const list = await CandidateProfile.find({});
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveCandidateProfile = async (req, res) => {
  try {
    const { email } = req.body;
    const profile = await CandidateProfile.findOneAndUpdate(
      { email: email?.toLowerCase() },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Candidate self-apply with resume upload ────────────────────────────────────
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Resume file (PDF) is required." });
    if (!jobId) return res.status(400).json({ error: "Job ID is required." });

    const candidateEmail = req.user.email;
    const candidateName  = req.user.name || "Candidate";

    // 1. Gemini AI screening (pdf-parse + prompt)
    const aiEvaluation = await screenResume(
      file.buffer,
      file.originalname,
      jobId,
      candidateEmail
    );

    // 2. Build & save Candidate document
    const appliedDate = new Date(); // full timestamp so sort-by-date works correctly
    const newCandidate = new Candidate({
      id: `c-self-${Date.now()}`,
      name: candidateName,
      email: candidateEmail,
      phone: aiEvaluation.phone || "",
      skills: aiEvaluation.skillsFound || [],
      missingSkills: aiEvaluation.missingSkills || [],
      experienceYears: aiEvaluation.experienceYears || 0,
      education: aiEvaluation.education || [],
      aiScore: aiEvaluation.matchScore || 0,
      status: "screened",
      appliedDate,
      matchPercentage: aiEvaluation.matchScore || 0,
      matchExplanation: aiEvaluation.professionalEvaluationSummary || "Application screened successfully.",
      resumeFile: file.originalname,
      jobId,
    });
    await newCandidate.save();

    // 3. Increment job applicant count
    const job = await Job.findOneAndUpdate({ id: jobId }, { $inc: { applicantCount: 1 } });
    const jobTitle = job ? job.title : "Software Engineer";

    const { createNotification } = await import("../services/notificationService.js");
    await createNotification({
      title: "New Candidate Application",
      message: `${candidateName} applied for the position of "${jobTitle}".`,
      type: "upload",
      recipientRole: "recruiter"
    });
    await createNotification({
      title: "Resume Screening Completed",
      message: `AI screening complete — ${candidateName} scored ${newCandidate.aiScore}/100.`,
      type: "success",
      recipientRole: "recruiter"
    });

    res.status(201).json(newCandidate);
  } catch (err) {
    console.error("applyForJob error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── HR Bulk Resume Screening ──────────────────────────────────────────────────
// POST /api/candidates/screen-bulk
// HR uploads multiple PDFs at once → each is parsed with pdf-parse + Gemini AI
// → real data (skills, experience, education, name) extracted → saved to MongoDB
export const screenBulkResumes = async (req, res) => {
  try {
    const files  = req.files;
    const { jobId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one resume PDF is required." });
    }
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required." });
    }

    console.log(`[Bulk Screen] HR screening ${files.length} resume(s) for job: ${jobId}`);

    const appliedDate = new Date(); // full timestamp so sort-by-date works correctly

    const promises = files.map(async (file, i) => {
      try {
        console.log(`  [${i + 1}/${files.length}] Processing: ${file.originalname}`);

        // ── Core: Gemini AI actually reads the PDF text ──
        const aiEvaluation = await screenResume(
          file.buffer,
          file.originalname,
          jobId,
          null
        );

        // Derive candidate name from Gemini output first, then filename
        let candidateName = (aiEvaluation.candidateName || "").trim();
        if (!candidateName || candidateName.toLowerCase() === "unknown") {
          candidateName = file.originalname
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_](resume|cv)$/i, "")
            .replace(/[-_]/g, " ")
            .trim()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        }
        if (!candidateName || ["resume", "cv"].includes(candidateName.toLowerCase())) {
          candidateName = `Candidate ${i + 1}`;
        }

        const candidateEmail = `${candidateName.toLowerCase().replace(/\s+/g, ".")}@screened.com`;
        const candidateId    = `c-hr-${Date.now()}-${i}`;

        const doc = new Candidate({
          id: candidateId,
          name: candidateName,
          email: candidateEmail,
          phone: aiEvaluation.phone || "",
          skills: aiEvaluation.skillsFound || [],
          missingSkills: aiEvaluation.missingSkills || [],
          experienceYears: aiEvaluation.experienceYears || 0,
          education: aiEvaluation.education || [],
          aiScore: aiEvaluation.matchScore || 0,
          status: "screened",
          appliedDate,
          matchPercentage: aiEvaluation.matchScore || 0,
          matchExplanation: aiEvaluation.professionalEvaluationSummary || "AI screening complete.",
          resumeFile: file.originalname,
          jobId,
          screenedByHR: true,
        });

        await doc.save();
        await Job.findOneAndUpdate({ id: jobId }, { $inc: { applicantCount: 1 } });

        const { createNotification } = await import("../services/notificationService.js");
        await createNotification({
          title: "Resume Screening Completed",
          message: `AI screening complete — ${candidateName} scored ${doc.aiScore}/100. Review in Resume Screening.`,
          type: "upload",
          recipientRole: "recruiter"
        });

        console.log(`  ✓ ${candidateName} — score: ${aiEvaluation.matchScore}/100`);
        return doc;

      } catch (fileErr) {
        console.error(`  ✗ Failed: ${file.originalname} — ${fileErr.message}`);
        // Return an error placeholder so the frontend still knows this file was attempted
        return {
          id: `c-err-${Date.now()}-${i}`,
          name: file.originalname.replace(/\.[^/.]+$/, ""),
          email: "",
          skills: [],
          missingSkills: [],
          experienceYears: 0,
          education: [],
          aiScore: 0,
          matchPercentage: 0,
          status: "screened",
          appliedDate,
          resumeFile: file.originalname,
          matchExplanation: `Resume parsing failed: ${fileErr.message}`,
          error: true,
        };
      }
    });

    const results = await Promise.all(promises);

    console.log(`[Bulk Screen] Done. ${results.length} resume(s) processed.`);
    res.status(201).json({ candidates: results, total: results.length });

  } catch (err) {
    console.error("screenBulkResumes error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCandidateEvaluationData = async (req, res) => {
  try {
    const candidateId = req.params.id;

    // 1. Fetch Candidate
    const candidate = await Candidate.findOne({ id: candidateId });
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    // 2. Fetch InterviewSession (if exists and is analyzed/completed)
    const interview = await InterviewSession.findOne({ 
      candidateId, 
      status: { $in: ["analyzed", "completed"] } 
    });

    let interviewData = null;
    let mlPrediction = null;

    if (interview && interview.answers && interview.answers.length > 0) {
      const answers = interview.answers;
      
      // Calculate averages (analysis scores are out of 100)
      const totalOverall = answers.reduce((sum, a) => sum + (a.analysis?.overallRating || 0), 0);
      const totalComm = answers.reduce((sum, a) => sum + (a.analysis?.communicationScore || 0), 0);
      const totalConf = answers.reduce((sum, a) => sum + (a.analysis?.confidenceScore || 0), 0);
      const count = answers.length;

      const technicalRating = Math.round(totalOverall / count); 
      const communicationScore = Math.round(totalComm / count);
      const confidenceScore = Math.round(totalConf / count);
      const interviewScore = Math.round((communicationScore + confidenceScore) / 2); // overall interview score

      interviewData = {
        interviewScore,
        communicationScore,
        technicalScore: technicalRating,
        confidenceScore,
        interviewSummary: answers[0]?.analysis?.summary || "Interview completed successfully."
      };

      // 3. Trigger ML Prediction since both resume and interview exist
      try {
        const { getHiringPrediction } = await import("../services/mlPredictionService.js");
        
        // Derive educationLevel from degree (defaulting to Bachelor)
        let educationLevel = "Bachelor";
        const candidateDegree = (candidate.education?.[0]?.degree || "").toLowerCase();
        if (candidateDegree.includes("phd") || candidateDegree.includes("doctor")) {
          educationLevel = "PhD";
        } else if (candidateDegree.includes("master") || candidateDegree.includes("mtech") || candidateDegree.includes("mba")) {
          educationLevel = "Master";
        } else if (candidateDegree.includes("associate")) {
          educationLevel = "Associate";
        } else if (candidateDegree.includes("high school")) {
          educationLevel = "High School";
        }

        mlPrediction = await getHiringPrediction({
          resumeScore: candidate.aiScore || 0,
          interviewScore,
          skillsMatch: candidate.matchPercentage || 0,
          experienceYears: candidate.experienceYears || 0,
          educationLevel
        });

        if (mlPrediction) {
          const { createNotification } = await import("../services/notificationService.js");
          await createNotification({
            title: "ML Prediction Generated",
            message: `ML hiring prediction generated for ${candidate.name}: ${mlPrediction.hiringProbability}% hiring probability.`,
            type: "info",
            recipientRole: "recruiter"
          });
        }
      } catch (mlErr) {
        console.error("ML Prediction call failed for evaluation:", mlErr.message);
      }
    }

    res.json({
      candidate,
      interview: interviewData,
      mlPrediction
    });

  } catch (err) {
    console.error("getCandidateEvaluationData error:", err);
    res.status(500).json({ error: err.message });
  }
};


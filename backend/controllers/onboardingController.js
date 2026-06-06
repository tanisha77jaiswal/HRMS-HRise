import { OnboardingRecord } from "../models/onboardingModel.js";
import { User } from "../models/userModel.js";
import { StaffProfile } from "../models/staffModel.js";
import { Candidate } from "../models/candidateModel.js";
import { PayrollRecord } from "../models/payrollModel.js";

export const getAllOnboarding = async (req, res) => {
  try {
    const list = await OnboardingRecord.find({}).sort({ id: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch onboarding records." });
  }
};

export const createOnboarding = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Onboarding ID is required." });
    }
    
    // Format email if provided
    if (req.body.candidateEmail) {
      req.body.candidateEmail = req.body.candidateEmail.toLowerCase().trim();
    }

    const isNew = !await OnboardingRecord.exists({ id });
    let record = await OnboardingRecord.findOne({ id });
    if (!record) {
      record = new OnboardingRecord(req.body);
    } else {
      record.set(req.body);
    }

    // Recalculate status dynamically
    record.status = getUpdatedStatus(record);

    await record.save();

    if (isNew) {
      const { createNotification } = await import("../services/notificationService.js");
      await createNotification({
        title: "Onboarding Started",
        message: `Onboarding process started for ${record.candidateName}.`,
        type: "onboarding",
        recipientRole: "recruiter"
      });
      await createNotification({
        title: "Onboarding Started",
        message: "Your onboarding process has started. Please review your welcome letter and smart checklist.",
        type: "onboarding",
        recipientRole: "candidate",
        recipientUserId: record.candidateEmail
      });
    }

    res.status(201).json(record);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create/update onboarding record." });
  }
};

const getUpdatedStatus = (record) => {
  if (record.status === "Converted To Employee") {
    return "Converted To Employee";
  }
  
  if (record.offerLetterStatus === "Pending") {
    return "Onboarding Started";
  }
  if (record.offerLetterStatus === "Sent") {
    return "Offer Sent";
  }
  if (record.offerLetterStatus === "Accepted") {
    const docsApproved = 
      record.documents.identityProof.status === "Approved" &&
      record.documents.addressProof.status === "Approved" &&
      record.documents.resume.status === "Approved" &&
      record.documents.photo.status === "Approved";
    
    const profileCompleted = !!record.personalProfile.isCompleted;
    const bankDetailsSubmitted = !!record.bankDetails.isSubmitted;
    const joiningDateAssigned = !!record.joiningDate;
    
    if (docsApproved && profileCompleted && bankDetailsSubmitted && joiningDateAssigned) {
      return "Ready For Conversion";
    }
    
    // Check if any document is uploaded and pending verification
    const hasPendingDocs = 
      (record.documents.identityProof.url && record.documents.identityProof.status === "Pending") ||
      (record.documents.addressProof.url && record.documents.addressProof.status === "Pending") ||
      (record.documents.resume.url && record.documents.resume.status === "Pending") ||
      (record.documents.photo.url && record.documents.photo.status === "Pending");
    
    if (hasPendingDocs) {
      return "Verification Pending";
    }
    
    return "Documents Pending";
  }
  
  return record.status || "Selected";
};

export const updateOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    
    let record = await OnboardingRecord.findOne({ id });
    if (!record) {
      return res.status(404).json({ error: "Onboarding record not found." });
    }

    // Format email if updated
    if (req.body.candidateEmail) {
      req.body.candidateEmail = req.body.candidateEmail.toLowerCase().trim();
    }

    // Detect offer letter status change
    const oldOfferStatus = record.offerLetterStatus;

    // Detect new document uploads
    let docUploaded = false;
    if (req.body.documents) {
      for (const docKey of ["identityProof", "addressProof", "resume", "photo"]) {
        if (req.body.documents[docKey]?.url && (!record.documents[docKey] || !record.documents[docKey].url)) {
          docUploaded = true;
        }
      }
    }

    // Safely assign nested fields to avoid overwriting other subdocument fields
    if (req.body.personalProfile) {
      Object.assign(record.personalProfile, req.body.personalProfile);
      delete req.body.personalProfile;
    }
    if (req.body.bankDetails) {
      Object.assign(record.bankDetails, req.body.bankDetails);
      delete req.body.bankDetails;
    }
    if (req.body.documents) {
      for (const docKey of ["identityProof", "addressProof", "resume", "photo"]) {
        if (req.body.documents[docKey]) {
          Object.assign(record.documents[docKey], req.body.documents[docKey]);
        }
      }
      delete req.body.documents;
    }

    // Assign top-level fields
    record.set(req.body);

    // Sync tasks checklist if present
    if (record.tasks && record.tasks.length > 0) {
      record.tasks.forEach(task => {
        const title = (task.title || "").toLowerCase();
        if (title.includes("offer") && title.includes("sent")) {
          task.completed = record.offerLetterStatus === "Sent" || record.offerLetterStatus === "Accepted";
        } else if (title.includes("agreement") || title.includes("sign") || (title.includes("offer") && (title.includes("accept") || title.includes("signed")))) {
          task.completed = record.offerLetterStatus === "Accepted";
        } else if (title.includes("identity")) {
          task.completed = !!record.documents.identityProof.url && record.documents.identityProof.status !== "Rejected";
        } else if (title.includes("address")) {
          task.completed = !!record.documents.addressProof.url && record.documents.addressProof.status !== "Rejected";
        } else if (title.includes("resume")) {
          task.completed = !!record.documents.resume.url && record.documents.resume.status !== "Rejected";
        } else if (title.includes("photo") || title.includes("photograph")) {
          task.completed = !!record.documents.photo.url && record.documents.photo.status !== "Rejected";
        } else if (title.includes("profile")) {
          task.completed = !!record.personalProfile.isCompleted;
        } else if (title.includes("bank")) {
          task.completed = !!record.bankDetails.isSubmitted;
        } else if (title.includes("joining")) {
          task.completed = !!record.joiningDate;
        } else if (title.includes("verify") || title.includes("verified")) {
          task.completed = 
            record.documents.identityProof.status === "Approved" &&
            record.documents.addressProof.status === "Approved" &&
            record.documents.resume.status === "Approved" &&
            record.documents.photo.status === "Approved";
        }
      });
    }

    // Update status dynamically
    record.status = getUpdatedStatus(record);

    await record.save();

    const { createNotification } = await import("../services/notificationService.js");
    if (record.offerLetterStatus === "Accepted" && oldOfferStatus !== "Accepted") {
      await createNotification({
        title: "Offer Letter Accepted",
        message: `${record.candidateName} has accepted the offer letter.`,
        type: "success",
        recipientRole: "recruiter"
      });
    }

    if (docUploaded) {
      await createNotification({
        title: "Documents Submitted",
        message: `${record.candidateName} has uploaded documents for verification.`,
        type: "info",
        recipientRole: "recruiter"
      });
    }

    res.json(record);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update onboarding record." });
  }
};

export const convertToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, designation, managerName, salaryBand, reportingManagerId, salary } = req.body;

    if (!department || !designation || (!managerName && !reportingManagerId)) {
      return res.status(400).json({ error: "Department, designation, and reporting manager are required for employee conversion." });
    }

    const record = await OnboardingRecord.findOne({ id });
    if (!record) {
      return res.status(404).json({ error: "Onboarding record not found." });
    }

    // ── Business Rule Validation ──
    const offerLetterAccepted = record.offerLetterStatus === "Accepted";
    const docsApproved = 
      record.documents.identityProof.status === "Approved" &&
      record.documents.addressProof.status === "Approved" &&
      record.documents.resume.status === "Approved" &&
      record.documents.photo.status === "Approved";
    
    const profileCompleted = record.personalProfile.isCompleted || (record.personalProfile.phone && record.personalProfile.location);
    const bankDetailsSubmitted = record.bankDetails.isSubmitted;
    const joiningDateAssigned = !!record.joiningDate;
    
    const finalManagerId = reportingManagerId || record.reportingManagerId;

    if (!offerLetterAccepted || !docsApproved || !profileCompleted || !bankDetailsSubmitted || !joiningDateAssigned || !finalManagerId) {
      return res.status(400).json({
        error: "Conversion blocked: Candidate has not fulfilled all onboarding checklist criteria.",
        details: {
          offerLetterAccepted,
          documentsApproved: docsApproved,
          profileCompleted,
          bankDetailsSubmitted,
          joiningDateAssigned,
          managerAssigned: !!finalManagerId
        }
      });
    }

    // ── Generate Sequential Employee ID ──
    const profilesCount = await StaffProfile.countDocuments();
    const nextEmpNum = profilesCount + 1;
    const employeeId = `EMP${String(nextEmpNum).padStart(3, "0")}`;

    // Resolve manager dynamically from Senior Manager accounts in the database
    let managerId = null;
    let managerEmail = "";
    let resolvedManagerName = managerName || "";

    if (finalManagerId) {
      const managerUser = await User.findOne({ _id: finalManagerId, role: "senior_manager" });
      if (managerUser) {
        managerId = managerUser._id;
        managerEmail = managerUser.email;
        resolvedManagerName = managerUser.name;
      }
    } else if (managerName) {
      const managerUser = await User.findOne({ name: managerName, role: "senior_manager" });
      if (managerUser) {
        managerId = managerUser._id;
        managerEmail = managerUser.email;
        resolvedManagerName = managerUser.name;
      }
    }

    if (!managerId) {
      return res.status(400).json({ error: "Conversion blocked: The assigned Reporting Manager account was not found in the system." });
    }

    // ── 1. Create StaffProfile Record ──
    const resolvedSalary = salary || (salaryBand === "L7" ? 150000 : salaryBand === "L5" ? 110000 : 80000);
    // Avoid creating duplicate staff profile
    let staffProfile = await StaffProfile.findOne({ email: record.candidateEmail.toLowerCase() });
    if (!staffProfile) {
      staffProfile = await StaffProfile.create({
        email: record.candidateEmail.toLowerCase(),
        name: record.candidateName,
        phone: record.personalProfile.phone || "",
        location: record.personalProfile.location || "",
        department,
        jobTitle: designation,
        designation,
        employeeId,
        dateJoined: record.joiningDate,
        joinDate: record.joiningDate,
        photoUrl: record.documents.photo.url || "",
        salaryBand: salaryBand || "L3",
        salary: resolvedSalary,
        manager: resolvedManagerName,
        reportingManagerId: managerId,
        reportingManagerEmail: managerEmail,
        skills: record.personalProfile.skills || [],
        attendance: 100,
        status: "active"
      });
    } else {
      staffProfile.department = department;
      staffProfile.designation = designation;
      staffProfile.jobTitle = designation;
      staffProfile.salary = resolvedSalary;
      staffProfile.manager = resolvedManagerName;
      staffProfile.reportingManagerId = managerId;
      staffProfile.reportingManagerEmail = managerEmail;
      staffProfile.status = "active";
      await staffProfile.save();
    }

    // Create corresponding PayrollRecord
    await PayrollRecord.findOneAndUpdate(
      { email: record.candidateEmail.toLowerCase() },
      {
        name: record.candidateName,
        email: record.candidateEmail.toLowerCase(),
        designation,
        department,
        base: resolvedSalary,
        bonus: 10000,
        status: "Pending"
      },
      { upsert: true, new: true }
    );

    // ── 2. Update User Account Role & Dashboard Access ──
    const userRecord = await User.findOne({ email: record.candidateEmail.toLowerCase() });
    if (userRecord) {
      userRecord.role = "employee";
      userRecord.department = department;
      userRecord.designation = designation;
      userRecord.reportingManager = managerId;
      await userRecord.save();
    }

    // ── 3. Delete Candidate from Recruitment List ──
    if (record.candidateId) {
      await Candidate.findOneAndDelete({ id: record.candidateId });
    }
    await Candidate.findOneAndDelete({ email: record.candidateEmail.toLowerCase() });

    // ── 4. Finalize Onboarding Status ──
    record.status = "Converted To Employee";
    record.convertedDate = new Date().toISOString().split("T")[0];
    
    // Complete remaining tasks in the checklist
    record.tasks.forEach(t => {
      t.completed = true;
    });

    await record.save();

    const { createNotification } = await import("../services/notificationService.js");
    await createNotification({
      title: "Employee Conversion Completed",
      message: `Employee conversion completed successfully for ${record.candidateName} (ID: ${employeeId}).`,
      type: "success",
      recipientRole: "recruiter"
    });

    res.status(200).json({
      message: `Successfully converted ${record.candidateName} to Employee!`,
      employeeId,
      staffProfile
    });

  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to convert candidate to employee." });
  }
};

export const generateOfferLetter = async (req, res) => {
  try {
    const { candidateName, jobTitle, department, salary, joiningDate, companyName } = req.body;

    if (!candidateName || !jobTitle || !department || !salary || !joiningDate || !companyName) {
      return res.status(400).json({ error: "Missing required fields for offer letter." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let letterText = "";

    if (apiKey) {
      try {
        const prompt = `Generate a professional, personalized job offer letter for a candidate.
Candidate Name: ${candidateName}
Job Title: ${jobTitle}
Department: ${department}
Salary/Compensation: ${salary}
Joining Date: ${joiningDate}
Company Name: ${companyName}

The offer letter must be detailed and include:
1. A warm greeting and welcome message.
2. Clear job title and department.
3. Detailed compensation information (mentioning ${salary}).
4. Joining instructions for ${joiningDate}.
5. Brief summary of employment terms (probation period of 3 months, confidentiality).
6. A closing signature block.

Format it as clean, readable text. Do not include markdown code block wrappers (like \`\`\`text).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          letterText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          console.warn("Gemini API call failed, falling back to local template.");
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
      }
    }

    if (!letterText) {
      // High-quality professional fallback template
      const compensation = typeof salary === "number" ? `INR ${salary.toLocaleString("en-IN")} per annum` : salary;
      letterText = `OFFER OF EMPLOYMENT

Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

Dear ${candidateName},

Welcome to the team! On behalf of ${companyName}, we are absolutely thrilled to offer you the position of ${jobTitle} within our ${department} department.

1. POSITION AND COMPENSATION
Your starting title will be ${jobTitle}, reporting directly to the designated Senior Manager of the ${department} department.
Your gross compensation will be ${compensation}, paid in monthly installments in accordance with standard payroll practices. You will also be eligible for standard performance bonuses and company benefits as applicable.

2. JOINING DETAILS & INSTRUCTIONS
Your joining date is scheduled for ${joiningDate}. Please report to our office or log into our remote onboarding portal at 9:00 AM.
Please complete all compliance checklist tasks, including uploading your identity proof, address proof, passport photo, and direct deposit bank details, in our onboarding portal prior to your start date.

3. TERMS & CONDITIONS
- This offer is contingent upon successful completion of document verification and background check procedures.
- You will be on probation for a period of three (3) months from your date of joining.
- A standard non-disclosure agreement (NDA) must be signed on or before your joining date.

Welcome to ${companyName}! We look forward to building the future of HR tech with you.

Sincerely,
HR Operations Team
${companyName}`;
    }

    res.status(200).json({ letter: letterText });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to generate offer letter." });
  }
};

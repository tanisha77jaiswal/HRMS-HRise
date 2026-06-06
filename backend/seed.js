import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Import Models
import { User } from "./models/userModel.js";
import { StaffProfile } from "./models/staffModel.js";
import { Job } from "./models/jobModel.js";
import { Candidate, CandidateProfile } from "./models/candidateModel.js";
import { InterviewSession } from "./models/interviewModel.js";
import { AttendanceRecord, AbsentToday, AttendanceTrend } from "./models/attendanceModel.js";
import { PayrollRecord } from "./models/payrollModel.js";
import { PerformanceReview, PerformanceQuarter } from "./models/performanceModel.js";
import { LeaveRequest } from "./models/leaveModel.js";
import { Settings } from "./models/settingsModel.js";
import { ActivityLog } from "./models/activityLogModel.js";
import { Notification } from "./models/notificationModel.js";
import { OnboardingRecord } from "./models/onboardingModel.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    console.log("Clearing existing database collections...");
    await Promise.all([
      User.deleteMany({}),
      StaffProfile.deleteMany({}),
      Job.deleteMany({}),
      Candidate.deleteMany({}),
      CandidateProfile.deleteMany({}),
      InterviewSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      AbsentToday.deleteMany({}),
      AttendanceTrend.deleteMany({}),
      PayrollRecord.deleteMany({}),
      PerformanceReview.deleteMany({}),
      PerformanceQuarter.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Settings.deleteMany({}),
      ActivityLog.deleteMany({}),
      Notification.deleteMany({}),
      OnboardingRecord.deleteMany({})
    ]);
    console.log("Clean completed.");

    // 1. Seed Settings
    console.log("Seeding workspace settings...");
    await Settings.create({
      workspaceId: "default",
      aiScoreThreshold: 75,
      evaluationStrictness: "Balanced Evaluation",
      autoShortlist: true,
      sendShortlistEmails: false,
      sendInterviewEmails: false,
      workspaceTimezone: "Asia/Kolkata (IST)",
      medicalLeaveAllocated: 12,
      casualLeaveAllocated: 10,
      earnedLeaveAllocated: 15
    });

    // Hash default seed password
    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    // 2. Generate ObjectIds for Manager Users to link reporting lines
    const ashishId = new mongoose.Types.ObjectId();
    const ananyaId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    // 3. Seed Users
    console.log("Seeding user accounts...");
    const users = await User.create([
      // Admin
      {
        _id: adminId,
        id: "user-management-admin-govind",
        name: "Govind (Admin)",
        email: "govind@admin.com",
        password: defaultPasswordHash,
        role: "management_admin",
        company: "HRise Corp",
        industry: "Technology",
        companySize: "51-200",
        status: "active",
        createdAt: new Date("2024-01-15T00:00:00Z")
      },
      // Recruiters
      {
        id: "user-recruiter-rachel",
        name: "Rachel Green",
        email: "rachel@recruiter.com",
        password: defaultPasswordHash,
        role: "recruiter",
        company: "HRise Corp",
        department: "Human Resources",
        designation: "Recruiter Lead",
        status: "active",
        createdAt: new Date("2024-03-10T00:00:00Z")
      },
      {
        id: "user-recruiter-ryan",
        name: "Ryan Reynolds",
        email: "ryan@recruiter.com",
        password: defaultPasswordHash,
        role: "recruiter",
        company: "HRise Corp",
        department: "Human Resources",
        designation: "Recruitment Specialist",
        status: "active",
        createdAt: new Date("2024-04-12T00:00:00Z")
      },
      // Senior Managers
      {
        _id: ashishId,
        id: "user-manager-ashish",
        name: "Ashish Gupta",
        email: "ashish@manager.com",
        password: defaultPasswordHash,
        role: "senior_manager",
        company: "HRise Corp",
        department: "Engineering",
        designation: "Engineering Director",
        status: "active",
        createdAt: new Date("2024-02-01T00:00:00Z")
      },
      {
        _id: ananyaId,
        id: "user-manager-ananya",
        name: "Ananya Sen",
        email: "ananya@manager.com",
        password: defaultPasswordHash,
        role: "senior_manager",
        company: "HRise Corp",
        department: "Sales",
        designation: "Sales Director",
        status: "active",
        createdAt: new Date("2024-02-15T00:00:00Z")
      },
      // Employees managed by Ashish Gupta
      {
        id: "user-emp-amit",
        name: "Amit Sharma",
        email: "amit@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Engineering",
        designation: "Senior Software Engineer",
        status: "active",
        reportingManager: ashishId,
        createdAt: new Date("2024-06-01T00:00:00Z")
      },
      {
        id: "user-emp-priya",
        name: "Priya Patel",
        email: "priya@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Product",
        designation: "Product Manager",
        status: "active",
        reportingManager: ashishId,
        createdAt: new Date("2024-07-15T00:00:00Z")
      },
      {
        id: "user-emp-neha",
        name: "Neha Joshi",
        email: "neha@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Design",
        designation: "UI/UX Lead Designer",
        status: "active",
        reportingManager: ashishId,
        createdAt: new Date("2024-08-01T00:00:00Z")
      },
      // Employees managed by Ananya Sen
      {
        id: "user-emp-siddharth",
        name: "Siddharth Roy",
        email: "siddharth@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Sales",
        designation: "Senior Account Executive",
        status: "active",
        reportingManager: ananyaId,
        createdAt: new Date("2024-09-01T00:00:00Z")
      },
      {
        id: "user-emp-tanisha",
        name: "Tanisha Jaiswal",
        email: "tanisha@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Human Resources",
        designation: "HR Generalist",
        status: "active",
        reportingManager: ananyaId,
        createdAt: new Date("2024-10-10T00:00:00Z")
      },
      {
        id: "user-emp-rohit",
        name: "Rohit Verma",
        email: "rohit@employee.com",
        password: defaultPasswordHash,
        role: "employee",
        company: "HRise Corp",
        department: "Finance",
        designation: "Finance Analyst",
        status: "active",
        reportingManager: ananyaId,
        createdAt: new Date("2024-11-01T00:00:00Z")
      },
      // Candidates registered as users
      {
        id: "user-cand-arjun",
        name: "Arjun Candidate",
        email: "arjun@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-cand-kavita",
        name: "Kavita Candidate",
        email: "kavita@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-cand-vikram",
        name: "Vikram Candidate",
        email: "vikram@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-cand-sneha",
        name: "Sneha Candidate",
        email: "sneha@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-cand-dev",
        name: "Dev Candidate",
        email: "dev@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-cand-meera",
        name: "Meera Candidate",
        email: "meera@candidate.com",
        password: defaultPasswordHash,
        role: "candidate",
        company: "N/A"
      }
    ]);

    // 4. Seed Staff Profiles
    console.log("Seeding staff profiles...");
    const staffProfiles = await StaffProfile.create([
      // Admin
      {
        email: "govind@admin.com",
        name: "Govind (Admin)",
        phone: "+91 99999 00000",
        location: "Headquarters (Bangalore)",
        department: "Executive Management",
        jobTitle: "System Administrator",
        designation: "System Administrator",
        employeeId: "EMP001",
        dateJoined: "2024-01-15",
        joinDate: "2024-01-15",
        notificationLevel: "All Activity & Daily Summaries",
        language: "English (US)",
        salaryBand: "Executive",
        salary: 200000,
        skills: ["System Administration", "Security Audit", "Cloud DevOps"],
        attendance: 100,
        status: "active"
      },
      // Recruiters
      {
        email: "rachel@recruiter.com",
        name: "Rachel Green",
        phone: "+91 88888 11111",
        location: "Bangalore Office",
        department: "Human Resources",
        jobTitle: "Recruiter Lead",
        designation: "Recruiter Lead",
        employeeId: "EMP002",
        dateJoined: "2024-03-10",
        joinDate: "2024-03-10",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L6",
        salary: 85000,
        skills: ["Technical Recruitment", "Executive Sourcing", "ATS Optimization"],
        attendance: 100,
        status: "active"
      },
      {
        email: "ryan@recruiter.com",
        name: "Ryan Reynolds",
        phone: "+91 88888 22222",
        location: "Remote (Pune)",
        department: "Human Resources",
        jobTitle: "Recruitment Specialist",
        designation: "Recruitment Specialist",
        employeeId: "EMP003",
        dateJoined: "2024-04-12",
        joinDate: "2024-04-12",
        notificationLevel: "Direct Messages Only",
        language: "English (US)",
        salaryBand: "L4",
        salary: 60000,
        skills: ["Resume Screening", "Talent Sourcing", "Employer Branding"],
        attendance: 100,
        status: "active"
      },
      // Managers
      {
        email: "ashish@manager.com",
        name: "Ashish Gupta",
        phone: "+91 77777 11111",
        location: "Bangalore Office",
        department: "Engineering",
        jobTitle: "Engineering Director",
        designation: "Engineering Director",
        employeeId: "EMP004",
        dateJoined: "2024-02-01",
        joinDate: "2024-02-01",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L8",
        salary: 180000,
        skills: ["Engineering Management", "Distributed Systems", "Cloud Architecture"],
        attendance: 100,
        status: "active"
      },
      {
        email: "ananya@manager.com",
        name: "Ananya Sen",
        phone: "+91 77777 22222",
        location: "Bangalore Office",
        department: "Sales",
        jobTitle: "Sales Director",
        designation: "Sales Director",
        employeeId: "EMP005",
        dateJoined: "2024-02-15",
        joinDate: "2024-02-15",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L8",
        salary: 160000,
        skills: ["Enterprise Sales", "B2B Negotiations", "Key Account Management"],
        attendance: 100,
        status: "active"
      },
      // Employees reporting to Ashish Gupta
      {
        email: "amit@employee.com",
        name: "Amit Sharma",
        phone: "+91 99999 11111",
        location: "Bangalore Office",
        department: "Engineering",
        jobTitle: "Senior Software Engineer",
        designation: "Senior Software Engineer",
        employeeId: "EMP006",
        dateJoined: "2024-06-01",
        joinDate: "2024-06-01",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L5",
        salary: 95000,
        manager: "Ashish Gupta",
        reportingManagerId: ashishId,
        reportingManagerEmail: "ashish@manager.com",
        skills: ["Node.js", "React.js", "MongoDB", "Kubernetes"],
        attendance: 97, // Calculated rate
        status: "active"
      },
      {
        email: "priya@employee.com",
        name: "Priya Patel",
        phone: "+91 99999 22222",
        location: "Remote (Mumbai)",
        department: "Product",
        jobTitle: "Product Manager",
        designation: "Product Manager",
        employeeId: "EMP007",
        dateJoined: "2024-07-15",
        joinDate: "2024-07-15",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L6",
        salary: 110000,
        manager: "Ashish Gupta",
        reportingManagerId: ashishId,
        reportingManagerEmail: "ashish@manager.com",
        skills: ["Product Strategy", "Agile Roadmap", "Competitive Analysis"],
        attendance: 93,
        status: "active"
      },
      {
        email: "neha@employee.com",
        name: "Neha Joshi",
        phone: "+91 99999 33333",
        location: "Bangalore Office",
        department: "Design",
        jobTitle: "UI/UX Lead Designer",
        designation: "UI/UX Lead Designer",
        employeeId: "EMP008",
        dateJoined: "2024-08-01",
        joinDate: "2024-08-01",
        notificationLevel: "Direct Messages Only",
        language: "English (US)",
        salaryBand: "L5",
        salary: 80000,
        manager: "Ashish Gupta",
        reportingManagerId: ashishId,
        reportingManagerEmail: "ashish@manager.com",
        skills: ["Figma Design", "Design Systems", "Usability Testing"],
        attendance: 90,
        status: "active"
      },
      // Employees reporting to Ananya Sen
      {
        email: "siddharth@employee.com",
        name: "Siddharth Roy",
        phone: "+91 99999 44444",
        location: "Remote (Delhi)",
        department: "Sales",
        jobTitle: "Senior Account Executive",
        designation: "Senior Account Executive",
        employeeId: "EMP009",
        dateJoined: "2024-09-01",
        joinDate: "2024-09-01",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L6",
        salary: 120000,
        manager: "Ananya Sen",
        reportingManagerId: ananyaId,
        reportingManagerEmail: "ananya@manager.com",
        skills: ["Enterprise Sales", "CRM Pipeline", "Lead Conversion"],
        attendance: 87,
        status: "active"
      },
      {
        email: "tanisha@employee.com",
        name: "Tanisha Jaiswal",
        phone: "+91 99999 55555",
        location: "Remote (Hyderabad)",
        department: "Human Resources",
        jobTitle: "HR Generalist",
        designation: "HR Generalist",
        employeeId: "EMP010",
        dateJoined: "2024-10-10",
        joinDate: "2024-10-10",
        notificationLevel: "All Activity",
        language: "English (US)",
        salaryBand: "L4",
        salary: 90000,
        manager: "Ananya Sen",
        reportingManagerId: ananyaId,
        reportingManagerEmail: "ananya@manager.com",
        skills: ["Employee Relations", "Payroll Compliance", "Conflict Resolution"],
        attendance: 97,
        status: "active"
      },
      {
        email: "rohit@employee.com",
        name: "Rohit Verma",
        phone: "+91 99999 66666",
        location: "Remote (Chennai)",
        department: "Finance",
        jobTitle: "Finance Analyst",
        designation: "Finance Analyst",
        employeeId: "EMP011",
        dateJoined: "2024-11-01",
        joinDate: "2024-11-01",
        notificationLevel: "Direct Messages Only",
        language: "English (US)",
        salaryBand: "L4",
        salary: 105000,
        manager: "Ananya Sen",
        reportingManagerId: ananyaId,
        reportingManagerEmail: "ananya@manager.com",
        skills: ["Financial Analysis", "Excel Modeling", "SAP Ledger Management"],
        attendance: 93,
        status: "active"
      }
    ]);

    // 5. Seed Jobs
    console.log("Seeding job descriptions...");
    const jobs = await Job.create([
      {
        id: "job-eng-001",
        title: "Senior Software Engineer",
        department: "Engineering",
        location: "Bangalore Office",
        experienceRequired: 5,
        type: "full-time",
        description: "Looking for an experienced engineer to build performant web services using modern JavaScript technologies.",
        requiredSkills: ["Node.js", "React.js", "MongoDB", "Kubernetes"],
        postedDate: "2026-05-01",
        status: "open",
        applicantCount: 2
      },
      {
        id: "job-prd-001",
        title: "Product Manager",
        department: "Product",
        location: "Bangalore / Remote",
        experienceRequired: 4,
        type: "full-time",
        description: "Join our team to coordinate product releases, manage roadmap timelines, and align engineering/design objectives.",
        requiredSkills: ["Product Strategy", "Agile Roadmap", "Competitive Analysis"],
        postedDate: "2026-05-02",
        status: "open",
        applicantCount: 2
      },
      {
        id: "job-dsg-001",
        title: "UI/UX Lead Designer",
        department: "Design",
        location: "Pune / Remote",
        experienceRequired: 3,
        type: "full-time",
        description: "Seeking a designer with strong visual capabilities, high fidelity wireframing experience, and design systems execution.",
        requiredSkills: ["Figma Design", "Design Systems", "Usability Testing"],
        postedDate: "2026-05-03",
        status: "open",
        applicantCount: 1
      },
      {
        id: "job-sls-001",
        title: "Senior Account Executive",
        department: "Sales",
        location: "Remote",
        experienceRequired: 4,
        type: "full-time",
        description: "Drive sales pipeline growth, convert qualified leads, and manage enterprise client contracts.",
        requiredSkills: ["Enterprise Sales", "CRM Pipeline", "Lead Conversion"],
        postedDate: "2026-05-04",
        status: "closed",
        applicantCount: 1
      }
    ]);

    // 6. Seed Candidates
    console.log("Seeding candidates...");
    const candidates = await Candidate.create([
      {
        id: "cand-arjun-01",
        name: "Arjun Candidate",
        email: "arjun@candidate.com",
        phone: "+91 91111 22222",
        skills: ["Node.js", "React.js"],
        missingSkills: ["MongoDB", "Kubernetes"],
        experienceYears: 4,
        education: [{ degree: "B.Tech Computer Science", institution: "IIT Bombay", year: 2022 }],
        aiScore: 78,
        status: "applied",
        appliedDate: "2026-05-10",
        matchPercentage: 78,
        matchExplanation: "Candidate holds standard JavaScript background but lacks enterprise Kubernetes operations.",
        resumeFile: "Arjun_Resume_SSE.pdf",
        jobId: "job-eng-001",
        jobTitle: "Senior Software Engineer"
      },
      {
        id: "cand-kavita-02",
        name: "Kavita Candidate",
        email: "kavita@candidate.com",
        phone: "+91 91111 33333",
        skills: ["Product Strategy", "Agile Roadmap"],
        missingSkills: ["Competitive Analysis"],
        experienceYears: 3.5,
        education: [{ degree: "MBA General Management", institution: "FMS Delhi", year: 2022 }],
        aiScore: 82,
        status: "applied",
        appliedDate: "2026-05-12",
        matchPercentage: 82,
        matchExplanation: "Strong business credentials and experience mapping software releases.",
        resumeFile: "Kavita_Candidate_PM.pdf",
        jobId: "job-prd-001",
        jobTitle: "Product Manager"
      },
      {
        id: "cand-vikram-03",
        name: "Vikram Candidate",
        email: "vikram@candidate.com",
        phone: "+91 91111 44444",
        skills: ["Figma Design", "Design Systems", "Usability Testing"],
        missingSkills: [],
        experienceYears: 5,
        education: [{ degree: "Bachelor of Design", institution: "NID Ahmedabad", year: 2021 }],
        aiScore: 92,
        status: "shortlisted",
        appliedDate: "2026-05-11",
        matchPercentage: 95,
        matchExplanation: "Outstanding portfolio matching all core layout tool specifications.",
        resumeFile: "Vikram_Design_CV.pdf",
        jobId: "job-dsg-001",
        jobTitle: "UI/UX Lead Designer"
      },
      {
        id: "cand-sneha-04",
        name: "Sneha Candidate",
        email: "sneha@candidate.com",
        phone: "+91 91111 55555",
        skills: ["Enterprise Sales", "CRM Pipeline", "Lead Conversion"],
        missingSkills: [],
        experienceYears: 6,
        education: [{ degree: "BBA Sales & Marketing", institution: "NMIMS Mumbai", year: 2020 }],
        aiScore: 90,
        status: "interviewed",
        appliedDate: "2026-05-14",
        matchPercentage: 90,
        matchExplanation: "Solid pipeline conversion metrics and CRM experience.",
        resumeFile: "Sneha_Roy_Sales.pdf",
        jobId: "job-sls-001",
        jobTitle: "Senior Account Executive",
        interviewScheduled: true
      },
      {
        id: "cand-dev-05",
        name: "Dev Candidate",
        email: "dev@candidate.com",
        phone: "+91 91111 66666",
        skills: ["React.js"],
        missingSkills: ["Node.js", "MongoDB", "Kubernetes"],
        experienceYears: 2,
        education: [{ degree: "BCA Computer Applications", institution: "IP University", year: 2024 }],
        aiScore: 45,
        status: "rejected",
        appliedDate: "2026-05-15",
        matchPercentage: 45,
        matchExplanation: "Does not satisfy the minimum experience requirement or backend skill parameters.",
        resumeFile: "Dev_Junior_JS.pdf",
        jobId: "job-eng-001",
        jobTitle: "Senior Software Engineer"
      },
      {
        id: "cand-meera-06",
        name: "Meera Candidate",
        email: "meera@candidate.com",
        phone: "+91 91111 77777",
        skills: ["Product Strategy", "Agile Roadmap", "Competitive Analysis"],
        missingSkills: [],
        experienceYears: 5,
        education: [{ degree: "B.Tech + MBA Integrated", institution: "BITS Pilani", year: 2021 }],
        aiScore: 95,
        status: "hired",
        appliedDate: "2026-05-08",
        matchPercentage: 98,
        matchExplanation: "Exceptional candidate holding both solid technical baseline and strategic product experience.",
        resumeFile: "Meera_BITS_Product_Leader.pdf",
        jobId: "job-prd-001",
        jobTitle: "Product Manager",
        interviewScheduled: true,
        interviewCompleted: true,
        screenedByHR: true
      }
    ]);

    // Seed Candidate Profiles matching candidate emails
    await CandidateProfile.create(
      candidates.map(c => ({
        email: c.email,
        phone: c.phone,
        experienceYears: c.experienceYears,
        skills: c.skills,
        bio: `Professional profile for candidate ${c.name} specializing in ${c.jobTitle}.`,
        education: c.education
      }))
    );

    // 7. Seed Interview Sessions
    console.log("Seeding interview sessions...");
    const interviews = await InterviewSession.create([
      // Shortlisted designer
      {
        id: "int-session-vikram",
        candidateId: "cand-vikram-03",
        candidateName: "Vikram Candidate",
        jobId: "job-dsg-001",
        jobTitle: "UI/UX Lead Designer",
        questions: [
          { id: "q_dsg_1", question: "Explain your design system workflow in Figma.", category: "Technical", difficulty: "medium" },
          { id: "q_dsg_2", question: "How do you run usability tests for complex layouts?", category: "Technical", difficulty: "hard" }
        ],
        answers: [],
        status: "scheduled",
        scheduledDate: "2026-06-15T10:00:00.000Z",
        createdAt: "2026-06-05T09:00:00.000Z"
      },
      // Interviewed Sales Candidate
      {
        id: "int-session-sneha",
        candidateId: "cand-sneha-04",
        candidateName: "Sneha Candidate",
        jobId: "job-sls-001",
        jobTitle: "Senior Account Executive",
        questions: [
          { id: "q_sls_1", question: "How do you manage complex negotiations with enterprise buying committees?", category: "Sales", difficulty: "hard" },
          { id: "q_sls_2", question: "Describe your lead outreach process using CRM systems.", category: "Sales", difficulty: "medium" }
        ],
        answers: [
          {
            questionId: "q_sls_1",
            transcript: "I identify key stakeholders, align value propositions across departments, and coordinate pricing discussions to secure buy-in.",
            analysis: { communicationScore: 88, confidenceScore: 90, overallRating: 89 }
          },
          {
            questionId: "q_sls_2",
            transcript: "I execute daily sequences involving email automation, LinkedIn networking, and systematic cold follow ups mapped to Salesforce pipelines.",
            analysis: { communicationScore: 85, confidenceScore: 87, overallRating: 86 }
          }
        ],
        status: "completed",
        scheduledDate: "2026-06-10T11:00:00.000Z",
        createdAt: "2026-06-04T12:00:00.000Z"
      },
      // Hired Product Candidate
      {
        id: "int-session-meera",
        candidateId: "cand-meera-06",
        candidateName: "Meera Candidate",
        jobId: "job-prd-001",
        jobTitle: "Product Manager",
        questions: [
          { id: "q_prd_1", question: "What is your approach to prioritizing items on a product roadmap?", category: "Strategy", difficulty: "hard" },
          { id: "q_prd_2", question: "Describe a time when you had to manage stakeholders with conflicting goals.", category: "Leadership", difficulty: "medium" }
        ],
        answers: [
          {
            questionId: "q_prd_1",
            transcript: "I use a structured RICE framework, weighing potential user reach, business impact, and confidence against engineering efforts.",
            analysis: { communicationScore: 95, confidenceScore: 96, overallRating: 95 }
          },
          {
            questionId: "q_prd_2",
            transcript: "I aligned conflicting stakeholder directives by referencing data logs, establishing core user profiles, and running tests.",
            analysis: { communicationScore: 92, confidenceScore: 94, overallRating: 93 }
          }
        ],
        status: "completed",
        scheduledDate: "2026-06-02T14:30:00.000Z",
        createdAt: "2026-06-01T10:00:00.000Z"
      }
    ]);

    // 8. Seed Onboarding Record
    console.log("Seeding onboarding records...");
    const onboarding = await OnboardingRecord.create([
      {
        id: "onboard-record-meera",
        candidateId: "cand-meera-06",
        candidateName: "Meera Candidate",
        candidateEmail: "meera@candidate.com",
        jobTitle: "Product Manager",
        startDate: "2026-07-01",
        status: "Offer Accepted",
        offerLetterStatus: "Accepted",
        offerLetterSentDate: "2026-06-04",
        offerLetterAcceptedDate: "2026-06-05",
        offerLetterUrl: "https://cloudinary-dummy.com/meera_offer.pdf",
        documents: {
          identityProof: { url: "https://cloudinary-dummy.com/meera_id.jpg", status: "Approved", notes: "Aadhaar verified." },
          addressProof: { url: "https://cloudinary-dummy.com/meera_addr.jpg", status: "Approved", notes: "Utility bill matches." },
          resume: { url: "https://cloudinary-dummy.com/meera_cv.pdf", status: "Approved" },
          photo: { url: "https://cloudinary-dummy.com/meera_photo.jpg", status: "Approved" }
        },
        personalProfile: {
          phone: "+91 91111 77777",
          location: "Bangalore",
          address: "123 BITS Enclave, Koramangala, Bangalore",
          dob: "1999-04-12",
          skills: ["Product Strategy", "Agile Roadmap", "Competitive Analysis"],
          isCompleted: true
        },
        bankDetails: {
          accountName: "Meera Candidate",
          accountNumber: "919293949596",
          ifscCode: "HDFC0000123",
          bankName: "HDFC Bank",
          isSubmitted: true
        },
        joiningNotes: "Candidate will report directly to executive leadership team.",
        reportingManagerId: ashishId.toString(),
        reportingManagerName: "Ashish Gupta",
        tasks: [
          { id: "task-01", title: "Complete Personal Profile details", type: "form", completed: true },
          { id: "task-02", title: "Upload required identity verification documents", type: "document", completed: true },
          { id: "task-03", title: "Fill bank accounting ledger coordinates", type: "form", completed: true },
          { id: "task-04", title: "Request developer hardware setup", type: "task", completed: false }
        ]
      }
    ]);

    // 9. Seed Attendance Records & Trends
    console.log("Generating daily attendance logs over 30 days (May 8 to June 6)...");
    const attendanceRecords = [];
    const today = new Date("2026-06-06T12:00:00Z");

    const activeStaff = staffProfiles;
    const activeEmails = activeStaff.map(s => s.email.toLowerCase());

    // Setup attendance schedule for employees to target exact rates
    const attendanceSchedule = {
      "amit@employee.com": { absentDays: [12] }, // 29/30 = 96.7%
      "priya@employee.com": { absentDays: [10, 18] }, // 28/30 = 93.3%
      "neha@employee.com": { absentDays: [5, 15, 25] }, // 27/30 = 90.0%
      "siddharth@employee.com": { absentDays: [4, 11, 19, 27] }, // 26/30 = 86.7%
      "tanisha@employee.com": { absentDays: [], leaveDays: [15] }, // 29 present, 1 leave = 96.7%
      "rohit@employee.com": { absentDays: [], leaveDays: [2, 22] } // 28 present, 2 leave = 93.3%
    };

    const dailyTrendCounts = Array.from({ length: 30 }, () => 0);

    for (let dayIndex = 0; dayIndex < 30; dayIndex++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - dayIndex);
      const dateStr = currentDate.toISOString().split("T")[0];

      activeStaff.forEach(member => {
        const email = member.email.toLowerCase();
        let status = "Present";
        let checkIn = "09:30 AM";
        let checkOut = "06:30 PM";
        let hours = 9.0;

        if (attendanceSchedule[email]) {
          const config = attendanceSchedule[email];
          if (config.absentDays && config.absentDays.includes(dayIndex)) {
            status = "Absent";
            checkIn = "";
            checkOut = "";
            hours = 0;
          } else if (config.leaveDays && config.leaveDays.includes(dayIndex)) {
            status = "On Leave";
            checkIn = "";
            checkOut = "";
            hours = 0;
          }
        }

        attendanceRecords.push({
          employeeEmail: email,
          name: member.name,
          dept: member.department,
          date: dateStr,
          checkIn,
          checkOut,
          hours,
          status
        });

        if (status === "Present") {
          // Store count for day (index 0 is today, i.e. Day 30)
          dailyTrendCounts[29 - dayIndex]++;
        }
      });
    }

    console.log("Writing Attendance Records to database...");
    await AttendanceRecord.create(attendanceRecords);

    // Seed Attendance Trend
    const trends = dailyTrendCounts.map((presentCount, index) => ({
      day: index + 1,
      present: presentCount
    }));
    await AttendanceTrend.create(trends);

    // Seed Absent Today metrics placeholder (2 absentees)
    await AbsentToday.create([
      { name: "Siddharth Roy", dept: "Sales", consecutive: 1 },
      { name: "Neha Joshi", dept: "Design", consecutive: 2 }
    ]);
    console.log("Attendance generation completed.");

    // 10. Seed Leave Requests
    console.log("Seeding leave requests...");
    const leaves = await LeaveRequest.create([
      // 2 Approved Leaves
      {
        employeeId: "EMP006",
        name: "Amit Sharma",
        email: "amit@employee.com",
        department: "Engineering",
        type: "Earned Leave",
        startDate: "2026-05-15",
        endDate: "2026-05-17",
        days: 3,
        reason: "Family relocation tasks",
        status: "Approved",
        appliedOn: "2026-05-08",
        managerComment: "Relocation coordinates approved. Smooth moving!"
      },
      {
        employeeId: "EMP007",
        name: "Priya Patel",
        email: "priya@employee.com",
        department: "Product",
        type: "Medical Leave",
        startDate: "2026-05-20",
        endDate: "2026-05-21",
        days: 2,
        reason: "Medical consultation and rest",
        status: "Approved",
        appliedOn: "2026-05-18",
        managerComment: "Approved. Take rest and recover well."
      },
      // 2 Pending Leaves
      {
        employeeId: "EMP008",
        name: "Neha Joshi",
        email: "neha@employee.com",
        department: "Design",
        type: "Casual Leave",
        startDate: "2026-06-10",
        endDate: "2026-06-11",
        days: 2,
        reason: "Personal home maintenance appointments",
        status: "Pending",
        appliedOn: "2026-06-04"
      },
      {
        employeeId: "EMP009",
        name: "Siddharth Roy",
        email: "siddharth@employee.com",
        department: "Sales",
        type: "Medical Leave",
        startDate: "2026-06-12",
        endDate: "2026-06-15",
        days: 4,
        reason: "Scheduled outpatient medical procedure",
        status: "Pending",
        appliedOn: "2026-06-05"
      },
      // 1 Rejected Leave
      {
        employeeId: "EMP010",
        name: "Tanisha Jaiswal",
        email: "tanisha@employee.com",
        department: "Human Resources",
        type: "Casual Leave",
        startDate: "2026-05-25",
        endDate: "2026-05-26",
        days: 2,
        reason: "Casual vacation request",
        status: "Rejected",
        appliedOn: "2026-05-18",
        managerComment: "Declined due to overlapping team timelines and audit preparation schedules."
      }
    ]);

    // 11. Seed Payroll Records
    console.log("Seeding payroll records...");
    const payrolls = await PayrollRecord.create([
      {
        name: "Amit Sharma",
        email: "amit@employee.com",
        designation: "Senior Software Engineer",
        department: "Engineering",
        base: 85000,
        bonus: 10000,
        status: "Paid",
        lastPaymentDate: "2026-05-30"
      },
      {
        name: "Priya Patel",
        email: "priya@employee.com",
        designation: "Product Manager",
        department: "Product",
        base: 95000,
        bonus: 15000,
        status: "Paid",
        lastPaymentDate: "2026-05-30"
      },
      {
        name: "Neha Joshi",
        email: "neha@employee.com",
        designation: "UI/UX Lead Designer",
        department: "Design",
        base: 75000,
        bonus: 5000,
        status: "Paid",
        lastPaymentDate: "2026-05-30"
      },
      {
        name: "Siddharth Roy",
        email: "siddharth@employee.com",
        designation: "Senior Account Executive",
        department: "Sales",
        base: 100000,
        bonus: 20000,
        status: "Paid",
        lastPaymentDate: "2026-05-30"
      },
      {
        name: "Tanisha Jaiswal",
        email: "tanisha@employee.com",
        designation: "HR Generalist",
        department: "Human Resources",
        base: 80000,
        bonus: 10000,
        status: "Pending",
        lastPaymentDate: ""
      },
      {
        name: "Rohit Verma",
        email: "rohit@employee.com",
        designation: "Finance Analyst",
        department: "Finance",
        base: 90000,
        bonus: 15000,
        status: "Paid",
        lastPaymentDate: "2026-05-30"
      }
    ]);

    // 12. Seed Performance Reviews
    console.log("Seeding performance reviews...");
    const reviews = await PerformanceReview.create([
      // Amit Sharma reviewed by Ashish
      {
        employeeId: "EMP006",
        employeeEmail: "amit@employee.com",
        employeeName: "Amit Sharma",
        managerId: ashishId.toString(),
        managerName: "Ashish Gupta",
        quarter: "Q2 2026",
        score: 92,
        strengths: "Highly reliable backend delivery capabilities. Spearheaded database migrations.",
        improvements: "Encouraged to present team findings more proactively in cross-functional syncs.",
        reviewDate: new Date("2026-06-05T10:00:00Z"),
        ratings: { technical: 94, communication: 90, teamwork: 92, productivity: 92, overall: 92 },
        feedback: "Overall excellent output, strong technical execution.",
        date: new Date("2026-06-05T10:00:00Z")
      },
      // Priya Patel reviewed by Ashish
      {
        employeeId: "EMP007",
        employeeEmail: "priya@employee.com",
        employeeName: "Priya Patel",
        managerId: ashishId.toString(),
        managerName: "Ashish Gupta",
        quarter: "Q2 2026",
        score: 88,
        strengths: "Strong analytical breakdown. Solid user journey documentation during feature rollouts.",
        improvements: "Should monitor roadmap buffers closer to align with development sprint estimates.",
        reviewDate: new Date("2026-06-04T11:00:00Z"),
        ratings: { technical: 85, communication: 90, teamwork: 88, productivity: 88, overall: 88 },
        feedback: "Excellent analytical mapping, keep driving the backlog prioritization.",
        date: new Date("2026-06-04T11:00:00Z")
      },
      // Neha Joshi reviewed by Ashish
      {
        employeeId: "EMP008",
        employeeEmail: "neha@employee.com",
        employeeName: "Neha Joshi",
        managerId: ashishId.toString(),
        managerName: "Ashish Gupta",
        quarter: "Q2 2026",
        score: 84,
        strengths: "Stunning interface improvements. Consistently maintains design system hygiene.",
        improvements: "Needs to coordinate closer with frontend engineers on responsive breakpoints.",
        reviewDate: new Date("2026-06-03T14:00:00Z"),
        ratings: { technical: 86, communication: 82, teamwork: 84, productivity: 84, overall: 84 },
        feedback: "Excellent visual aesthetics, focus on delivery transitions.",
        date: new Date("2026-06-03T14:00:00Z")
      },
      // Siddharth Roy reviewed by Ananya
      {
        employeeId: "EMP009",
        employeeEmail: "siddharth@employee.com",
        employeeName: "Siddharth Roy",
        managerId: ananyaId.toString(),
        managerName: "Ananya Sen",
        quarter: "Q2 2026",
        score: 96,
        strengths: "Top performer this quarter. Secured three enterprise renewals and hit 120% target.",
        improvements: "Share pipeline insights and negotiation tactics in team mentoring sessions.",
        reviewDate: new Date("2026-06-05T15:00:00Z"),
        ratings: { technical: 92, communication: 98, teamwork: 95, productivity: 98, overall: 96 },
        feedback: "Stellar pipeline management. Exceptional sales execution.",
        date: new Date("2026-06-05T15:00:00Z")
      },
      // Tanisha Jaiswal reviewed by Ananya
      {
        employeeId: "EMP010",
        employeeEmail: "tanisha@employee.com",
        employeeName: "Tanisha Jaiswal",
        managerId: ananyaId.toString(),
        managerName: "Ananya Sen",
        quarter: "Q2 2026",
        score: 90,
        strengths: "Outstanding execution of employee audit documentation and onboarding setups.",
        improvements: "Encouraged to streamline workspace policy compliance logs using automation.",
        reviewDate: new Date("2026-06-04T16:00:00Z"),
        ratings: { technical: 88, communication: 92, teamwork: 90, productivity: 90, overall: 90 },
        feedback: "High execution standard. Keep automating checklist steps.",
        date: new Date("2026-06-04T16:00:00Z")
      },
      // Rohit Verma reviewed by Ananya
      {
        employeeId: "EMP011",
        employeeEmail: "rohit@employee.com",
        employeeName: "Rohit Verma",
        managerId: ananyaId.toString(),
        managerName: "Ananya Sen",
        quarter: "Q2 2026",
        score: 84,
        strengths: "Precise budgeting reports and spreadsheet audit trail management.",
        improvements: "Should optimize query responses to decrease delay in monthly ledger closure.",
        reviewDate: new Date("2026-06-03T10:00:00Z"),
        ratings: { technical: 85, communication: 82, teamwork: 84, productivity: 84, overall: 84 },
        feedback: "Highly details oriented. Streamline ledger calculations next quarter.",
        date: new Date("2026-06-03T10:00:00Z")
      }
    ]);

    // 13. Seed Activity Logs & notifications
    console.log("Seeding ad-hoc logs and notifications...");
    await ActivityLog.create([
      { employeeEmail: "amit@employee.com", action: "Login", details: "Logged into the HRise platform.", timestamp: new Date() },
      { employeeEmail: "amit@employee.com", action: "Check-In", details: "Clocked in for shift at 09:30 AM.", timestamp: new Date() },
      { employeeEmail: "priya@employee.com", action: "Check-In", details: "Clocked in for shift at 09:32 AM.", timestamp: new Date() },
      { employeeEmail: "siddharth@employee.com", action: "Performance Review Received", details: "Received performance review for Q2 2026 with overall score of 96/100.", timestamp: new Date() }
    ]);

    await Notification.create([
      { title: "New Candidate Application", message: "Arjun Candidate applied for the position of \"Senior Software Engineer\".", type: "upload", recipientRole: "recruiter" },
      { title: "Candidate Shortlisted", message: "Vikram Candidate has been shortlisted and progressed to the next stage.", type: "shortlist", recipientRole: "recruiter" },
      { title: "Interview Session Scheduled", message: "Interview scheduled with Vikram Candidate for position UI/UX Lead Designer.", type: "interview", recipientRole: "recruiter" }
    ]);

    console.log("Database seeded successfully.");

    // Print summary counts
    console.log("\nSeeding Completed Successfully:");
    console.log(`✓ Users: ${users.length}`);
    console.log(`✓ Staff Profiles: ${staffProfiles.length}`);
    console.log(`✓ Jobs: ${jobs.length}`);
    console.log(`✓ Candidates: ${candidates.length}`);
    console.log(`✓ Interviews: ${interviews.length}`);
    console.log(`✓ Leaves: ${leaves.length}`);
    console.log(`✓ Payroll Records: ${payrolls.length}`);
    console.log(`✓ Performance Reviews: ${reviews.length}`);
    console.log(`✓ Onboarding Records: ${onboarding.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding execution:", error);
    process.exit(1);
  }
}

seed();

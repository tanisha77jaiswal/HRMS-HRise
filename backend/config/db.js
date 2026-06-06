import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { AttendanceRecord, AbsentToday, AttendanceTrend } from "../models/attendanceModel.js";
import { PayrollRecord } from "../models/payrollModel.js";
import { PerformanceQuarter, PerformanceReview } from "../models/performanceModel.js";
import { StaffProfile } from "../models/staffModel.js";
import { Job } from "../models/jobModel.js";
import { Candidate } from "../models/candidateModel.js";
import { InterviewSession } from "../models/interviewModel.js";
import { OnboardingRecord } from "../models/onboardingModel.js";
import { LeaveRequest } from "../models/leaveModel.js";
import { Settings } from "../models/settingsModel.js";
import { ActivityLog } from "../models/activityLogModel.js";


export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrise";
  try {
    await mongoose.connect(mongoUri);
    console.log("🚀 MERN Backend: Successfully connected to MongoDB!");
    await seedDatabase();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

async function seedDatabase() {
  try {
    // Check if the database has already been seeded or users exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("🚀 MERN Seeding: Database already initialized. Skipping seeding.");

      const defaultUsers = [
        {
          id: "user-employee-preset",
          name: "Arjun Mehta",
          email: "employee@hrise.com",
          password: "password",
          role: "employee",
          company: "HRise Corp",
          department: "Engineering",
          designation: "Senior Software Engineer"
        },
        {
          id: "user-manager-preset",
          name: "Priya Sharma",
          email: "manager@hrise.com",
          password: "password",
          role: "senior_manager",
          company: "HRise Corp",
          department: "Engineering",
          designation: "Engineering Manager"
        },
        {
          id: "user-management-admin-preset",
          name: "Alex Morgan",
          email: "admin@hrise.com",
          password: "password",
          role: "management_admin",
          company: "HRise Corp",
          industry: "Technology",
          companySize: "51-200"
        },
        {
          id: "user-candidate-preset",
          name: "Sarah Johnson",
          email: "candidate@hrise.com",
          password: "password",
          role: "candidate",
          company: "N/A"
        },
        {
          id: "user-govind-candidate-preset",
          name: "Govind",
          email: "govind@example.com",
          password: "password",
          role: "candidate",
          company: "N/A"
        },
        {
          id: "user-govind-admin-preset",
          name: "Govind (Admin)",
          email: "govind@admin.com",
          password: "password",
          role: "management_admin",
          company: "HRise Corp",
          industry: "Technology",
          companySize: "51-200"
        },
        {
          id: "user-recruiter-preset",
          name: "Kavya Reddy",
          email: "recruiter@hrise.com",
          password: "password",
          role: "recruiter",
          company: "HRise Corp",
          department: "HR",
          designation: "HR Recruiter"
        },
        {
          id: "user-tanisha-preset",
          name: "Tanisha Jaiswal",
          email: "tanisha.jaiswal@screened.com",
          password: "password123",
          role: "candidate",
          company: "N/A"
        }
      ];

      for (const u of defaultUsers) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
          console.log(`🚀 MERN Seeding: Creating default user ${u.email}...`);
          const hashedPassword = await bcrypt.hash(u.password, 10);
          await User.create({
            id: u.id,
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            company: u.company,
            department: u.department,
            designation: u.designation,
            industry: u.industry,
            companySize: u.companySize
          });
          if (u.email === "employee@hrise.com") {
            await StaffProfile.findOneAndUpdate(
              { name: "Arjun Mehta" },
              { email: "employee@hrise.com" }
            );
          }
          if (u.email === "manager@hrise.com") {
            await StaffProfile.findOneAndUpdate(
              { name: "Priya Sharma" },
              { email: "manager@hrise.com" }
            );
          }
        }
      }

      // Ensure leaves and reviews are seeded if empty
      const leavesCount = await LeaveRequest.countDocuments();
      if (leavesCount === 0) {
        await seedLeaves();
      }

      const reviewsCount = await PerformanceReview.countDocuments();
      if (reviewsCount === 0) {
        await seedPerformanceReviews();
      }

      await linkSeedHierarchy();

      return;
    }

    // 1. Users
    await User.deleteMany({});
    const adminPassword = await bcrypt.hash("password", 10);
    const candPassword = await bcrypt.hash("password", 10);
    const empPassword = await bcrypt.hash("password", 10);
    const mgrPassword = await bcrypt.hash("password", 10);
    const recPassword = await bcrypt.hash("password", 10);
    await User.create([
      {
        id: "user-management-admin-preset",
        name: "Alex Morgan",
        email: "admin@hrise.com",
        password: adminPassword,
        role: "management_admin",
        company: "HRise Corp",
        industry: "Technology",
        companySize: "51-200"
      },
      {
        id: "user-recruiter-preset",
        name: "Kavya Reddy",
        email: "recruiter@hrise.com",
        password: recPassword,
        role: "recruiter",
        company: "HRise Corp",
        department: "HR",
        designation: "HR Recruiter"
      },
      {
        id: "user-candidate-preset",
        name: "Sarah Johnson",
        email: "candidate@hrise.com",
        password: candPassword,
        role: "candidate",
        company: "N/A"
      },
      {
        id: "user-employee-preset",
        name: "Arjun Mehta",
        email: "employee@hrise.com",
        password: empPassword,
        role: "employee",
        company: "HRise Corp",
        department: "Engineering",
        designation: "Senior Software Engineer"
      },
      {
        id: "user-manager-preset",
        name: "Priya Sharma",
        email: "manager@hrise.com",
        password: mgrPassword,
        role: "senior_manager",
        company: "HRise Corp",
        department: "Engineering",
        designation: "Engineering Manager"
      }
    ]);
    console.log("🚀 MERN Seeding: Users seeded!");

    // 2. Attendance & Settings
    await seedDailyAttendance();
    await AbsentToday.deleteMany({});
    await AttendanceTrend.deleteMany({});
    await AbsentToday.create([
      { name: "Marcus Hill",      dept: "Engineering",      consecutive: 3 },
      { name: "Priya Nair",       dept: "Design",           consecutive: 1 },
      { name: "Jordan Lee",       dept: "Sales",            consecutive: 2 },
      { name: "Sophia Turner",    dept: "HR",               consecutive: 1 },
      { name: "Daniel Brooks",    dept: "Finance",          consecutive: 4 },
      { name: "Ava Martinez",     dept: "Marketing",        consecutive: 1 },
      { name: "Noah Chen",        dept: "Operations",       consecutive: 2 }
    ]);
    const trendData = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      present: Math.floor(170 + Math.random() * 60 + Math.sin(i / 3) * 15)
    }));
    await AttendanceTrend.create(trendData);
    console.log("🚀 MERN Seeding: Attendance records (daily + trend) seeded!");

    // Seed Leave Policies in Settings
    await Settings.findOneAndUpdate(
      { workspaceId: "default" },
      { 
        workspaceId: "default", 
        medicalLeaveAllocated: 12, 
        casualLeaveAllocated: 10, 
        earnedLeaveAllocated: 15 
      },
      { upsert: true, new: true }
    );
    console.log("🚀 MERN Seeding: Leave policies in Settings seeded!");

    // 3. Payroll
    await PayrollRecord.deleteMany({});
    await PayrollRecord.create([
      { name: "Arjun Mehta",       email: "employee@hrise.com", designation: "Senior Software Engineer", department: "Engineering",    base: 125000, bonus: 15000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Priya Sharma",      email: "manager@hrise.com",  designation: "Product Manager",           department: "Product",        base: 145000, bonus: 20000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Rohit Verma",       email: "rohit.verma@hrise.com", designation: "UI/UX Designer",            department: "Design",         base: 85000,  bonus: 8000,  status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Sneha Iyer",        email: "sneha.iyer@hrise.in", designation: "HR Business Partner",       department: "HR",             base: 75000,  bonus: 5000,  status: "Pending", lastPaymentDate: "" },
      { name: "Karan Patel",       email: "karan.patel@hrise.com", designation: "DevOps Engineer",           department: "Engineering",    base: 110000, bonus: 12000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Ananya Nair",       email: "ananya.nair@hrise.com", designation: "Data Analyst",              department: "Analytics",      base: 70000,  bonus: 6000,  status: "Processing", lastPaymentDate: "" },
      { name: "Vikram Singh",      email: "vikram.singh@hrise.com", designation: "Finance Manager",           department: "Finance",        base: 130000, bonus: 18000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Meera Reddy",       email: "meera.reddy@hrise.com", designation: "Marketing Executive",       department: "Marketing",      base: 55000,  bonus: 4000,  status: "Pending", lastPaymentDate: "" },
      { name: "Amit Joshi",        email: "amit.joshi@hrise.com", designation: "Backend Developer",         department: "Engineering",    base: 95000,  bonus: 10000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Divya Gupta",       email: "divya.gupta@hrise.com", designation: "Business Analyst",          department: "Analytics",      base: 80000,  bonus: 7000,  status: "Processing", lastPaymentDate: "" },
      { name: "Rahul Khanna",      email: "rahul.khanna@hrise.com", designation: "QA Engineer",               department: "Engineering",    base: 65000,  bonus: 5000,  status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Pooja Agarwal",     email: "pooja.agarwal@hrise.com", designation: "Recruitment Specialist",    department: "HR",             base: 50000,  bonus: 3000,  status: "Pending", lastPaymentDate: "" },
      { name: "Nikhil Bose",       email: "nikhil.bose@hrise.com", designation: "Cloud Architect",           department: "Engineering",    base: 175000, bonus: 25000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Swati Kulkarni",    email: "swati.kulkarni@hrise.com", designation: "Content Strategist",        department: "Marketing",      base: 48000,  bonus: 3500,  status: "Pending", lastPaymentDate: "" },
      { name: "Deepak Tiwari",     email: "deepak.tiwari@hrise.com", designation: "Sales Manager",             department: "Sales",          base: 90000,  bonus: 22000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Lakshmi Venkat",    email: "lakshmi.venkat@hrise.com", designation: "Scrum Master",              department: "Engineering",    base: 115000, bonus: 13000, status: "Processing", lastPaymentDate: "" },
      { name: "Suresh Menon",      email: "suresh.menon@hrise.com", designation: "Legal Counsel",             department: "Legal",          base: 160000, bonus: 20000, status: "Paid", lastPaymentDate: "2026-05-30" },
      { name: "Rashmi Desai",      email: "rashmi.desai@hrise.com", designation: "Operations Executive",      department: "Operations",     base: 58000,  bonus: 4000,  status: "Pending", lastPaymentDate: "" }
    ]);
    console.log("🚀 MERN Seeding: Payroll seeded!");

    // Seed Activity Logs
    await seedActivityLogs();

    // 4. Performance
    await PerformanceQuarter.deleteMany({});
    console.log("🚀 MERN Seeding: Performance collection cleared!");

    // 5. Staff Profiles (from EmployeesPage)
    await StaffProfile.deleteMany({});
    await StaffProfile.create([
      { name: "Arjun Mehta", email: "employee@hrise.com", designation: "Senior Software Engineer", department: "Engineering", joinDate: "2021-03-15", employeeId: "EMP001", salaryBand: "L5", manager: "Priya Sharma", skills: ["React", "Node.js", "PostgreSQL", "Docker"], attendance: 96, status: "active", phone: "+91 98765 43210", location: "Bangalore" },
      { name: "Priya Sharma", email: "manager@hrise.com", designation: "Engineering Manager", department: "Engineering", joinDate: "2019-07-01", employeeId: "EMP002", salaryBand: "L7", manager: "Vikram Nair", skills: ["System Design", "Agile", "Go", "Kubernetes"], attendance: 98, status: "active", phone: "+91 97654 32109", location: "Bangalore" },
      { name: "Rohan Kapoor", email: "rohan.kapoor@hrise.in", designation: "Backend Developer", department: "Engineering", joinDate: "2022-01-10", employeeId: "EMP003", salaryBand: "L4", manager: "Priya Sharma", skills: ["Python", "Django", "Redis", "AWS"], attendance: 91, status: "active", phone: "+91 96543 21098", location: "Pune" },
      { name: "Sneha Iyer", email: "sneha.iyer@hrise.in", designation: "DevOps Engineer", department: "Engineering", joinDate: "2020-09-20", employeeId: "EMP004", salaryBand: "L5", manager: "Priya Sharma", skills: ["CI/CD", "Terraform", "Kubernetes", "Linux"], attendance: 94, status: "on_leave", phone: "+91 95432 10987", location: "Hyderabad" },
      { name: "Aditi Verma", email: "aditi.verma@hrise.in", designation: "Product Manager", department: "Product", joinDate: "2020-05-12", employeeId: "EMP005", salaryBand: "L6", manager: "Vikram Nair", skills: ["Roadmapping", "Analytics", "Figma", "SQL"], attendance: 97, status: "active", phone: "+91 94321 09876", location: "Mumbai" },
      { name: "Karan Malhotra", email: "karan.malhotra@hrise.in", designation: "Associate Product Manager", department: "Product", joinDate: "2023-02-01", employeeId: "EMP006", salaryBand: "L3", manager: "Aditi Verma", skills: ["User Research", "Wireframing", "Jira", "Data Analysis"], attendance: 89, status: "active", phone: "+91 93210 98765", location: "Delhi" },
      { name: "Meera Pillai", email: "meera.pillai@hrise.in", designation: "UI/UX Designer", department: "Design", joinDate: "2021-11-08", employeeId: "EMP007", salaryBand: "L4", manager: "Rahul Desai", skills: ["Figma", "Prototyping", "Design Systems", "Illustrator"], attendance: 95, status: "active", phone: "+91 92109 87654", location: "Bangalore" },
      { name: "Rahul Desai", email: "rahul.desai@hrise.in", designation: "Design Lead", department: "Design", joinDate: "2018-06-25", employeeId: "EMP008", salaryBand: "L6", manager: "Vikram Nair", skills: ["Brand Identity", "Motion Design", "Figma", "Sketch"], attendance: 99, status: "active", phone: "+91 91098 76543", location: "Mumbai" },
      { name: "Anjali Singh", email: "anjali.singh@hrise.in", designation: "Graphic Designer", department: "Design", joinDate: "2022-08-14", employeeId: "EMP009", salaryBand: "L3", manager: "Rahul Desai", skills: ["Photoshop", "Illustrator", "After Effects", "Canva"], attendance: 87, status: "on_leave", phone: "+91 90987 65432", location: "Chennai" },
      { name: "Vikram Nair", email: "vikram.nair@hrise.in", designation: "VP of Engineering", department: "Engineering", joinDate: "2017-04-03", employeeId: "EMP010", salaryBand: "L9", manager: "CEO", skills: ["Leadership", "Strategy", "Architecture", "Mentorship"], attendance: 100, status: "active", phone: "+91 89876 54321", location: "Bangalore" },
      { name: "Divya Krishnan", email: "divya.krishnan@hrise.in", designation: "Sales Executive", department: "Sales", joinDate: "2022-04-18", employeeId: "EMP011", salaryBand: "L3", manager: "Saurabh Joshi", skills: ["CRM", "Cold Calling", "Negotiation", "Salesforce"], attendance: 92, status: "active", phone: "+91 88765 43210", location: "Delhi" },
      { name: "Saurabh Joshi", email: "saurabh.joshi@hrise.in", designation: "Sales Manager", department: "Sales", joinDate: "2019-10-07", employeeId: "EMP012", salaryBand: "L6", manager: "Vikram Nair", skills: ["B2B Sales", "Pipeline Management", "HubSpot", "Presentations"], attendance: 96, status: "active", phone: "+91 87654 32109", location: "Mumbai" },
      { name: "Nidhi Agarwal", email: "nidhi.agarwal@hrise.in", designation: "Sales Development Rep", department: "Sales", joinDate: "2023-07-03", employeeId: "EMP013", salaryBand: "L2", manager: "Saurabh Joshi", skills: ["Lead Generation", "Email Outreach", "LinkedIn Sales", "Excel"], attendance: 88, status: "active", phone: "+91 86543 21098", location: "Pune" },
      { name: "Pooja Rao", email: "pooja.rao@hrise.in", designation: "HR Business Partner", department: "HR", joinDate: "2020-02-17", employeeId: "EMP014", salaryBand: "L5", manager: "Lakshmi Bhat", skills: ["Talent Acquisition", "Employee Relations", "HRIS", "Compliance"], attendance: 97, status: "active", phone: "+91 85432 10987", location: "Bangalore" },
      { name: "Lakshmi Bhat", email: "lakshmi.bhat@hrise.in", designation: "Head of HR", department: "HR", joinDate: "2016-11-28", employeeId: "EMP015", salaryBand: "L8", manager: "CEO", skills: ["HR Strategy", "Org Design", "Performance Management", "L&D"], attendance: 98, status: "active", phone: "+91 84321 09876", location: "Bangalore" },
      { name: "Sameer Khan", email: "sameer.khan@hrise.in", designation: "Financial Analyst", department: "Finance", joinDate: "2021-06-09", employeeId: "EMP016", salaryBand: "L4", manager: "Riya Gupta", skills: ["Financial Modeling", "Excel", "Power BI", "SAP"], attendance: 93, status: "active", phone: "+91 83210 98765", location: "Mumbai" },
      { name: "Riya Gupta", email: "riya.gupta@hrise.in", designation: "Finance Manager", department: "Finance", joinDate: "2018-09-14", employeeId: "EMP017", salaryBand: "L7", manager: "CFO", skills: ["Budgeting", "FP&A", "Tally", "IFRS"], attendance: 96, status: "active", phone: "+91 82109 87654", location: "Mumbai" },
      { name: "Tanmay Bhatt", email: "tanmay.bhatt@hrise.in", designation: "Operations Analyst", department: "Operations", joinDate: "2022-11-21", employeeId: "EMP018", salaryBand: "L3", manager: "Deepa Menon", skills: ["Process Optimization", "Lean", "Six Sigma", "Tableau"], attendance: 90, status: "active", phone: "+91 81098 76543", location: "Hyderabad" },
      { name: "Deepa Menon", email: "deepa.menon@hrise.in", designation: "Operations Manager", department: "Operations", joinDate: "2019-01-08", employeeId: "EMP019", salaryBand: "L6", manager: "Vikram Nair", skills: ["Supply Chain", "ERP", "Vendor Management", "KPI Tracking"], attendance: 94, status: "active", phone: "+91 80987 65432", location: "Chennai" },
      { name: "Harshit Dubey", email: "harshit.dubey@hrise.in", designation: "Logistics Coordinator", department: "Operations", joinDate: "2023-03-27", employeeId: "EMP020", salaryBand: "L2", manager: "Deepa Menon", skills: ["Inventory Management", "Vendor Coordination", "MS Office", "ERP"], attendance: 85, status: "on_leave", phone: "+91 79876 54321", location: "Delhi" },
      { name: "Ishaan Chowdhury", email: "ishaan.chowdhury@hrise.in", designation: "Full Stack Developer", department: "Engineering", joinDate: "2022-06-01", employeeId: "EMP021", salaryBand: "L4", manager: "Priya Sharma", skills: ["React", "TypeScript", "GraphQL", "MongoDB"], attendance: 93, status: "active", phone: "+91 78765 43210", location: "Kolkata" },
      { name: "Kavya Reddy", email: "kavya.reddy@hrise.in", designation: "HR Recruiter", department: "HR", joinDate: "2023-01-16", employeeId: "EMP022", salaryBand: "L3", manager: "Lakshmi Bhat", skills: ["Sourcing", "ATS", "Interviewing", "Employer Branding"], attendance: 91, status: "active", phone: "+91 77654 32109", location: "Bangalore" }
    ]);
    console.log("🚀 MERN Seeding: Staff profiles seeded!");

    // 6. Jobs (from JobDescriptionsPage)
    await Job.deleteMany({});
    await Job.create([]);
    console.log("🚀 MERN Seeding: Jobs seeded!");

    // 7. Candidates (from RecruitmentPage)
    await Candidate.deleteMany({});
    await Candidate.create([]);
    console.log("🚀 MERN Seeding: Candidates seeded!");

    // 8. Interview Sessions (from VideoInterviewsPage)
    await InterviewSession.deleteMany({});
    await InterviewSession.create([
      {
        id: "i1",
        candidateId: "c5",
        candidateName: "Divya Krishnan",
        jobId: "j5",
        jobTitle: "Sales Development Executive",
        status: "scheduled",
        scheduledDate: "2026-06-04T11:00:00.000Z",
        questions: [
          { id: "q3", question: "Describe a time when you had to explain a complex technical concept to a non-technical stakeholder.", category: "Communication", difficulty: "medium" },
          { id: "q5", question: "How do you stay current with the rapidly evolving AI/ML/Web landscape?", category: "Growth", difficulty: "easy" }
        ],
        answers: [],
        createdAt: new Date().toISOString()
      },
      {
        id: "i2",
        candidateId: "c6",
        candidateName: "Rohan Das",
        jobId: "j1",
        jobTitle: "Senior ML Engineer",
        status: "scheduled",
        scheduledDate: "2026-06-04T14:30:00.000Z",
        questions: [
          { id: "q1", question: "Tell us about your experience with machine learning projects. What was the most impactful one?", category: "Experience", difficulty: "medium" },
          { id: "q2", question: "How do you approach model selection when working on a new problem?", category: "Technical", difficulty: "hard" }
        ],
        answers: [],
        createdAt: new Date().toISOString()
      },
      {
        id: "i3",
        candidateId: "c1",
        candidateName: "Amit Sharma",
        jobId: "j1",
        jobTitle: "Senior ML Engineer",
        status: "completed",
        scheduledDate: "2026-06-02T10:00:00.000Z",
        questions: [
          { id: "q1", question: "Tell us about your experience with machine learning projects. What was the most impactful one?", category: "Experience", difficulty: "medium" },
          { id: "q2", question: "How do you approach model selection when working on a new problem?", category: "Technical", difficulty: "hard" },
          { id: "q6", question: "Walk us through how you would deploy a model or web application to production.", category: "DevOps", difficulty: "hard" }
        ],
        answers: [
          { questionId: "q1", transcript: "I worked on a recommendation model that improved customer CTR by 18% in three months.", analysis: { communicationScore: 8, confidenceScore: 9, overallRating: 9 } },
          { questionId: "q2", transcript: "I start by setting up a simple baseline using regression or a basic random forest, and then evaluate...", analysis: { communicationScore: 8, confidenceScore: 8, overallRating: 8 } },
          { questionId: "q6", transcript: "We packaged the models using Docker containerization, set up validation checks, and deployed them to AWS SageMaker...", analysis: { communicationScore: 9, confidenceScore: 9, overallRating: 9 } }
        ],
        createdAt: new Date().toISOString()
      }
    ]);
    console.log("🚀 MERN Seeding: Interview sessions seeded!");

    // 9. Onboarding Records (if needed)
    await OnboardingRecord.deleteMany({});
    await OnboardingRecord.create([
      {
        id: "o1",
        candidateId: "c3",
        candidateName: "Vikram Malhotra",
        candidateEmail: "vikram@outlook.com",
        jobTitle: "UI/UX Designer",
        startDate: "2026-06-15",
        status: "in-progress",
        tasks: [
          { id: "t1", title: "Submit background check documentation", completed: true },
          { id: "t2", title: "Sign employment contract agreement", completed: true },
          { id: "t3", title: "Complete IT setup & system access credentials request", completed: false },
          { id: "t4", title: "Schedule design team introduction", completed: false }
        ]
      }
    ]);
    console.log("🚀 MERN Seeding: Onboarding records seeded!");

    // Seed leaves and performance reviews
    await seedLeaves();
    await seedPerformanceReviews();

    // Link hierarchy relationships
    await linkSeedHierarchy();

  } catch (err) {
    console.error("❌ MERN Seeding failed:", err);
  }
}

async function seedLeaves() {
  await LeaveRequest.deleteMany({});
  await LeaveRequest.create([
    {
      employeeId: "EMP001",
      name: "Arjun Mehta",
      email: "employee@hrise.com",
      department: "Engineering",
      type: "Medical Leave",
      startDate: "2026-05-15",
      endDate: "2026-05-16",
      days: 2,
      reason: "Dental checkup and extraction recovery",
      status: "Approved",
      appliedOn: "2026-05-12",
      managerComment: "Rest well!"
    },
    {
      employeeId: "EMP001",
      name: "Arjun Mehta",
      email: "employee@hrise.com",
      department: "Engineering",
      type: "Casual Leave",
      startDate: "2026-04-20",
      endDate: "2026-04-21",
      days: 2,
      reason: "Attending friend's wedding",
      status: "Approved",
      appliedOn: "2026-04-15",
      managerComment: "Approved. Congratulations to your friend!"
    },
    {
      employeeId: "EMP001",
      name: "Arjun Mehta",
      email: "employee@hrise.com",
      department: "Engineering",
      type: "Casual Leave",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      days: 3,
      reason: "Family trip",
      status: "Pending",
      appliedOn: "2026-06-01"
    },
    {
      employeeId: "EMP004",
      name: "Sneha Iyer",
      email: "sneha.iyer@hrise.in",
      department: "Engineering",
      type: "Medical Leave",
      startDate: "2026-06-14",
      endDate: "2026-06-17",
      days: 4,
      reason: "Flu recovery",
      status: "Pending",
      appliedOn: "2026-06-02"
    }
  ]);
  console.log("🚀 MERN Seeding: Leaves seeded!");
}

async function seedPerformanceReviews() {
  await PerformanceReview.deleteMany({});
  await PerformanceReview.create([
    // ── Q2 2026 Reviews ──
    {
      employeeId: "seeded-arjun-id",
      managerId: "seeded-priya-id",
      score: 97,
      employeeEmail: "employee@hrise.com",
      employeeName: "Arjun Mehta",
      managerName: "Priya Sharma",
      quarter: "Q2 2026",
      ratings: { technical: 98, communication: 95, teamwork: 97, productivity: 98, overall: 97 },
      feedback: "Arjun continues to show exceptional engineering leadership. Led the frontend architecture revamp and delivered all features on time.",
      date: new Date("2026-06-05T10:00:00Z")
    },
    {
      employeeId: "seeded-priya-id",
      managerId: "seeded-vikram-id",
      score: 94,
      employeeEmail: "manager@hrise.com",
      employeeName: "Priya Sharma",
      managerName: "Vikram Nair",
      quarter: "Q2 2026",
      ratings: { technical: 92, communication: 96, teamwork: 94, productivity: 94, overall: 94 },
      feedback: "Priya is an excellent Engineering Manager. Her team's velocity and morale remain very high.",
      date: new Date("2026-06-04T11:00:00Z")
    },
    // ── Q1 2026 Reviews ──
    {
      employeeId: "seeded-arjun-id",
      managerId: "seeded-priya-id",
      score: 93,
      employeeEmail: "employee@hrise.com",
      employeeName: "Arjun Mehta",
      managerName: "Priya Sharma",
      quarter: "Q1 2026",
      ratings: { technical: 95, communication: 90, teamwork: 92, productivity: 94, overall: 93 },
      feedback: "Arjun delivered high quality code for the API optimization initiative. His technical skills are excellent.",
      date: new Date("2026-03-15T10:00:00Z")
    },
    {
      employeeId: "seeded-priya-id",
      managerId: "seeded-vikram-id",
      score: 95,
      employeeEmail: "manager@hrise.com",
      employeeName: "Priya Sharma",
      managerName: "Vikram Nair",
      quarter: "Q1 2026",
      ratings: { technical: 93, communication: 96, teamwork: 94, productivity: 95, overall: 95 },
      feedback: "Priya managed the Q1 product deliverables successfully. Great coordination and communication.",
      date: new Date("2026-03-14T10:00:00Z")
    }
  ]);
  console.log("🚀 MERN Seeding: Performance reviews seeded!");
}

async function linkSeedHierarchy() {
  try {
    const priya = await User.findOne({ name: "Priya Sharma", role: "senior_manager" });
    if (priya) {
      const teamEmails = ["employee@hrise.com", "rohan.kapoor@hrise.in", "sneha.iyer@hrise.in", "ishaan.chowdhury@hrise.in"];
      await User.updateMany(
        { email: { $in: teamEmails } },
        { reportingManager: priya._id }
      );
      await StaffProfile.updateMany(
        { email: { $in: teamEmails } },
        {
          reportingManagerId: priya._id,
          reportingManagerEmail: priya.email,
          manager: priya.name
        }
      );
      console.log("🚀 MERN Hierarchy Seeding: Connected Arjun and others to manager Priya Sharma!");
    }

    const vikram = await User.findOne({ name: "Vikram Nair" });
    if (vikram) {
      const vikramTeam = ["manager@hrise.com", "aditi.verma@hrise.in", "rahul.desai@hrise.in", "saurabh.joshi@hrise.in", "deepa.menon@hrise.in"];
      await User.updateMany({ email: { $in: vikramTeam } }, { reportingManager: vikram._id });
      await StaffProfile.updateMany({ email: { $in: vikramTeam } }, {
        reportingManagerId: vikram._id,
        reportingManagerEmail: vikram.email,
        manager: vikram.name
      });
    }

    const aditi = await User.findOne({ name: "Aditi Verma" });
    if (aditi) {
      const aditiTeam = ["karan.malhotra@hrise.in"];
      await User.updateMany({ email: { $in: aditiTeam } }, { reportingManager: aditi._id });
      await StaffProfile.updateMany({ email: { $in: aditiTeam } }, {
        reportingManagerId: aditi._id,
        reportingManagerEmail: aditi.email,
        manager: aditi.name
      });
    }

    const rahulD = await User.findOne({ name: "Rahul Desai" });
    if (rahulD) {
      const rahulTeam = ["meera.pillai@hrise.in", "anjali.singh@hrise.in"];
      await User.updateMany({ email: { $in: rahulTeam } }, { reportingManager: rahulD._id });
      await StaffProfile.updateMany({ email: { $in: rahulTeam } }, {
        reportingManagerId: rahulD._id,
        reportingManagerEmail: rahulD.email,
        manager: rahulD.name
      });
    }

    const saurabh = await User.findOne({ name: "Saurabh Joshi" });
    if (saurabh) {
      const saurabhTeam = ["divya.krishnan@hrise.in", "nidhi.agarwal@hrise.in"];
      await User.updateMany({ email: { $in: saurabhTeam } }, { reportingManager: saurabh._id });
      await StaffProfile.updateMany({ email: { $in: saurabhTeam } }, {
        reportingManagerId: saurabh._id,
        reportingManagerEmail: saurabh.email,
        manager: saurabh.name
      });
    }

    const lakshmi = await User.findOne({ name: "Lakshmi Bhat" });
    if (lakshmi) {
      const lakshmiTeam = ["pooja.rao@hrise.in", "kavya.reddy@hrise.in"];
      await User.updateMany({ email: { $in: lakshmiTeam } }, { reportingManager: lakshmi._id });
      await StaffProfile.updateMany({ email: { $in: lakshmiTeam } }, {
        reportingManagerId: lakshmi._id,
        reportingManagerEmail: lakshmi.email,
        manager: lakshmi.name
      });
    }

    const riya = await User.findOne({ name: "Riya Gupta" });
    if (riya) {
      const riyaTeam = ["sameer.khan@hrise.in"];
      await User.updateMany({ email: { $in: riyaTeam } }, { reportingManager: riya._id });
      await StaffProfile.updateMany({ email: { $in: riyaTeam } }, {
        reportingManagerId: riya._id,
        reportingManagerEmail: riya.email,
        manager: riya.name
      });
    }

    const deepa = await User.findOne({ name: "Deepa Menon" });
    if (deepa) {
      const deepaTeam = ["tanmay.bhatt@hrise.in", "harshit.dubey@hrise.in"];
      await User.updateMany({ email: { $in: deepaTeam } }, { reportingManager: deepa._id });
      await StaffProfile.updateMany({ email: { $in: deepaTeam } }, {
        reportingManagerId: deepa._id,
        reportingManagerEmail: deepa.email,
        manager: deepa.name
      });
    }

  } catch (err) {
    console.error("❌ MERN seed hierarchy linking error:", err);
  }
}

async function seedDailyAttendance() {
  await AttendanceRecord.deleteMany({});
  const today = new Date();
  const recordsToCreate = [];
  
  const staff = [
    { email: "employee@hrise.com", name: "Arjun Mehta", dept: "Engineering" },
    { email: "manager@hrise.com", name: "Priya Sharma", dept: "Engineering" }
  ];
  
  for (const member of staff) {
    for (let i = 25; i >= 1; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const day = date.getDay();
      if (day === 0 || day === 6) continue; // Skip weekends
      
      const dateStr = date.toISOString().split("T")[0];
      const isAbsent = i === 12;
      const isOnLeave = i === 4; // Mock leave day
      
      recordsToCreate.push({
        employeeEmail: member.email,
        name: member.name,
        dept: member.dept,
        date: dateStr,
        checkIn: isAbsent ? "" : "09:30 AM",
        checkOut: isAbsent ? "" : "06:30 PM",
        hours: isAbsent ? 0 : 9.0,
        status: isAbsent ? "Absent" : (isOnLeave ? "On Leave" : "Present")
      });
    }
  }
  
  await AttendanceRecord.create(recordsToCreate);
  console.log("🚀 MERN Seeding: Daily Attendance seeded!");
}

async function seedActivityLogs() {
  await ActivityLog.deleteMany({});
  await ActivityLog.create([
    { employeeEmail: "employee@hrise.com", action: "Login", details: "Logged into HRise platform.", timestamp: new Date() },
    { employeeEmail: "employee@hrise.com", action: "Check-In", details: "Clocked in for shift at 09:30 AM.", timestamp: new Date() },
    { employeeEmail: "employee@hrise.com", action: "Profile Updated", details: "Updated profile contact/location details.", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { employeeEmail: "employee@hrise.com", action: "Payslip Downloaded", details: "Downloaded payslip for May 2026.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { employeeEmail: "employee@hrise.com", action: "Performance Review Received", details: "Received performance review for Q1 2026 with overall score of 93/100.", timestamp: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) }
  ]);
  console.log("🚀 MERN Seeding: Activity Logs seeded!");
}

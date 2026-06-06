import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  CheckCircle, 
  Sparkles, 
  Save, 
  FileText,
  MapPin,
  Building2,
  Shield,
  Laptop,
  Bell,
  Globe,
  Calendar,
  Clock,
  Users,
  Inbox,
  Video
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";
import { api } from "../utils/api";

const INDIAN_UNIVERSITIES = [
  "Indian Institute of Technology (IIT) Bombay",
  "Indian Institute of Technology (IIT) Delhi",
  "Indian Institute of Technology (IIT) Madras",
  "Indian Institute of Technology (IIT) Kharagpur",
  "Indian Institute of Technology (IIT) Kanpur",
  "Indian Institute of Technology (IIT) Roorkee",
  "Indian Institute of Technology (IIT) Guwahati",
  "Indian Institute of Technology (IIT) Hyderabad",
  "Indian Institute of Technology (IIT) BHU Varanasi",
  "Indian Institute of Technology (IIT) Indore",
  "Indian Institute of Technology (IIT) Ropar",
  "Indian Institute of Technology (IIT) Mandi",
  "Indian Institute of Technology (IIT) Gandhinagar",
  "Indian Institute of Technology (IIT) Patna",
  "Indian Institute of Technology (IIT) Bhubaneswar",
  "Indian Institute of Science (IISc) Bangalore",
  "Indian Institute of Information Technology (IIIT) Allahabad",
  "Indian Institute of Information Technology (IIIT) Gwalior",
  "Indian Institute of Information Technology (IIIT) Jabalpur",
  "Indian Institute of Information Technology (IIIT) Vadodara",
  "Indian Institute of Information Technology (IIIT) Pune",
  "Indian Institute of Information Technology (IIIT) Kota",
  "National Institute of Technology (NIT) Trichy",
  "National Institute of Technology (NIT) Surathkal",
  "National Institute of Technology (NIT) Warangal",
  "National Institute of Technology (NIT) Rourkela",
  "National Institute of Technology (NIT) Calicut",
  "National Institute of Technology (NIT) Kurukshetra",
  "National Institute of Technology (NIT) Durgapur",
  "National Institute of Technology (NIT) Silchar",
  "National Institute of Technology (NIT) Jaipur (MNIT)",
  "National Institute of Technology (NIT) Allahabad (MNNIT)",
  "National Institute of Technology (NIT) Bhopal (MANIT)",
  "National Institute of Technology (NIT) Nagpur (VNIT)",
  "Delhi Technological University (DTU)",
  "Netaji Subhas University of Technology (NSUT)",
  "College of Engineering Guindy (Anna University)",
  "Jadavpur University, Kolkata",
  "College of Engineering, Pune (COEP)",
  "Veermata Jijabai Technological Institute (VJTI), Mumbai",
  "Harcourt Butler Technical University (HBTU), Kanpur",
  "University of Delhi (DU)",
  "Banaras Hindu University (BHU)",
  "Jawaharlal Nehru University (JNU), Delhi",
  "Jamia Millia Islamia, Delhi",
  "Savitribai Phule Pune University",
  "University of Mumbai",
  "University of Calcutta",
  "University of Madras",
  "Birla Institute of Technology and Science (BITS) Pilani",
  "Birla Institute of Technology and Science (BITS) Goa",
  "Birla Institute of Technology and Science (BITS) Hyderabad",
  "Vellore Institute of Technology (VIT) Vellore",
  "Vellore Institute of Technology (VIT) Chennai",
  "Manipal Institute of Technology (MIT), Manipal",
  "SRM Institute of Science and Technology, Chennai",
  "Thapar Institute of Engineering and Technology, Patiala",
  "Amity University, Noida",
  "Amity University, Mumbai",
  "LNM Institute of Information Technology (LNMIIT), Jaipur",
  "Dhirubhai Ambani Institute of Information and Communication Technology (DA-IICT)",
  "Nirma University, Ahmedabad",
  "PSG College of Technology, Coimbatore",
  "Birla Institute of Technology (BIT) Mesra, Ranchi",
  "Symbiosis Institute of Technology, Pune",
  "Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar",
  "Lovely Professional University (LPU), Phagwara",
  "Chandigarh University, Gharuan",
  "Amrita Vishwa Vidyapeetham, Coimbatore",
  "Shiv Nadar University, Greater Noida",
  "Ashoka University, Sonipat",
  "RV College of Engineering (RVCE), Bengaluru",
  "BMS College of Engineering (BMSCE), Bengaluru",
  "MS Ramaiah Institute of Technology (MSRIT), Bengaluru",
  "PES University, Bengaluru",
  "Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad",
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Marketing"
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const role = user?.role || "recruiter";

  // Profile Form States (Candidate)
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [formDegree, setFormDegree] = useState("");
  const [formInstitution, setFormInstitution] = useState("");
  const [formGradYear, setFormGradYear] = useState("");
  const [formBio, setFormBio] = useState("");

  // Staff Specific States (HR Recruiter / Recruiter)
  const [formLocation, setFormLocation] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDateJoined, setFormDateJoined] = useState("");
  const [formNotificationLevel, setFormNotificationLevel] = useState("All Activity & Daily Summaries");
  const [formLanguage, setFormLanguage] = useState("English (US)");

  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedUniOption, setSelectedUniOption] = useState("");
  const [customUniText, setCustomUniText] = useState("");

  // Searchable university select box states
  const [uniSearchQuery, setUniSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [candidateApplications, setCandidateApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [onboardings, setOnboardings] = useState([]);
  const [sessionsCount, setSessionsCount] = useState(0);

  // Senior Manager metrics
  const [managerTeamCount, setManagerTeamCount] = useState(0);
  const [managerLeavesCount, setManagerLeavesCount] = useState(0);
  const [managerReviewsCount, setManagerReviewsCount] = useState(0);

  // Load jobs to resolve titles dynamically
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { api } = await import("../utils/api");
        const jobList = await api.jobs.getAll();
        if (Array.isArray(jobList)) setJobs(jobList);
      } catch (e) {
        console.error("Failed to load jobs for profile:", e);
      }
    };
    loadJobs();
  }, []);

  const [adminStats, setAdminStats] = useState(null);

  // Load metrics for HR Recruiter / Recruiter summary
  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      try {
        const { api } = await import("../utils/api");
        
        if (role === "senior_manager") {
          const [staffRes, leavesRes, reviewsRes] = await Promise.all([
            api.staff.getAll(),
            api.leaves.getAll(),
            api.performance.getReviews()
          ]);
          if (Array.isArray(staffRes)) {
            setManagerTeamCount(staffRes.filter(s => s.reportingManagerId === user.id || s.reportingManagerId === user._id).length);
          }
          if (Array.isArray(leavesRes)) {
            setManagerLeavesCount(leavesRes.filter(l => l.status === "pending").length);
          }
          if (Array.isArray(reviewsRes)) {
            setManagerReviewsCount(reviewsRes.length);
          }
        } else {
          const [candList, onbList, sessionsList] = await Promise.all([
            api.candidates.getAll(),
            api.onboarding.getAll(),
            api.interviews.getAll()
          ]);
          if (role === "management_admin") {
            const dashboardRes = await api.adminDashboard.get();
            if (dashboardRes) setAdminStats(dashboardRes);
          }
          if (Array.isArray(candList)) setCandidates(candList);
          if (Array.isArray(onbList)) setOnboardings(onbList);
          if (Array.isArray(sessionsList)) setSessionsCount(sessionsList.length);
        }
      } catch (e) {
        console.error("Failed to load profile metrics:", e);
      }
    };
    loadMetrics();
  }, [role, user]);

  // Sync profile details and applications on mount or user change — fetches from backend APIs
  useEffect(() => {
    if (!user) return;
    setFormName(user.name || "");
    setFormEmail(user.email || "");

    const loadProfileData = async () => {
      try {
        if (user.role === "candidate") {
          // 1. Fetch candidate profile from backend
          const profilesList = await api.candidateProfiles.getAll();
          const profile = Array.isArray(profilesList)
            ? profilesList.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase())
            : null;

          if (profile) {
            setFormPhone(profile.phone || "");
            setFormExperience(profile.experienceYears || "");
            setFormSkills(profile.skills?.join(", ") || "");
            setFormBio(profile.bio || "");
            setPhotoUrl(profile.photoUrl || "");
            if (profile.education && profile.education.length > 0) {
              setFormDegree(profile.education[0].degree || "");
              const inst = profile.education[0].institution || "";
              setFormInstitution(inst);
              if (INDIAN_UNIVERSITIES.includes(inst)) {
                setSelectedUniOption(inst);
                setUniSearchQuery(inst);
              } else if (inst === "") {
                setSelectedUniOption("");
                setUniSearchQuery("");
              } else {
                setSelectedUniOption("Other");
                setUniSearchQuery("Other (Type custom university name)");
                setCustomUniText(inst);
              }
              setFormGradYear(profile.education[0].year || "");
            }
          } else {
            setFormPhone(""); setFormExperience(""); setFormSkills(""); setFormBio("");
            setFormDegree(""); setFormInstitution(""); setSelectedUniOption("");
            setCustomUniText(""); setUniSearchQuery(""); setFormGradYear(""); setPhotoUrl("");
          }

          // 2. Fetch candidate applications from backend
          const candList = await api.candidates.getAll();
          if (Array.isArray(candList)) {
            const filtered = candList.filter(
              (c) =>
                c.email?.toLowerCase() === user.email?.toLowerCase() ||
                c.name?.toLowerCase() === user.name?.toLowerCase()
            );
            setCandidateApplications(filtered);
          }
        } else {
          // Staff profile — fetch from backend
          const record = await api.staff.getMyProfile().catch(() => null);

          if (record) {
            setFormName(record.name || user.name);
            setFormPhone(record.phone || "");
            setFormLocation(record.location || "");
            setFormDepartment(record.department || "");
            setFormJobTitle(record.jobTitle || "");
            setFormEmployeeId(record.employeeId || "");
            setFormDateJoined(record.dateJoined || "");
            setFormNotificationLevel(record.notificationLevel || "All Activity & Daily Summaries");
            setFormLanguage(record.language || "English (US)");
            setPhotoUrl(record.photoUrl || "");
          } else {
            setFormPhone(""); setFormLocation(""); setFormDepartment(""); setFormJobTitle("");
            setFormEmployeeId(""); setFormDateJoined("");
            setFormNotificationLevel("All Activity & Daily Summaries");
            setFormLanguage("English (US)"); setPhotoUrl("");
          }
        }
      } catch (e) {
        console.error("Failed to load profile data from backend:", e);
      }
    };

    loadProfileData();
  }, [user]);

  const getJobTitle = (jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    return job ? job.title : "Software Engineer";
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    // Prepare form data for Multer upload
    const formData = new FormData();
    formData.append("photo", file);

    try {
      // Attempt upload to Express Multer server on port 5000
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setPhotoUrl(data.url);
          
          // Sync with AuthContext and save to profiles database
          updateUser({ photoUrl: data.url });
          if (user?.role === "candidate") {
            updateCandidateProfileField("photoUrl", data.url);
          } else {
            updateStaffProfileField("photoUrl", data.url);
          }

          addHriseNotification(
            "Profile Photo Updated",
            "Your profile photo has been uploaded successfully.",
            "info",
            user?.role || "candidate"
          );
          setUploadingPhoto(false);
          return;
        }
      }
      throw new Error("Express upload server returned an error.");
    } catch (err) {
      console.warn("Server upload failed, falling back to local Base64 storage:", err);
      
      // Local fallback: convert to Base64 data URI
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        setPhotoUrl(base64Url);

        // Sync with AuthContext and save to local databases
        updateUser({ photoUrl: base64Url });
        if (user?.role === "candidate") {
          updateCandidateProfileField("photoUrl", base64Url);
        } else {
          updateStaffProfileField("photoUrl", base64Url);
        }

        addHriseNotification(
          "Profile Photo Updated",
          "Your profile photo has been saved and is now visible on your profile.",
          "info",
          user?.role || "candidate"
        );
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStaffProfileField = async (field, value) => {
    try {
      const record = await api.staff.getMyProfile().catch(() => null);
      if (record) {
        await api.staff.save({ ...record, [field]: value });
      }
    } catch (e) {
      console.error("Failed to update staff profile field:", e);
    }
    window.dispatchEvent(new Event("hrise_dashboard_refresh"));
  };

  const updateCandidateProfileField = async (field, value) => {
    if (user?.role !== "candidate") return;
    try {
      const profilesList = await api.candidateProfiles.getAll();
      const existing = Array.isArray(profilesList)
        ? profilesList.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase())
        : null;
      const activeProfile = existing
        ? { ...existing, [field]: value }
        : { email: (formEmail || user.email).toLowerCase(), name: formName || user.name, [field]: value };
      await api.candidateProfiles.save(activeProfile);

      // Also update candidate record so recruiters see updated info
      const candList = await api.candidates.getAll();
      if (Array.isArray(candList)) {
        const match = candList.find(
          (c) => c.email?.toLowerCase() === user.email?.toLowerCase() || c.name?.toLowerCase() === user.name?.toLowerCase()
        );
        if (match) {
          await api.candidates.update(match._id || match.id, { [field]: value });
        }
      }
    } catch (e) {
      console.error("Failed to update candidate profile field:", e);
    }
    window.dispatchEvent(new Event("hrise_dashboard_refresh"));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    updateUser({ name: formName, email: formEmail, photoUrl: photoUrl });

    if (user?.role === "candidate") {
      const newProfile = {
        email: formEmail.toLowerCase(),
        name: formName,
        phone: formPhone,
        photoUrl: photoUrl,
        experienceYears: Number(formExperience) || 0,
        skills: formSkills.split(",").map((s) => s.trim()).filter(Boolean),
        bio: formBio,
        education: [
          { degree: formDegree, institution: formInstitution, year: Number(formGradYear) || 0 }
        ]
      };

      // 1. Save candidate profile to backend
      try {
        await api.candidateProfiles.save(newProfile);
      } catch (e) {
        console.error("Error saving candidate profile:", e);
      }

      // 2. Update matching candidate record in backend so recruiters see updated info
      try {
        const candList = await api.candidates.getAll();
        if (Array.isArray(candList)) {
          const match = candList.find(
            (c) => c.email?.toLowerCase() === user.email?.toLowerCase() || c.name?.toLowerCase() === user.name?.toLowerCase()
          );
          if (match) {
            await api.candidates.update(match._id || match.id, {
              name: formName, email: formEmail, phone: formPhone, photoUrl,
              experienceYears: Number(formExperience) || 0,
              skills: formSkills.split(",").map((s) => s.trim()).filter(Boolean),
              education: [{ degree: formDegree, institution: formInstitution, year: Number(formGradYear) || 0 }]
            });
            // Refresh local applications display
            setCandidateApplications((prev) => prev.map((c) =>
              (c._id || c.id) === (match._id || match.id)
                ? { ...c, name: formName, email: formEmail }
                : c
            ));
          }
        }
      } catch (e) {
        console.error("Error syncing candidate record:", e);
      }

      window.dispatchEvent(new Event("hrise_dashboard_refresh"));
    } else {
      // HR Recruiter / Staff save flow — push directly to backend
      const updatedRecord = {
        email: formEmail.toLowerCase(),
        name: formName,
        phone: formPhone,
        location: formLocation,
        department: formDepartment,
        jobTitle: formJobTitle,
        employeeId: formEmployeeId,
        dateJoined: formDateJoined,
        notificationLevel: formNotificationLevel,
        language: formLanguage,
        photoUrl: photoUrl
      };

      try {
        await api.staff.save(updatedRecord);
      } catch (e) {
        console.error("Error saving staff profile:", e);
      }

      // Update name and email and photoUrl in AuthContext
      updateUser({
        name: formName,
        email: formEmail,
        photoUrl: photoUrl
      });
      window.dispatchEvent(new Event("storage"));
    }

    // Trigger Notification
    addHriseNotification(
      "Profile Updated",
      user?.role === "candidate"
        ? "Your professional profile has been updated successfully. Changes are now visible to HR."
        : "Your profile details have been saved successfully.",
      "shortlist",
      user?.role || "candidate"
    );

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const highestScore = candidateApplications.length > 0 
    ? Math.max(...candidateApplications.map((c) => c.aiScore))
    : null;

  const latestResume = candidateApplications.length > 0
    ? candidateApplications[0].resumeFile
    : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="My Profile" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              My Profile
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your personal credentials and professional technical background.
            </p>
          </div>

          {/* Floating Toast Notification */}
          {saveSuccess && (
            <div
              style={{
                position: "fixed",
                bottom: "28px",
                right: "28px",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "16px",
                boxShadow: "0 8px 30px rgba(5,150,105,0.35)",
                fontFamily: "inherit",
                minWidth: "260px",
                animation: "slideInToast 0.35s cubic-bezier(.21,1.02,.73,1) both"
              }}
            >
              <CheckCircle size={22} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", margin: 0 }}>Profile updated successfully</p>
                <p style={{ fontSize: "12px", opacity: 0.85, margin: 0, marginTop: "2px" }}>Your changes have been saved.</p>
              </div>
              <style>{`
                @keyframes slideInToast {
                  from { opacity: 0; transform: translateY(24px) scale(0.97); }
                  to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
              `}</style>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Card: Summary Avatar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-8 text-center border border-gray-200/80 shadow-lg shadow-gray-100/50 rounded-2xl bg-white relative overflow-hidden">
                {/* Decorative top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                {/* Profile Photo Uploader container */}
                <div className="relative w-28 h-28 mx-auto mb-5 group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {/* Photo Display */}
                  <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-indigo-50 border-2 border-white shadow-lg relative bg-gray-50 flex items-center justify-center transition-all duration-300 group-hover:ring-8 group-hover:ring-indigo-100/60">
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt={user?.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white text-4xl font-extrabold uppercase animate-fade-in shadow-inner">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Change Photo Overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-extrabold gap-1.5 cursor-pointer transition-all duration-300 scale-95 group-hover:scale-100 backdrop-blur-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    Change Photo
                  </button>

                  {/* Badge */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-md z-10 pointer-events-none group-hover:scale-110 transition-transform duration-200">
                    <Sparkles size={14} className="text-white fill-white animate-pulse" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h3>
                
                {/* Dynamic Role Badges */}
                {role === "recruiter" && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm mt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    HR Recruiteristrator
                  </div>
                )}
                {false && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm mt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Talent Recruiter
                  </div>
                )}
                {role === "candidate" && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-100 shadow-sm mt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Job Applicant
                  </div>
                )}

                {role === "candidate" ? (
                  <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Top AI Screen Score</span>
                      <Badge variant={highestScore ? "success" : "default"} className="font-extrabold">
                        {highestScore ? `${highestScore}/100` : "N/A"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Experience Level</span>
                      <span className="text-slate-800 font-extrabold">{formExperience ? `${formExperience} Years` : "Not Specified"}</span>
                    </div>
                    
                    {/* Dynamic Applications List */}
                    <div className="mt-4 pt-4 border-t border-slate-100 text-left space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Active Applications</p>
                      {candidateApplications.length > 0 ? (
                        <div className="space-y-2">
                          {candidateApplications.map((app) => (
                            <div key={app.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] hover:bg-indigo-50/20 transition-colors">
                              <span className="font-bold text-slate-800 truncate max-w-[120px]">{getJobTitle(app.jobId)}</span>
                              <Badge
                                variant={
                                  app.status === "shortlisted"
                                    ? "success"
                                    : app.status === "rejected"
                                      ? "danger"
                                      : app.status === "interviewed"
                                        ? "info"
                                        : app.status === "selected"
                                          ? "purple"
                                          : "default"
                                }
                                className="text-[9px] font-bold px-2 py-0.5 capitalize shadow-sm"
                              >
                                {app.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <span className="text-[10px] text-slate-400 font-semibold italic">No jobs applied for yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Workspace Activity</p>
                    
                    {role === "recruiter" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Users size={14} />
                            </div>
                            Screened Candidates
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{candidates.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-purple-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <CheckCircle size={14} />
                            </div>
                            Active Onboardings
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{onboardings.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Briefcase size={14} />
                            </div>
                            Active Job Openings
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{jobs.filter(j => j.status !== "closed").length}</span>
                        </div>
                      </div>
                    ) : role === "management_admin" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Users size={14} />
                            </div>
                            Total Employees
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{adminStats?.kpis?.employees || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-purple-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Shield size={14} />
                            </div>
                            Active Recruiters
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{adminStats?.kpis?.recruiters || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Briefcase size={14} />
                            </div>
                            Open Job Positions
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{adminStats?.kpis?.openJobs || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-amber-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Building2 size={14} />
                            </div>
                            Total Departments
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{adminStats?.deptDistribution?.length || 0}</span>
                        </div>
                      </div>
                    ) : role === "senior_manager" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-blue-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Users size={14} />
                            </div>
                            Team Members
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{managerTeamCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-purple-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <CheckCircle size={14} />
                            </div>
                            Pending Leave Approvals
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{managerLeavesCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Briefcase size={14} />
                            </div>
                            Performance Reviews
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{managerReviewsCount}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-blue-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <FileText size={14} />
                            </div>
                            Screened Resumes
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{candidates.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-purple-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Video size={14} />
                            </div>
                            Scheduled Interviews
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{sessionsCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-150 transition-all duration-200 cursor-default group">
                          <span className="text-xs text-slate-650 font-bold flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-250 shadow-sm">
                              <Briefcase size={14} />
                            </div>
                            Active Job Openings
                          </span>
                          <span className="text-slate-900 font-black text-base tracking-tight">{jobs.filter(j => j.status !== "closed").length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {role === "candidate" && latestResume && (
                <Card className="p-5 border border-gray-200 shadow-sm rounded-2xl bg-white">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📁 Screened Document</h4>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                    <FileText size={24} className="text-indigo-600 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate">{latestResume}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">PDF Document • Screened</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Card: Full Form Editing */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSave} className="space-y-6">
                {role === "candidate" ? (
                  <>
                    {/* Candidate Section 1: Personal Profile details */}
                    <Card className="p-6 border border-gray-200 shadow-sm rounded-2xl bg-white space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                          <User size={18} className="text-indigo-600" />
                          Personal Details
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Update your basic communication credentials</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              required
                              value={formEmail}
                              onChange={(e) => setFormEmail(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              placeholder="+91-98765-43210"
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Years of Domain Experience</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formExperience}
                            onChange={(e) => setFormExperience(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Candidate Section 2: Technical Skills & Background */}
                    <Card className="p-6 border border-gray-200 shadow-sm rounded-2xl bg-white space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                          <Briefcase size={18} className="text-indigo-600" />
                          Professional Skills & Bio
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Describe your background and core technical capabilities</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Technical Skills (Comma-separated)</label>
                          <textarea
                            required
                            value={formSkills}
                            onChange={(e) => setFormSkills(e.target.value)}
                            placeholder="React, TypeScript, Tailwind CSS, Node.js, Jest"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500 h-24 resize-none leading-relaxed"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Separate keywords with commas so the AI Screen evaluator matches them with job openings.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Professional Bio / Profile Summary</label>
                          <textarea
                            required
                            value={formBio}
                            onChange={(e) => setFormBio(e.target.value)}
                            placeholder="A brief overview of your technical background..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500 h-32 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Candidate Section 3: Educational Background */}
                    <Card className="p-6 border border-gray-200 shadow-sm rounded-2xl bg-white space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                          <GraduationCap size={18} className="text-indigo-600" />
                          Educational Background
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">State your latest academic credentials and university</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Degree / Qualification</label>
                          <input
                            type="text"
                            required
                            value={formDegree}
                            onChange={(e) => setFormDegree(e.target.value)}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Graduation Year</label>
                          <input
                            type="number"
                            required
                            min="1990"
                            max="2032"
                            value={formGradYear}
                            onChange={(e) => setFormGradYear(e.target.value)}
                            placeholder="e.g. 2025"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                          />
                        </div>

                        {/* Searchable select dropdown for university */}
                        <div className="sm:col-span-1 relative">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">University / College</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={uniSearchQuery}
                              onFocus={() => setShowDropdown(true)}
                              onChange={(e) => {
                                setUniSearchQuery(e.target.value);
                                setShowDropdown(true);
                                if (selectedUniOption !== "Other") {
                                  setFormInstitution(e.target.value);
                                }
                              }}
                              placeholder="Search or Select University..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              ▼
                            </div>
                          </div>

                          {showDropdown && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 divide-y divide-gray-50 custom-scrollbar animate-fade-in">
                                {INDIAN_UNIVERSITIES.filter((uni) =>
                                  uni.toLowerCase().includes(uniSearchQuery.toLowerCase())
                                ).length > 0 ? (
                                  INDIAN_UNIVERSITIES.filter((uni) =>
                                    uni.toLowerCase().includes(uniSearchQuery.toLowerCase())
                                  ).map((uni) => (
                                    <button
                                      key={uni}
                                      type="button"
                                      onClick={() => {
                                        setUniSearchQuery(uni);
                                        setFormInstitution(uni);
                                        setSelectedUniOption(uni);
                                        setShowDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                                    >
                                      {uni}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-xs text-gray-400 italic">No matches found.</div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUniSearchQuery("Other");
                                    setSelectedUniOption("Other");
                                    setFormInstitution(customUniText);
                                    setShowDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-155 cursor-pointer"
                                >
                                  ✨ Other (Type custom university name)
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {selectedUniOption === "Other" && (
                          <div className="sm:col-span-3 animate-fade-in">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Custom University / Institution Name</label>
                            <input
                              type="text"
                              required
                              value={customUniText}
                              onChange={(e) => {
                                setCustomUniText(e.target.value);
                                setFormInstitution(e.target.value);
                              }}
                              placeholder="e.g. Delhi Technological University"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-gray-800 focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* Staff Card 1: Contact & Professional Details */}
                    <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <User size={16} />
                          </div>
                          Personal Details
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Update your basic communication credentials and primary office hub</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 shadow-inner placeholder-slate-450"
                              placeholder="Alex Morgan"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={formEmail}
                              onChange={(e) => setFormEmail(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 shadow-inner placeholder-slate-450"
                              placeholder="alex.morgan@hrise.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Contact Number</label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              placeholder="Not Provided"
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 shadow-inner placeholder-slate-450"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Office Location</label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={formLocation}
                              onChange={(e) => setFormLocation(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all duration-200"
                            >
                              <option value="" disabled>Not Provided</option>
                              <option value="Headquarters (Bangalore)">Headquarters (Bangalore)</option>
                              <option value="Remote (Work From Home)">Remote (Work From Home)</option>
                              <option value="London Office">London Office</option>
                              <option value="Singapore Hub">Singapore Hub</option>
                              <option value="US Tech Center">US Tech Center</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Staff Card 2: Company Designation & Credentials */}
                    <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Building2 size={16} />
                          </div>
                          Corporate & Role Details
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Enterprise organizational details and active workspace permissions</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {role === "management_admin" ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Workspace Role</label>
                              <div className="w-full px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm flex items-center">
                                Management Admin
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Business Unit / Department</label>
                              <div className="w-full px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm flex items-center">
                                {formDepartment || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Employee ID</label>
                              <div className="w-full px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm flex items-center">
                                {formEmployeeId || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Joining Date</label>
                              <div className="w-full px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm flex items-center">
                                {formDateJoined ? new Date(formDateJoined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Business Unit / Department</label>
                              <div className="relative">
                                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                  value={formDepartment}
                                  onChange={(e) => setFormDepartment(e.target.value)}
                                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all duration-200"
                                >
                                  <option value="" disabled>Select Department</option>
                                  {DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
                                  ▼
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Designation / Job Title</label>
                              <div className="relative">
                                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  value={formJobTitle}
                                  onChange={(e) => setFormJobTitle(e.target.value)}
                                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 shadow-inner placeholder-slate-450"
                                  placeholder="Enter Designation"
                                />
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                    </Card>

                    {/* Staff Card 3: Work Preferences & Configurations */}
                    <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Laptop size={16} />
                          </div>
                          System Preferences & Settings
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Customize notification delivery levels and default system configurations</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Notification Delivery</label>
                          <div className="relative">
                            <Bell size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={formNotificationLevel}
                              onChange={(e) => setFormNotificationLevel(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all duration-200"
                            >
                              <option value="All Activity & Daily Summaries">All Activity & Daily Summaries</option>
                              <option value="Important Alerts Only">Important Alerts Only</option>
                              <option value="Mute Non-Critical Activity">Mute Non-Critical Activity</option>
                              <option value="DND Mode (Do Not Disturb)">DND Mode (Do Not Disturb)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Default System Language</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={formLanguage}
                              onChange={(e) => setFormLanguage(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all duration-200"
                            >
                              <option value="English (US)">English (US)</option>
                              <option value="English (UK)">English (UK)</option>
                              <option value="Hindi (IN)">Hindi (IN)</option>
                              <option value="Spanish (ES)">Spanish (ES)</option>
                              <option value="German (DE)">German (DE)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    className="px-7 py-3.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center gap-2 cursor-pointer border border-transparent"
                  >
                    <Save size={16} />
                    Save Profile Settings
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

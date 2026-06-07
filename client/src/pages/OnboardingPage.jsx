import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import { syncFromBackend } from "../utils/sync";
import { addHriseNotification } from "../utils/notifications";
import {
  CheckCircle,
  FileText,
  Briefcase,
  MessageSquare,
  Mail,
  Clock,
  Shield,
  Upload,
  ChevronRight,
  CalendarDays,
  UserCheck,
  Sparkles,
  BookOpen,
  Laptop,
  CreditCard,
  PartyPopper,
  AlertCircle,
  Building2,
  Phone,
  ExternalLink,
  ChevronDown,
  User,
  Check,
  X,
  FileUp,
  FileBadge,
  UserPlus,
  ArrowUpRight
} from "lucide-react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const role = user?.role || "recruiter";

  const handleViewDocument = (url, label) => {
    if (!url) return;
    if (url.startsWith("data:")) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const b64 = parts[1];
        
        const sliceSize = 512;
        const byteCharacters = atob(b64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch (err) {
        console.error("Failed to parse and view data URI document:", err);
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
          newWindow.document.close();
        }
      }
    } else {
      window.open(url, "_blank", "noreferrer");
    }
  };

  // Data States
  const [onboardings, setOnboardings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOnboardingId, setSelectedOnboardingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Recruiter form states
  const [joiningDate, setJoiningDate] = useState("");
  const [joiningNotes, setJoiningNotes] = useState("");
  const [offerLetterUrl, setOfferLetterUrl] = useState("");
  const [docNotes, setDocNotes] = useState({}); // local comments for document verification

  // Conversion wizard state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDept, setConvertDept] = useState("Engineering");
  const [convertDesig, setConvertDesig] = useState("Software Engineer");
  const [convertManager, setConvertManager] = useState("");
  const [convertBand, setConvertBand] = useState("L3");
  const [convertSalary, setConvertSalary] = useState(80000);
  const [convertError, setConvertError] = useState("");
  const [convertSuccess, setConvertSuccess] = useState("");
  const [seniorManagers, setSeniorManagers] = useState([]);
  const [assignedManagerId, setAssignedManagerId] = useState("");
  const [convertManagerId, setConvertManagerId] = useState("");

  // Candidate form states
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dob, setDob] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  // Document upload local states (URLs or files)
  const [identityUrl, setIdentityUrl] = useState("");
  const [addressUrl, setAddressUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // AI Offer Letter Generator states
  const [generatorJobTitle, setGeneratorJobTitle] = useState("");
  const [generatorDept, setGeneratorDept] = useState("Engineering");
  const [generatorSalary, setGeneratorSalary] = useState("INR 8,00,000 per annum");
  const [generatorCompany, setGeneratorCompany] = useState("HRise Technologies");
  const [generatorDate, setGeneratorDate] = useState("");
  const [offerLetterPreviewText, setOfferLetterPreviewText] = useState("");
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);

  // Collapsible panels for candidate view
  const [expandedPanels, setExpandedPanels] = useState({
    offer: true,
    profile: false,
    bank: false,
    docs: false,
    checklist: true
  });

  // Fetch all module data
  const loadOnboardingData = async () => {
    try {
      setLoading(true);
      const onbList = await api.onboarding.getAll();
      setOnboardings(Array.isArray(onbList) ? onbList : []);

      const candList = await api.candidates.getAll();
      setCandidates(Array.isArray(candList) ? candList : []);

      const staffList = await api.staff.getAll();
      setStaff(Array.isArray(staffList) ? staffList : []);

      const mgrList = await api.staff.getSeniorManagers();
      setSeniorManagers(Array.isArray(mgrList) ? mgrList : []);
    } catch (e) {
      console.error("Error loading onboarding module:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingData();
    window.addEventListener("storage", loadOnboardingData);
    window.addEventListener("hrise_dashboard_refresh", loadOnboardingData);
    return () => {
      window.removeEventListener("storage", loadOnboardingData);
      window.removeEventListener("hrise_dashboard_refresh", loadOnboardingData);
    };
  }, []);

  // Filter candidates who are selected but not yet onboarded
  const selectedCandidatesNoOnboard = useMemo(() => {
    return candidates.filter(
      (c) =>
        (c.status === "selected" || c.status === "shortlisted") &&
        !onboardings.some((o) => o.candidateId === c.id || o.candidateEmail?.toLowerCase() === c.email?.toLowerCase())
    );
  }, [candidates, onboardings]);

  // Active onboarding record
  const currentRecord = useMemo(() => {
    if (role === "candidate") {
      // Find candidate's own onboarding
      return onboardings.find(
        (o) =>
          o.candidateEmail?.toLowerCase() === user?.email?.toLowerCase() ||
          o.candidateId === user?.id
      );
    }
    // Admin/Recruiter/Manager selector
    if (selectedOnboardingId) {
      return onboardings.find((o) => o.id === selectedOnboardingId);
    }
    return onboardings[0];
  }, [onboardings, selectedOnboardingId, role, user]);

  // Set default form values when record changes
  useEffect(() => {
    if (currentRecord) {
      // Populate recruiter fields
      setJoiningDate(currentRecord.joiningDate || "");
      setJoiningNotes(currentRecord.joiningNotes || "");
      setAssignedManagerId(currentRecord.reportingManagerId || "");
      setOfferLetterUrl(currentRecord.offerLetterUrl || "");

      // Populate candidate fields
      setPhone(currentRecord.personalProfile?.phone || "");
      setLocation(currentRecord.personalProfile?.location || "");
      setAddress(currentRecord.personalProfile?.address || "");
      setEmergencyContact(currentRecord.personalProfile?.emergencyContact || "");
      setDob(currentRecord.personalProfile?.dob || "");
      setSkillsText(currentRecord.personalProfile?.skills?.join(", ") || "");
      setAccountName(currentRecord.bankDetails?.accountName || "");
      setAccountNumber(currentRecord.bankDetails?.accountNumber || "");
      setIfscCode(currentRecord.bankDetails?.ifscCode || "");
      setBankName(currentRecord.bankDetails?.bankName || "");

      setIdentityUrl(currentRecord.documents?.identityProof?.url || "");
      setAddressUrl(currentRecord.documents?.addressProof?.url || "");
      setResumeUrl(currentRecord.documents?.resume?.url || "");
      setPhotoUrl(currentRecord.documents?.photo?.url || "");

      // Prefill AI generator values
      setGeneratorJobTitle(currentRecord.jobTitle || "");
      setGeneratorDept(currentRecord.department || "Engineering");
      setGeneratorDate(currentRecord.joiningDate || "");
      setOfferLetterPreviewText(currentRecord.welcomeLetter || "");
    }
  }, [currentRecord]);

  // Auto set select manager if senior managers load
  useEffect(() => {
    if (seniorManagers.length > 0) {
      const currentMgrId = currentRecord?.reportingManagerId || assignedManagerId;
      if (currentMgrId) {
        setConvertManagerId(currentMgrId);
        const mgr = seniorManagers.find(m => m._id === currentMgrId);
        if (mgr) {
          setConvertManager(mgr.name);
        }
      } else if (!convertManagerId) {
        setConvertManagerId(seniorManagers[0]._id);
        setConvertManager(seniorManagers[0].name);
      }
    }
  }, [seniorManagers, currentRecord, assignedManagerId, convertManagerId]);

  // Set default salary when convertBand changes
  useEffect(() => {
    const defaultSalaries = {
      L1: 30000,
      L2: 50000,
      L3: 80000,
      L4: 100000,
      L5: 120000,
      L6: 140000,
      L7: 160000
    };
    setConvertSalary(defaultSalaries[convertBand] || 80000);
  }, [convertBand]);

  // Start Onboarding for Selected Candidate
  const handleStartOnboarding = async (cand) => {
    try {
      const newId = `onb-${Date.now()}`;
      const payload = {
        id: newId,
        candidateId: cand.id,
        candidateName: cand.name,
        candidateEmail: cand.email,
        jobTitle: cand.jobTitle || "Software Engineer",
        status: "Pending",
        welcomeLetter: `Dear ${cand.name},\n\nWelcome to the team! We are absolutely thrilled to offer you the position of ${cand.jobTitle || "Software Engineer"}.\n\nYour background and expertise stood out during our rigorous AI-screening and video interview evaluations, and we are confident that your skillsets will be a tremendous asset to our growth.\n\nPlease complete the tasks in the smart checklist below to get set up with our systems before your first day.\n\nBest regards,\nHR Operations Team`,
        tasks: [
          { id: "t-offer", title: "Offer Letter Sent", description: "HR generates and sends offer letter.", type: "document", completed: false, dueDate: "2026-06-10" },
          { id: "t-accept", title: "Offer Letter Accepted", description: "Candidate accepts offer letter.", type: "document", completed: false, dueDate: "2026-06-12" },
          { id: "t-id", title: "Identity Proof Uploaded", description: "Candidate uploads Aadhaar/Passport/DL.", type: "document", completed: false, dueDate: "2026-06-11" },
          { id: "t-addr", title: "Address Proof Uploaded", description: "Candidate uploads Utility bill/Rent agreement.", type: "document", completed: false, dueDate: "2026-06-11" },
          { id: "t-res", title: "Resume Uploaded", description: "Candidate uploads final resume for records.", type: "document", completed: false, dueDate: "2026-06-11" },
          { id: "t-photo", title: "Passport Photo Uploaded", description: "Candidate uploads professional headshot.", type: "document", completed: false, dueDate: "2026-06-11" },
          { id: "t-bank", title: "Bank Details Submitted", description: "Direct deposit setup information completed.", type: "form", completed: false, dueDate: "2026-06-12" },
          { id: "t-profile", title: "Personal Profile Completed", description: "Verify contact phone and location coordinates.", type: "form", completed: false, dueDate: "2026-06-12" },
          { id: "t-verify", title: "Documents Verified", description: "Recruiter reviews and signs off files.", type: "task", completed: false, dueDate: "2026-06-14" },
          { id: "t-join", title: "Joining Date Assigned", description: "Confirm date and onboarding schedule details.", type: "meeting", completed: false, dueDate: "2026-06-15" }
        ]
      };

      await api.onboarding.create(payload);
      
      // Update Candidate status to "onboarding"
      await api.candidates.update(cand.id, { ...cand, status: "selected" });

      addHriseNotification(
        "Onboarding Initialized",
        `Onboarding workflow started for ${cand.name}.`,
        "onboarding",
        "recruiter"
      );

      await syncFromBackend();
      setSelectedOnboardingId(newId);
    } catch (e) {
      console.error("Failed to start onboarding:", e);
    }
  };

  // Recruiter: Send Offer Letter
  const handleSendOfferLetter = async () => {
    if (!currentRecord) return;
    try {
      const updated = {
        ...currentRecord,
        welcomeLetter: offerLetterPreviewText || currentRecord.welcomeLetter,
        offerLetterUrl: offerLetterUrl || "https://hrise-assets.s3.amazonaws.com/templates/offer_letter.pdf",
        offerLetterSentDate: new Date().toISOString().split("T")[0],
        offerLetterStatus: "Sent",
        status: "Offer Sent"
      };

      // Mark tasks complete
      updated.tasks = updated.tasks.map((t) => (t.id === "t-offer" ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      addHriseNotification("Offer Letter Sent", `Offer letter sent to ${currentRecord.candidateName}.`, "info", "recruiter");
      addHriseNotification("New Offer Letter", `You have received an offer letter! Please review and sign.`, "info", "candidate");

      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Recruiter: Assign Joining Date
  const handleAssignJoining = async () => {
    if (!currentRecord) return;
    if (!assignedManagerId) {
      alert("Please select a Reporting Senior Manager.");
      return;
    }
    try {
      const mgr = seniorManagers.find((m) => m._id === assignedManagerId);
      const updated = {
        ...currentRecord,
        joiningDate,
        joiningNotes,
        startDate: joiningDate,
        reportingManagerId: assignedManagerId,
        reportingManagerName: mgr ? mgr.name : ""
      };
      
      updated.tasks = updated.tasks.map((t) => (t.id === "t-join" ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      addHriseNotification("Joining Details Assigned", `Joining date set to ${joiningDate} and manager set to ${mgr ? mgr.name : ""}.`, "info", "recruiter");
      
      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Recruiter: Verify Document Status
  const handleVerifyDocument = async (docKey, status) => {
    if (!currentRecord) return;
    try {
      const notes = docNotes[docKey] || "";
      const updatedDocs = {
        ...currentRecord.documents,
        [docKey]: {
          ...currentRecord.documents[docKey],
          status,
          notes
        }
      };

      const updated = {
        ...currentRecord,
        documents: updatedDocs
      };

      // Recalculate tasks completion status
      const docsArr = ["identityProof", "addressProof", "resume", "photo"];
      const allApproved = docsArr.every((k) => updatedDocs[k]?.status === "Approved");
      
      // Update checkmark list tasks
      updated.tasks = updated.tasks.map((t) => {
        if (t.id === "t-verify") return { ...t, completed: allApproved };
        if (t.id === `t-${docKey === "identityProof" ? "id" : docKey === "addressProof" ? "addr" : docKey === "resume" ? "res" : "photo"}`) {
          return { ...t, completed: status === "Approved" };
        }
        return t;
      });

      // Recalculate record status
      const docPending = docsArr.some((k) => updatedDocs[k]?.status === "Pending" || updatedDocs[k]?.status === "Rejected");
      updated.status = docPending ? "Documents Pending" : "Verification Pending";

      await api.onboarding.update(currentRecord.id, updated);
      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Candidate: Accept Offer Letter
  const handleAcceptOffer = async () => {
    if (!currentRecord) return;
    try {
      const updated = {
        ...currentRecord,
        offerLetterAcceptedDate: new Date().toISOString().split("T")[0],
        offerLetterStatus: "Accepted"
      };

      updated.tasks = updated.tasks.map((t) => (t.id === "t-accept" ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      addHriseNotification("Offer Accepted", `${currentRecord.candidateName} accepted the offer letter!`, "onboarding", "recruiter");
      
      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Candidate: Upload Document
  const handleCandidateUpload = async (docKey, file) => {
    if (!currentRecord || !file) return;

    const saveDocumentUrl = async (uploadedUrl) => {
      const updatedDocs = {
        ...currentRecord.documents,
        [docKey]: {
          url: uploadedUrl,
          status: "Pending",
          notes: ""
        }
      };

      const updated = {
        ...currentRecord,
        documents: updatedDocs
      };

      // Set checklist task as completed (candidate has uploaded, recruiter still needs to verify)
      const taskMap = { identityProof: "t-id", addressProof: "t-addr", resume: "t-res", photo: "t-photo" };
      const taskId = taskMap[docKey];
      
      // Update checkmark list task
      updated.tasks = updated.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      await syncFromBackend();

      // Update local states
      if (docKey === "identityProof") setIdentityUrl(uploadedUrl);
      if (docKey === "addressProof") setAddressUrl(uploadedUrl);
      if (docKey === "resume") setResumeUrl(uploadedUrl);
      if (docKey === "photo") setPhotoUrl(uploadedUrl);
    };

    try {
      const formData = new FormData();
      formData.append("photo", file); // The server endpoint upload.single expects "photo"

      const token = localStorage.getItem("hrise_jwt_token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error("Cloudinary file upload failed.");
      }

      const result = await response.json();
      const uploadedUrl = result.url;
      await saveDocumentUrl(uploadedUrl);
    } catch (e) {
      console.warn("Server upload failed, falling back to local Base64 storage:", e);
      
      // Convert file to Base64 local storage fallback
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Url = reader.result;
          await saveDocumentUrl(base64Url);
        } catch (saveError) {
          console.error("Local upload fallback failed:", saveError);
          alert("Failed to save document: " + (saveError.message || saveError));
        }
      };
      reader.onerror = (readError) => {
        console.error("FileReader failed:", readError);
        alert("Failed to read document file: " + readError);
      };
      reader.readAsDataURL(file);
    }
  };

  // Candidate: Submit Personal Profile Details
  const handleCandidateProfile = async (e) => {
    e.preventDefault();
    if (!currentRecord) return;
    try {
      const updated = {
        ...currentRecord,
        personalProfile: {
          phone,
          location,
          address,
          emergencyContact,
          dob,
          skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
          isCompleted: true
        }
      };

      updated.tasks = updated.tasks.map((t) => (t.id === "t-profile" ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Candidate: Submit Bank Account Setup
  const handleCandidateBank = async (e) => {
    e.preventDefault();
    if (!currentRecord) return;
    try {
      const updated = {
        ...currentRecord,
        bankDetails: {
          accountName,
          accountNumber,
          ifscCode,
          bankName,
          isSubmitted: true
        }
      };

      updated.tasks = updated.tasks.map((t) => (t.id === "t-bank" ? { ...t, completed: true } : t));

      await api.onboarding.update(currentRecord.id, updated);
      await syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  // Recruiter: Generate AI Offer Letter
  const handleGenerateAIOffer = async () => {
    if (!currentRecord) return;
    try {
      setIsGeneratingOffer(true);
      const res = await api.onboarding.generateOffer({
        candidateName: currentRecord.candidateName,
        jobTitle: generatorJobTitle || currentRecord.jobTitle || "Software Engineer",
        department: generatorDept || "Engineering",
        salary: generatorSalary || "INR 8,00,000 per annum",
        joiningDate: generatorDate || new Date().toISOString().split("T")[0],
        companyName: generatorCompany || "HRise Technologies"
      });
      if (res && res.letter) {
        setOfferLetterPreviewText(res.letter);
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      alert("Offer letter generation failed. Please enter the parameters and try again.");
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  // Convert Candidate to Employee Wizard
  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    setConvertError("");
    setConvertSuccess("");

    if (!convertManager && !convertManagerId) {
      setConvertError("Please assign a reporting senior manager.");
      return;
    }

    try {
      const response = await api.onboarding.convert(currentRecord.id, {
        department: convertDept,
        designation: convertDesig,
        managerName: convertManager,
        reportingManagerId: convertManagerId,
        salaryBand: convertBand,
        salary: Number(convertSalary)
      });

      setConvertSuccess(response.message || "Successfully converted candidate to active employee!");
      addHriseNotification(
        "Employee Converted 🎉",
        `${currentRecord.candidateName} has been converted to Employee (${response.employeeId})!`,
        "onboarding",
        "recruiter"
      );

      // Delay modal close
      setTimeout(() => {
        setShowConvertModal(false);
        setConvertSuccess("");
      }, 2500);

      await syncFromBackend();
    } catch (err) {
      console.error(err);
      setConvertError(err.message || "Conversion failed on compliance check.");
    }
  };

  // Checklist Calculations
  const completedCount = useMemo(() => {
    if (!currentRecord) return 0;
    return currentRecord.tasks.filter((t) => t.completed).length;
  }, [currentRecord]);

  const totalCount = useMemo(() => {
    if (!currentRecord) return 0;
    return currentRecord.tasks.length;
  }, [currentRecord]);

  const completionPercent = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  // Analytics (Management Admin view)
  const analytics = useMemo(() => {
    const total = onboardings.length;
    const pending = onboardings.filter((o) => o.status === "Pending" || o.status === "In Progress" || o.status === "Documents Pending" || o.status === "Verification Pending").length;
    const completed = onboardings.filter((o) => o.status === "Completed" || o.status === "Converted To Employee").length;
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, completed, conversionRate };
  }, [onboardings]);

  // Filter visible records based on search query
  const filteredOnboardings = useMemo(() => {
    return onboardings.filter(
      (o) =>
        !searchQuery ||
        o.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [onboardings, searchQuery]);

  // Filter records by Manager's Department
  const managerIncomingHires = useMemo(() => {
    const dept = user?.department || "Engineering";
    return onboardings.filter(
      (o) => o.status !== "Converted To Employee" && o.tasks.some(t => t.id === "t-join") // simple check
    );
  }, [onboardings, user]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Onboarding" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header row */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <UserCheck size={18} />
              </span>
              Onboarding Workspace
            </h1>
            <p className="text-gray-500 mt-1">
              Smart candidate transition checklist, compliance document checker, and contract generators.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ──────────────────────────────────────────────────────── */}
              {/* 1. CANDIDATE PORTAL VIEW                                 */}
              {/* ──────────────────────────────────────────────────────── */}
              {role === "candidate" && (
                currentRecord ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Columns - Offer, Documents, Checklist */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Welcome Banner */}
                      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                            {completionPercent}%
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Welcome, {currentRecord.candidateName}!</h2>
                            <p className="text-xs text-indigo-200 mt-0.5">Let's complete your onboarding checklist before your first day.</p>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Card: Employment Offer Letter */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPanels({ ...expandedPanels, offer: !expandedPanels.offer })}
                          className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer text-left"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <FileText size={16} className="text-indigo-500" />
                            Employment Offer Letter
                          </h3>
                          {expandedPanels.offer ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {expandedPanels.offer && (
                          <div className="p-6 space-y-4">
                            {currentRecord.offerLetterStatus === "Pending" ? (
                              <div className="text-center py-6 text-xs text-gray-400">
                                <Clock className="mx-auto w-8 h-8 mb-2" />
                                Offer letter is being drafted by HR Operations. We will notify you once sent.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 font-medium whitespace-pre-line leading-relaxed font-mono">
                                  {currentRecord.welcomeLetter}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-50 pt-4">
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    Sent Date: {currentRecord.offerLetterSentDate || "TBD"}
                                  </span>
                                  {currentRecord.offerLetterStatus === "Sent" ? (
                                    <button
                                      onClick={handleAcceptOffer}
                                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                                    >
                                      Accept & Sign Offer
                                    </button>
                                  ) : (
                                    <span className="inline-flex px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl">
                                      Accepted on {currentRecord.offerLetterAcceptedDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Collapsible Card: Compliance Documents Upload */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPanels({ ...expandedPanels, docs: !expandedPanels.docs })}
                          className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer text-left"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <Upload size={16} className="text-indigo-500" />
                            Compliance Document Uploads
                          </h3>
                          {expandedPanels.docs ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {expandedPanels.docs && (
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {[
                                { key: "identityProof", label: "Identity Proof" },
                                { key: "addressProof", label: "Address Proof" },
                                { key: "resume", label: "Final Resume" },
                                { key: "photo", label: "Passport Photo" }
                              ].map((doc) => {
                                const dbDoc = currentRecord.documents?.[doc.key] || { status: "Pending", url: "" };
                                const isUploaded = !!dbDoc.url;
                                const displayStatus = isUploaded ? dbDoc.status : "Not Uploaded";
                                
                                let badgeStyle = "bg-gray-100 text-gray-600 border-gray-200";
                                if (isUploaded) {
                                  if (dbDoc.status === "Approved") badgeStyle = "bg-green-50 text-green-700 border-green-200";
                                  else if (dbDoc.status === "Rejected") badgeStyle = "bg-red-50 text-red-700 border-red-200";
                                  else badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
                                }

                                return (
                                  <div key={doc.key} className="bg-gray-50/50 border border-gray-150 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-700">{doc.label}</span>
                                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badgeStyle}`}>
                                        {displayStatus}
                                      </span>
                                    </div>
                                    {dbDoc.url ? (
                                      <div className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-lg gap-2">
                                        <span className="truncate text-gray-500 font-medium max-w-[150px]">
                                          {dbDoc.url.startsWith("data:") ? "Local File (Base64)" : dbDoc.url}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleViewDocument(dbDoc.url, doc.label)}
                                          className="text-indigo-600 font-bold hover:underline shrink-0 cursor-pointer border-none bg-transparent p-0 outline-none"
                                        >
                                          View
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-center border-2 border-dashed border-gray-250 rounded-xl p-4 bg-white hover:border-indigo-400 transition relative">
                                          <FileUp className="w-8 h-8 text-indigo-500 mb-1" />
                                          <span className="text-[10px] text-gray-400 font-semibold mb-2">Click to upload PDF or Image</span>
                                          <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={(e) => {
                                              if (e.target.files[0]) {
                                                handleCandidateUpload(doc.key, e.target.files[0]);
                                              }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {dbDoc.notes && (
                                      <p className="text-[10px] text-gray-400 italic mt-1 font-medium">Note: {dbDoc.notes}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Collapsible Card: Smart Checklist Progress */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPanels({ ...expandedPanels, checklist: !expandedPanels.checklist })}
                          className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer text-left"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <CheckCircle size={16} className="text-indigo-500" />
                            Smart Onboarding Checklist Progress
                          </h3>
                          {expandedPanels.checklist ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {expandedPanels.checklist && (
                          <div className="p-6 space-y-3">
                            <div className="space-y-2">
                              {currentRecord.tasks?.map((task) => (
                                <div key={task.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-semibold">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${
                                      task.completed ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-300 text-transparent"
                                    }`}>
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                    <div>
                                      <p className={`text-gray-800 ${task.completed ? "line-through text-gray-400 font-medium" : ""}`}>{task.title}</p>
                                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{task.description}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Due: {task.dueDate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right profile forms */}
                    <div className="space-y-6">
                      
                      {/* Personal profile form */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPanels({ ...expandedPanels, profile: !expandedPanels.profile })}
                          className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer text-left"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <User size={16} className="text-indigo-500" />
                            Personal Contact Details
                          </h3>
                          {expandedPanels.profile ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {expandedPanels.profile && (
                          <div className="p-6">
                            <form onSubmit={handleCandidateProfile} className="space-y-4 text-xs font-semibold text-gray-500">
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Mobile Phone</label>
                                <input
                                  type="text"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+91 99999 88888"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                  disabled={currentRecord.personalProfile?.isCompleted}
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">City/State coordinates</label>
                                <input
                                  type="text"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                  placeholder="Bangalore, India"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                  disabled={currentRecord.personalProfile?.isCompleted}
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Full Address</label>
                                <textarea
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  placeholder="123, Main Street, Area, City"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white h-16 resize-none"
                                  disabled={currentRecord.personalProfile?.isCompleted}
                                  required
                                />
                              </div>
                              <div className="space-y-1.5 flex gap-2">
                                <div className="flex-1 space-y-1.5">
                                  <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Emergency Contact</label>
                                  <input
                                    type="text"
                                    value={emergencyContact}
                                    onChange={(e) => setEmergencyContact(e.target.value)}
                                    placeholder="Name - Phone"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                    disabled={currentRecord.personalProfile?.isCompleted}
                                    required
                                  />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Date of Birth</label>
                                  <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white font-semibold"
                                    disabled={currentRecord.personalProfile?.isCompleted}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Key Skills (comma separated)</label>
                                <input
                                  type="text"
                                  value={skillsText}
                                  onChange={(e) => setSkillsText(e.target.value)}
                                  placeholder="React, Python, Docker"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                  disabled={currentRecord.personalProfile?.isCompleted}
                                  required
                                />
                              </div>
                              {!currentRecord.personalProfile?.isCompleted && (
                                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition cursor-pointer">
                                  Submit Profile Details
                                </button>
                              )}
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Collapsible Card: Bank Details Setup */}
                      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPanels({ ...expandedPanels, bank: !expandedPanels.bank })}
                          className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer text-left"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <CreditCard size={16} className="text-indigo-500" />
                            Bank Account Setup
                          </h3>
                          {expandedPanels.bank ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </button>
                        {expandedPanels.bank && (
                          <div className="p-6">
                            <form onSubmit={handleCandidateBank} className="space-y-4 text-xs font-semibold text-gray-500">
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Account Beneficiary Name</label>
                                <input
                                  type="text"
                                  value={accountName}
                                  onChange={(e) => setAccountName(e.target.value)}
                                  placeholder="Name as in passbook"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                  disabled={currentRecord.bankDetails?.isSubmitted}
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Account Number</label>
                                <input
                                  type="text"
                                  value={accountNumber}
                                  onChange={(e) => setAccountNumber(e.target.value)}
                                  placeholder="Direct deposit account number"
                                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                  disabled={currentRecord.bankDetails?.isSubmitted}
                                  required
                                />
                              </div>
                              <div className="space-y-1.5 flex gap-2">
                                <div className="flex-1 space-y-1.5">
                                  <label className="block text-gray-400 uppercase tracking-widest text-[9px]">IFSC Code</label>
                                  <input
                                    type="text"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value)}
                                    placeholder="IFSC"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                    disabled={currentRecord.bankDetails?.isSubmitted}
                                    required
                                  />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Bank Name</label>
                                  <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="Bank"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 bg-white"
                                    disabled={currentRecord.bankDetails?.isSubmitted}
                                    required
                                  />
                                </div>
                              </div>
                              {!currentRecord.bankDetails?.isSubmitted && (
                                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition cursor-pointer">
                                  Submit Account Details
                                </button>
                              )}
                            </form>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xl">
                    <Clock size={40} className="text-indigo-500 mx-auto mb-4" />
                    <h3 className="font-extrabold text-gray-900 text-lg">Onboarding Not Started</h3>
                    <p className="text-gray-500 text-xs mt-2">Your recruiter has not initialized the onboarding setup checklist. Please coordinate with the hiring team.</p>
                  </div>
                )
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* 2. RECRUITER WORKSPACE VIEW                              */}
              {/* ──────────────────────────────────────────────────────── */}
              {role === "recruiter" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left list of onboardings & start new onboarding */}
                  <div className="space-y-6">
                    
                    {/* Active Candidate Onboardings */}
                    <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Onboardings ({filteredOnboardings.length})</p>
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {filteredOnboardings.map((rec) => {
                          const active = currentRecord?.id === rec.id;
                          return (
                            <button
                              key={rec.id}
                              onClick={() => setSelectedOnboardingId(rec.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left cursor-pointer ${
                                active ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"
                              }`}
                            >
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0">
                                {rec.candidateName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-xs truncate">{rec.candidateName}</h4>
                                <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{rec.jobTitle}</p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600">{rec.status}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected candidates ready to onboard */}
                    <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hired Candidates ({selectedCandidatesNoOnboard.length})</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Candidates who passed interviews and are selected for offer:</p>
                      <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                        {selectedCandidatesNoOnboard.length === 0 ? (
                          <p className="text-[10px] text-gray-400 text-center py-4">All selected candidates onboarded.</p>
                        ) : (
                          selectedCandidatesNoOnboard.map((cand) => (
                            <div key={cand.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-xs truncate">{cand.name}</p>
                                <p className="text-[9px] text-gray-400 font-semibold truncate">{cand.jobTitle || "Custom Job"}</p>
                              </div>
                              <button
                                onClick={() => handleStartOnboarding(cand)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-lg shrink-0 cursor-pointer"
                              >
                                Start Onboarding
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Details Checklist and Verification panels */}
                  <div className="lg:col-span-2 space-y-6">
                    {currentRecord ? (
                      <>
                        {/* Title and details */}
                        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center shadow-inner">
                                {currentRecord.candidateName.charAt(0)}
                              </div>
                              <div>
                                <h2 className="font-black text-gray-900 text-base">{currentRecord.candidateName}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{currentRecord.jobTitle} • {currentRecord.candidateEmail}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl">
                              Status: {currentRecord.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-gray-500">
                            
                            {/* Offer Letter Panel */}
                            {/* Offer Letter Panel */}
                            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl space-y-3">
                              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-[9px] flex items-center gap-1">
                                <Sparkles size={12} className="text-indigo-500" />
                                AI Offer Letter Generator
                              </h4>
                              
                              {currentRecord.offerLetterStatus === "Pending" ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="space-y-1">
                                      <label className="text-gray-400">Job Title</label>
                                      <input
                                        type="text"
                                        value={generatorJobTitle}
                                        onChange={(e) => setGeneratorJobTitle(e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 outline-none text-gray-800 font-semibold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-gray-400">Department</label>
                                      <select
                                        value={generatorDept}
                                        onChange={(e) => setGeneratorDept(e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 outline-none text-gray-800 font-semibold cursor-pointer"
                                      >
                                        <option value="Engineering">Engineering</option>
                                        <option value="HR">HR</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Design">Design</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Operations">Operations</option>
                                      </select>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="space-y-1">
                                      <label className="text-gray-400">Salary Band/Compensation</label>
                                      <input
                                        type="text"
                                        value={generatorSalary}
                                        onChange={(e) => setGeneratorSalary(e.target.value)}
                                        placeholder="e.g. INR 12,00,000 PA"
                                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 outline-none text-gray-800 font-semibold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-gray-400">Company Name</label>
                                      <input
                                        type="text"
                                        value={generatorCompany}
                                        onChange={(e) => setGeneratorCompany(e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 outline-none text-gray-800 font-semibold"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-[10px]">
                                    <label className="text-gray-400">Target Joining Date</label>
                                    <input
                                      type="date"
                                      value={generatorDate}
                                      onChange={(e) => setGeneratorDate(e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 outline-none text-gray-800 font-semibold"
                                    />
                                  </div>

                                  <button
                                    onClick={handleGenerateAIOffer}
                                    disabled={isGeneratingOffer}
                                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition cursor-pointer text-center text-[10px] flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    <Sparkles size={11} /> {isGeneratingOffer ? "Generating with AI..." : "Generate AI Offer Letter"}
                                  </button>

                                  {offerLetterPreviewText && (
                                    <div className="space-y-2 border-t border-gray-150 pt-3">
                                      <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Letter Preview & Edit</label>
                                      <textarea
                                        value={offerLetterPreviewText}
                                        onChange={(e) => setOfferLetterPreviewText(e.target.value)}
                                        rows={6}
                                        className="w-full p-2.5 bg-white rounded-lg border border-gray-200 text-gray-800 font-medium outline-none text-[10px] leading-relaxed resize-y font-mono"
                                      />
                                      <button
                                        onClick={handleSendOfferLetter}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer text-[10px]"
                                      >
                                        Approve & Send Offer Letter
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 bg-white border border-gray-150 rounded-xl space-y-2 text-[10px] font-semibold text-gray-500">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Offer Status:</span>
                                    <span className="font-black text-indigo-600">{currentRecord.offerLetterStatus}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Sent Date:</span>
                                    <span className="text-gray-800">{currentRecord.offerLetterSentDate}</span>
                                  </div>
                                  {currentRecord.offerLetterAcceptedDate && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400">Accepted Date:</span>
                                      <span className="text-gray-800">{currentRecord.offerLetterAcceptedDate}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-gray-100 pt-2 mt-2">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Sent Letter Content</p>
                                    <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-100 font-medium text-gray-600 text-[10px] whitespace-pre-line leading-relaxed font-mono">
                                      {currentRecord.welcomeLetter}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Joining Management Panel */}
                            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl space-y-3">
                              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-[9px]">Joining & Shift Schedule</h4>
                              <div className="space-y-2">
                                <label className="block text-[10px] text-gray-400">Assign Joining Date</label>
                                <input
                                  type="date"
                                  value={joiningDate}
                                  onChange={(e) => setJoiningDate(e.target.value)}
                                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none text-gray-800 font-semibold"
                                />
                                <label className="block text-[10px] text-gray-400">Reporting Senior Manager</label>
                                <select
                                  value={assignedManagerId}
                                  onChange={(e) => setAssignedManagerId(e.target.value)}
                                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 outline-none text-gray-800 font-semibold cursor-pointer"
                                >
                                  <option value="">-- Select Senior Manager --</option>
                                  {seniorManagers.map((mgr) => (
                                    <option key={mgr._id} value={mgr._id}>
                                      {mgr.name} ({mgr.email})
                                    </option>
                                  ))}
                                </select>
                                <label className="block text-[10px] text-gray-400">Joining Notes/Coordination</label>
                                <textarea
                                  value={joiningNotes}
                                  onChange={(e) => setJoiningNotes(e.target.value)}
                                  placeholder="Workplace instructions, hardware collection syncs"
                                  className="w-full px-3 py-1.5 bg-white rounded-xl border border-gray-200 outline-none text-gray-800 h-12 resize-none"
                                />
                                <button
                                  onClick={handleAssignJoining}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
                                >
                                  Update Joining & Manager Details
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Document Verification Checker */}
                        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-50 pb-3 flex items-center gap-1.5">
                            <Shield size={16} className="text-indigo-500" />
                            Document verification & validation checker
                          </h3>
                          <div className="space-y-4 text-xs font-semibold text-gray-500">
                            {[
                              { key: "identityProof", label: "Identity Verification Document" },
                              { key: "addressProof", label: "Address Verification Document" },
                              { key: "resume", label: "Signed Final Resume Record" },
                              { key: "photo", label: "Passport Headshot Portrait" }
                            ].map((doc) => {
                              const dbDoc = currentRecord.documents?.[doc.key] || { status: "Pending", url: "", notes: "" };
                              const isUploaded = !!dbDoc.url;
                              const displayStatus = isUploaded ? dbDoc.status : "Not Uploaded";
                              
                              let statusStyle = "bg-gray-100 text-gray-600 border-gray-200";
                              if (isUploaded) {
                                if (dbDoc.status === "Approved") statusStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                else if (dbDoc.status === "Rejected") statusStyle = "bg-rose-50 text-rose-800 border-rose-200";
                                else statusStyle = "bg-amber-50 text-amber-800 border-amber-200";
                              }

                              return (
                                <div key={doc.key} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-xl gap-4">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-800">{doc.label}</span>
                                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase ${statusStyle}`}>
                                        {displayStatus}
                                      </span>
                                    </div>
                                    {dbDoc.url ? (
                                      <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-1 rounded border border-gray-150 w-max max-w-full">
                                        <FileBadge size={14} className="text-indigo-500 shrink-0" />
                                        <button
                                          type="button"
                                          onClick={() => handleViewDocument(dbDoc.url, doc.label)}
                                          className="text-indigo-600 truncate max-w-[200px] hover:underline font-bold text-[10px] cursor-pointer border-none bg-transparent p-0 outline-none text-left"
                                        >
                                          {dbDoc.url.startsWith("data:") ? "Local File (Base64)" : dbDoc.url}
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-gray-400 italic mt-1 font-medium">Candidate has not uploaded yet.</p>
                                    )}
                                    {dbDoc.notes && (
                                      <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Comment: {dbDoc.notes}</p>
                                    )}
                                  </div>

                                  {dbDoc.url && dbDoc.status !== "Approved" && (
                                    <div className="space-y-2 w-full md:w-60">
                                      <input
                                        type="text"
                                        value={docNotes[doc.key] || ""}
                                        onChange={(e) => setDocNotes({ ...docNotes, [doc.key]: e.target.value })}
                                        placeholder="Add rejection reason or verification note..."
                                        className="w-full px-3 py-1.5 bg-white rounded-xl border border-gray-200 outline-none text-[11px] text-gray-800 font-semibold"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleVerifyDocument(doc.key, "Approved")}
                                          className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleVerifyDocument(doc.key, "Rejected")}
                                          className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conversion checklist verify & trigger button */}
                        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-50 pb-3">Conversion and Employee Activation</h3>
                          
                          {/* Compliance conditions checks list */}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-bold">
                            {[
                              { label: "Offer Accepted", val: currentRecord.offerLetterStatus === "Accepted" },
                              { label: "Documents Approved", val: ["identityProof", "addressProof", "resume", "photo"].every((k) => currentRecord.documents?.[k]?.status === "Approved") },
                              { label: "Profile Completed", val: currentRecord.personalProfile?.isCompleted || (currentRecord.personalProfile?.phone && currentRecord.personalProfile?.location) },
                              { label: "Bank Submitted", val: currentRecord.bankDetails?.isSubmitted },
                              { label: "Joining Date Set", val: !!currentRecord.joiningDate },
                              { label: "Manager Assigned", val: !!currentRecord.reportingManagerId }
                            ].map((cond) => (
                              <div key={cond.label} className={`flex items-center gap-1 bg-gray-50 border p-2 rounded-xl justify-between ${cond.val ? "border-emerald-200 bg-emerald-50/50 text-emerald-800" : "border-red-200 bg-red-50/40 text-red-800"}`}>
                                <span>{cond.label}</span>
                                {cond.val ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              </div>
                            ))}
                          </div>

                          {currentRecord.status === "Converted To Employee" ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl flex items-center gap-3">
                              <PartyPopper size={22} className="text-emerald-600" />
                              <div>
                                <p className="text-sm">Conversion Complete!</p>
                                <p className="text-xs font-semibold mt-0.5">Candidate converted to Employee. Onboarding status successfully finalized.</p>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConvertError("");
                                setConvertSuccess("");
                                setShowConvertModal(true);
                              }}
                              disabled={
                                !(
                                  currentRecord.offerLetterStatus === "Accepted" &&
                                  ["identityProof", "addressProof", "resume", "photo"].every((k) => currentRecord.documents?.[k]?.status === "Approved") &&
                                  (currentRecord.personalProfile?.isCompleted || (currentRecord.personalProfile?.phone && currentRecord.personalProfile?.location)) &&
                                  currentRecord.bankDetails?.isSubmitted &&
                                  currentRecord.joiningDate &&
                                  currentRecord.reportingManagerId
                                )
                              }
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
                            >
                              <UserPlus size={16} /> Convert to Active Employee
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center shadow-xl">
                        <Inbox size={32} className="text-gray-300 mx-auto mb-3" />
                        <h3 className="font-extrabold text-gray-900 text-sm">No Candidate Selected</h3>
                        <p className="text-gray-400 text-xs mt-1">Please select an onboarding record from the sidebar or click "Start Onboarding" to begin a journey.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* 3. MANAGEMENT ADMIN VIEW                                 */}
              {/* ──────────────────────────────────────────────────────── */}
              {role === "management_admin" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Onboarding Analytics */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Total Onboarded", value: analytics.total, icon: <Users size={18} />, color: "from-indigo-500 to-purple-600" },
                      { label: "In Onboarding", value: analytics.pending, icon: <Clock size={18} />, color: "from-amber-500 to-yellow-500" },
                      { label: "Converted to Employee", value: analytics.completed, icon: <CheckCircle size={18} />, color: "from-emerald-500 to-teal-600" },
                      { label: "Conversion Rate", value: `${analytics.conversionRate}%`, icon: <TrendingUp size={18} />, color: "from-pink-500 to-purple-600" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Dashboard Table */}
                  <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-900 text-sm">All Onboarding Records Summary</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-3.5">Candidate</th>
                            <th className="px-6 py-3.5">Position</th>
                            <th className="px-6 py-3.5">Offer Status</th>
                            <th className="px-6 py-3.5">Checks Progress</th>
                            <th className="px-6 py-3.5">Joining Date</th>
                            <th className="px-6 py-3.5">Onboarding Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700 font-semibold">
                          {onboardings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">No onboarding pipelines initiated.</td>
                            </tr>
                          ) : (
                            onboardings.map((rec) => {
                              const done = rec.tasks.filter((t) => t.completed).length;
                              const total = rec.tasks.length;
                              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                              
                              let statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
                              if (rec.status === "Converted To Employee") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";

                              return (
                                <tr key={rec.id} className="hover:bg-gray-50/50 transition">
                                  <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shadow-inner">
                                      {rec.candidateName.charAt(0)}
                                    </div>
                                    {rec.candidateName}
                                  </td>
                                  <td className="px-6 py-3.5 text-gray-500 font-medium">{rec.jobTitle}</td>
                                  <td className="px-6 py-3.5">{rec.offerLetterStatus}</td>
                                  <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-indigo-600">{pct}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-1">
                                        <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3.5 text-gray-500 font-medium">{rec.joiningDate || "TBD"}</td>
                                  <td className="px-6 py-3.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${statusBadge}`}>
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* 4. SENIOR MANAGER PORTAL VIEW                             */}
              {/* ──────────────────────────────────────────────────────── */}
              {role === "senior_manager" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Incoming Team Roster */}
                  <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm">Incoming Department Team Members</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Monitor progress and expected joining dates of upcoming team additions</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-3.5">Candidate Name</th>
                            <th className="px-6 py-3.5">Assigned Position</th>
                            <th className="px-6 py-3.5">Checklist Completed</th>
                            <th className="px-6 py-3.5">Confirmed Join Date</th>
                            <th className="px-6 py-3.5">Notes</th>
                            <th className="px-6 py-3.5">Onboarding Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700 font-semibold">
                          {managerIncomingHires.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">No incoming department members expected currently.</td>
                            </tr>
                          ) : (
                            managerIncomingHires.map((rec) => {
                              const done = rec.tasks.filter((t) => t.completed).length;
                              const total = rec.tasks.length;
                              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                              return (
                                <tr key={rec.id} className="hover:bg-gray-50/50 transition">
                                  <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">
                                      {rec.candidateName.charAt(0)}
                                    </div>
                                    {rec.candidateName}
                                  </td>
                                  <td className="px-6 py-3.5 text-gray-500 font-medium">{rec.jobTitle}</td>
                                  <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-indigo-600">{pct}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-1">
                                        <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3.5 text-gray-500 font-medium">{rec.joiningDate || "TBD"}</td>
                                  <td className="px-6 py-3.5 text-gray-550 max-w-[200px] truncate">{rec.joiningNotes || "No notes"}</td>
                                  <td className="px-6 py-3.5">
                                    <span className="inline-flex px-2 py-0.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* Conversion Confirmation Modal */}
              {showConvertModal && currentRecord && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConvertModal(false)} />
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative z-10 space-y-6 animate-scale-in">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Activate Employee Status</h2>
                        <p className="text-xs text-gray-400">Final conversions setup for {currentRecord.candidateName}</p>
                      </div>
                      <button
                        onClick={() => setShowConvertModal(false)}
                        className="p-1.5 hover:bg-gray-150 rounded-xl text-gray-400 hover:text-gray-600 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {convertError && (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <AlertCircle size={14} /> {convertError}
                      </div>
                    )}
                    {convertSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle size={14} /> {convertSuccess}
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleConversionSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
                      
                      {/* Department Select */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Assign Department</label>
                        <select
                          value={convertDept}
                          onChange={(e) => setConvertDept(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-800 appearance-none cursor-pointer"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="HR">HR</option>
                          <option value="Sales">Sales</option>
                          <option value="Design">Design</option>
                          <option value="Finance">Finance</option>
                          <option value="Operations">Operations</option>
                          <option value="Legal">Legal</option>
                          <option value="Analytics">Analytics</option>
                        </select>
                      </div>

                      {/* Designation */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Assign Designation</label>
                        <input
                          type="text"
                          value={convertDesig}
                          onChange={(e) => setConvertDesig(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 font-semibold"
                        />
                      </div>

                      {/* Reporting Senior Manager */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Reporting Senior Manager</label>
                        <select
                          value={convertManagerId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvertManagerId(val);
                            const mgr = seniorManagers.find(m => m._id === val);
                            if (mgr) {
                              setConvertManager(mgr.name);
                            }
                          }}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-800 appearance-none cursor-pointer text-xs font-semibold"
                        >
                          <option value="">-- Select Senior Manager --</option>
                          {seniorManagers.map((mgr) => (
                            <option key={mgr._id} value={mgr._id}>
                              {mgr.name} ({mgr.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Salary Band */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Salary Grade Band</label>
                        <select
                          value={convertBand}
                          onChange={(e) => setConvertBand(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none bg-white text-gray-800 appearance-none cursor-pointer"
                        >
                          <option value="L1">L1 (Intern)</option>
                          <option value="L2">L2 (Junior)</option>
                          <option value="L3">L3 (Associate)</option>
                          <option value="L4">L4 (Mid-level)</option>
                          <option value="L5">L5 (Senior)</option>
                          <option value="L6">L6 (Lead)</option>
                          <option value="L7">L7 (Manager)</option>
                        </select>
                      </div>

                      {/* Numeric Salary Input */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Salary (Base Monthly, INR)</label>
                        <input
                          type="number"
                          value={convertSalary}
                          onChange={(e) => setConvertSalary(Number(e.target.value))}
                          required
                          min="0"
                          placeholder="e.g. 80000"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-800 font-semibold"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button
                          type="button"
                          onClick={() => setShowConvertModal(false)}
                          className="py-2.5 px-4 bg-gray-100 hover:bg-gray-150 text-gray-650 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
                        >
                          Confirm Conversion
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

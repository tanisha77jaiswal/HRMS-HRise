import mongoose from "mongoose";

const OnboardingRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  candidateId: { type: String },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, lowercase: true, trim: true },
  jobTitle: { type: String },
  startDate: { type: String },
  status: { 
    type: String, 
    enum: ["Selected", "Onboarding Started", "Offer Sent", "Offer Accepted", "Documents Pending", "Verification Pending", "Ready For Conversion", "Converted To Employee", "Pending", "In Progress", "Completed"],
    default: "Selected" 
  },
  welcomeLetter: { type: String },
  
  // Offer Letter
  offerLetterUrl: { type: String, default: "" },
  offerLetterSentDate: { type: String, default: "" },
  offerLetterAcceptedDate: { type: String, default: "" },
  offerLetterStatus: { 
    type: String, 
    enum: ["Pending", "Sent", "Accepted"], 
    default: "Pending" 
  },
  
  // Documents Management
  documents: {
    identityProof: {
      url: { type: String, default: "" },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      notes: { type: String, default: "" }
    },
    addressProof: {
      url: { type: String, default: "" },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      notes: { type: String, default: "" }
    },
    resume: {
      url: { type: String, default: "" },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      notes: { type: String, default: "" }
    },
    photo: {
      url: { type: String, default: "" },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      notes: { type: String, default: "" }
    }
  },
  
  // Personal Profile
  personalProfile: {
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    dob: { type: String, default: "" },
    skills: [String],
    isCompleted: { type: Boolean, default: false }
  },
  
  // Bank Details
  bankDetails: {
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" },
    isSubmitted: { type: Boolean, default: false }
  },
  
  // Joining Management
  joiningDate: { type: String, default: "" },
  joiningNotes: { type: String, default: "" },
  reportingManagerId: { type: String, default: "" },
  reportingManagerName: { type: String, default: "" },

  // Conversion Record
  convertedDate: { type: String, default: "" },
  
  // Sub-tasks Checklist
  tasks: [
    { 
      id: String, 
      title: String, 
      description: String,
      type: { type: String, enum: ["document", "form", "task", "meeting"] },
      completed: { type: Boolean, default: false },
      dueDate: String
    }
  ]
});

export const OnboardingRecord = mongoose.model("OnboardingRecord", OnboardingRecordSchema);

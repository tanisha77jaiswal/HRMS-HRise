import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { upload, cloudinary } from "./config/cloudinary.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import candidateProfileRoutes from "./routes/candidateProfileRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import employeeDashboardRoutes from "./routes/employeeDashboardRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
// Force port 5000 locally
const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT || 5000) : 5000;

// Enable CORS - strictly restrict to port 5173 locally
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim().replace(/\/$/, ""))
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Connect to Database
connectDB();

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/candidate-profiles", candidateProfileRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/employee-dashboard", employeeDashboardRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/notifications", notificationRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "HRise Modular MVC API Server is active."
  });
});

// Photo Upload Relay Endpoint
app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "hrise_profile_photos", resource_type: "auto" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary failed:", error);
    res.status(500).json({ error: error.message || "Photo upload failed." });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log("🚀 Express MERN API (MVC Pattern) Server listening on http://localhost:" + PORT);
});

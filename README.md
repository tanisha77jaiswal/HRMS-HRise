<div align="center">
  <img src="https://img.shields.io/badge/HRise-AI%20HRMS-4f46e5?style=for-the-badge&logo=react&logoColor=white" alt="HRise Logo" />
  <h1>🚀 HRise</h1>
  <p><strong>Next-Generation, AI-Powered Human Resource Management System</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=flat-square" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=googlebard&logoColor=white" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python ML" />
  </p>
</div>

---

## 🌟 The Pitch
Traditional HR systems are reactive, clunky, and manual. **HRise** is a proactive, AI-native platform designed to automate the entire employee lifecycle—from intelligent candidate screening to performance reviews, payroll, and retention prediction. Built for modern enterprises, it empowers HR teams to make data-driven decisions while providing a frictionless experience for employees.

## 🔥 Killer Features (Hackathon Highlights)

### 🧠 1. AI-Powered Resume Screening
Stop manually reading hundreds of PDFs. HRise integrates directly with **Google Gemini AI** to bulk-analyze applicant resumes, instantly extracting skills, experience, and scoring them against active job descriptions.

### 🔮 2. Machine Learning Hiring Predictions
Includes an independent Python Flask microservice (`ml-service`) powered by `scikit-learn`. Our proprietary ML model predicts a candidate's likelihood of long-term success and cultural fit based on historical hiring datasets.

### 🔐 3. Enterprise-Grade Security Architecture
- **5-Tier Role-Based Access Control (RBAC):** Distinct portals for *Management Admin*, *Recruiter*, *Senior Manager*, *Employee*, and *Candidate*.
- **Silent JWT Token Rotation:** Implements a highly secure, background refresh token architecture (15-minute access tokens / 7-day refresh tokens) eliminating random logouts without sacrificing security.

### 🏢 4. Comprehensive Employee Lifecycle Management
- **Performance & Appraisals:** Dynamic review cycles mapping manager feedback to employee dashboards.
- **Leave & Attendance:** Real-time leave balance calculations, manager approval workflows, and check-in/check-out tracking.
- **Automated Payroll:** One-click payroll runs generating structured payslips with dynamic CTC calculations.

---

## 🛠️ Technical Architecture

HRise utilizes a decoupled microservices-inspired architecture:

- **Frontend (`/client`):** React + Vite + TailwindCSS. Utilizes a custom highly-optimized fetch API interceptor for background token rotation.
- **Core API (`/backend`):** Node.js + Express + MongoDB. MVC pattern handling auth, business logic, and Gemini AI integration.
- **Prediction Engine (`/ml-service`):** Python + Flask + Scikit-Learn. Serves REST endpoints for predictive hiring modeling.

---

## 🚀 Getting Started (Run it Locally)

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB connection string
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/tanisha77jais/hrms-HRise.git
cd hrms-HRise
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 3. Start the Backend API
```bash
cd backend
npm install
npm run dev
```

### 4. Start the Frontend Application
```bash
cd client
npm install
npm run dev
```

### 5. Start the ML Python Service
```bash
cd ml-service
pip install -r requirements.txt
python api/app.py
```

---

## 🎨 UI / UX Philosophy
We built HRise to feel like a consumer product. Instead of gray grids, we utilized modern design tokens, soft shadows, glassmorphism elements, and micro-animations to ensure HR professionals actually *enjoy* using their tools.

<br/>

<div align="center">
  <i>Built with ❤️ and excessive amounts of coffee.</i>
</div>

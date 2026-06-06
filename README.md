<div align="center">
<img src="https://img.shields.io/badge/MERN-Stack-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/AI--Powered-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/ML-Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
<img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />



⚡ HRise
Where AI Meets Human Resources
A full-stack, AI-powered HRMS & Recruitment Management Platform built on the MERN Stack — managing the complete employee lifecycle from recruitment to payroll, performance, and beyond.
<br />
![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-hrise--app.vercel.app-brightgreen?style=for-the-badge)
<br />
---
</div>
📌 What is HRise?
HRise is a modern, intelligent Human Resource Management System that eliminates the friction from HR workflows. It combines traditional workforce management with the power of Google Gemini AI and a Python ML microservice to automate hiring decisions, performance reviews, and team operations — all under one roof.
The platform serves 5 distinct user roles through dedicated portals, each with tailored dashboards and capabilities, secured by JWT + Refresh Token authentication.
<br />
---
🏆 Hackathon Highlights
Category	Details
🧱 Architecture	Full-stack MERN + Python ML Microservice
🔐 Auth	JWT + Refresh Token (Secure, Stateless)
🤖 AI Integration	Google Gemini AI + Scikit-Learn Predictions
👥 Role System	5-Tier Role-Based Access Control
☁️ Deployment	Production-ready on Vercel + Cloudinary
📦 Modules	Recruitment · Payroll · Attendance · Leave · Performance
<br />
---
🤖 AI & ML Features
> HRise doesn't just manage HR — it makes it **smarter**.
🧠 AI Resume Screening
Powered by Google Gemini AI, the platform automatically parses uploaded resumes to extract skills, experience, qualifications, and key strengths — cutting recruiter screening time dramatically.
🎯 AI Candidate Matching
Compares candidate profiles against job requirements and generates compatibility insights, helping hiring teams make faster, data-driven decisions.
📊 AI Performance Review Assistance
During review cycles, managers receive AI-generated summaries of employee strengths, weaknesses, growth areas, and performance trends — reducing subjectivity and bias.
🔮 ML Hiring Prediction Engine
A dedicated Python + Flask microservice uses historical hiring and evaluation data to predict candidate suitability before interviews even begin.
```
Tech: Python · Flask · Scikit-Learn
```
<br />
---
✨ Core Feature Modules
<details>
<summary><b>🧑‍💼 Recruitment Management</b></summary>
Job Posting & Management
Candidate Application Tracking
AI-Powered Resume Screening
Interview Scheduling
End-to-End Hiring Workflow
</details>
<details>
<summary><b>👥 Employee Management</b></summary>
Employee Directory & Profiles
Reporting Hierarchy Visualization
Department Management
Workforce Overview Dashboard
</details>
<details>
<summary><b>📅 Attendance Management</b></summary>
Employee Check-In / Check-Out
Real-Time Status Monitoring
Attendance Analytics & Review Dashboard
</details>
<details>
<summary><b>🌴 Leave Management</b></summary>
Leave Application & Approval Workflow
Medical, Casual & Earned Leave Tracking
Leave Balance Management
</details>
<details>
<summary><b>💰 Payroll Management</b></summary>
Payroll Records & Salary Tracking
Earnings & Deductions Breakdown
Complete Payment History
</details>
<details>
<summary><b>📈 Performance Management</b></summary>
Performance Reviews & Ratings
Employee Feedback System
Review History & Team Analytics
</details>
<br />
---
👥 User Roles & Access Control
```
┌─────────────────────────────────────────────────────────────┐
│                     HRise Access Matrix                     │
├──────────────────┬──────────────────────────────────────────┤
│  Management Admin│ Full system access · Analytics · Payroll │
│  Recruiter       │ Job postings · Candidates · Interviews   │
│  Senior Manager  │ Team mgmt · Attendance · Leave · Reviews │
│  Employee        │ Check-in · Leave · Payroll · Reviews     │
│  Candidate       │ Browse jobs · Apply · Track status       │
└──────────────────┴──────────────────────────────────────────┘
```
<br />
---
🛠️ Tech Stack
Frontend
![React](https://img.shields.io/badge/React.js-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)
Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
Database
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white)
AI & ML
![Gemini](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
Cloud & DevOps
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
<br />
---
🏗️ System Architecture
```
                        ┌─────────────────────┐
                        │   React Frontend     │
                        │  (Vite + Tailwind)   │
                        └──────────┬──────────┘
                                   │ REST API
                        ┌──────────▼──────────┐
                        │  Express.js Backend  │
                        │  JWT Auth + RBAC     │
                        └──────┬───────┬───────┘
                               │       │
              ┌────────────────▼─┐   ┌─▼──────────────────┐
              │    MongoDB Atlas  │   │  Python ML Service  │
              │   (Mongoose ODM)  │   │  Flask + Scikit-    │
              │                   │   │  Learn Predictions  │
              └───────────────────┘   └────────────────────┘
                                              │
                               ┌──────────────▼──────────────┐
                               │       Google Gemini AI       │
                               │  Resume · Matching · Reviews │
                               └─────────────────────────────┘
```
<br />
---
🚀 Getting Started
Prerequisites
Node.js v18+
Python 3.9+
MongoDB URI
Google Gemini API Key
1. Clone the Repository
```bash
git clone https://github.com/your-username/HRise-HRMS.git
cd HRise-HRMS
```
2. Backend Setup
```bash
cd backend
npm install
# Add your .env with MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```
3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
4. ML Service Setup
```bash
cd ml-service
pip install -r requirements.txt
python api/app.py
```
<br />
---
🔮 Roadmap
[ ] AI-powered Employee Retention Prediction
[ ] Automated Email Notifications
[ ] Mobile Application (React Native)
[ ] Advanced Workforce Analytics Dashboard
[ ] Resume Parsing Automation Pipeline
<br />
---
👩‍💻 About the Author
<div align="center">
Tanisha Jaiswal
B.Tech Computer Science Engineering · Lovely Professional University
Built with passion using MERN Stack, Google Gemini AI, and Machine Learning.
![Live Demo](https://img.shields.io/badge/🚀%20Try%20It%20Live-hrise--app.vercel.app-blue?style=for-the-badge)
</div>

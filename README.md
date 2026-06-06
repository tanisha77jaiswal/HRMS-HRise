# 🚀 HRise – AI-Powered Human Resource Management System

<div align="center">

### Modern HRMS & Recruitment Platform Built with MERN, AI, and Machine Learning

Manage the complete employee lifecycle — from hiring and onboarding to attendance, payroll, leave management, and performance evaluation — through a unified AI-powered platform.

**🌐 Live Application:** https://hrise-app.vercel.app/

</div>

---

## 📖 About HRise

HRise is a full-stack Human Resource Management System (HRMS) designed to streamline workforce management and recruitment operations for modern organizations.

The platform combines traditional HR functionalities with Artificial Intelligence to improve hiring efficiency, employee management, performance tracking, and organizational productivity.

Built using the MERN Stack with an integrated Python Machine Learning microservice, HRise provides secure, role-based workflows for every stakeholder involved in the employee lifecycle.

---

## ✨ Key Features

### 🎯 Recruitment Management

* Job Creation & Publishing
* Candidate Application Tracking
* Resume Screening
* Interview Scheduling
* Recruitment Pipeline Management
* Candidate Status Tracking

### 🤖 AI-Powered Hiring Assistance

* AI Resume Analysis using Google Gemini
* Candidate Skill & Experience Extraction
* Job-Candidate Matching Insights
* Hiring Recommendation Support
* Machine Learning-Based Candidate Suitability Prediction

### 👥 Employee Management

* Employee Directory
* Department Management
* Employee Profiles
* Reporting Hierarchy Management
* Workforce Overview Dashboard

### ⏰ Attendance Management

* Employee Check-In / Check-Out
* Daily Attendance Tracking
* Attendance Analytics
* Real-Time Workforce Status Monitoring

### 📝 Leave Management

* Leave Requests & Approvals
* Casual Leave Tracking
* Sick Leave Management
* Earned Leave Management
* Leave Balance Monitoring

### 💰 Payroll Management

* Salary Records
* Payroll Processing
* Earnings & Deductions Tracking
* Payment History Management

### 📈 Performance Management

* Employee Performance Reviews
* Manager Feedback System
* Performance Ratings
* Historical Review Tracking
* Team Performance Analytics

---

## 🔐 Role-Based Access Control

HRise implements a secure multi-role architecture with dedicated dashboards and permissions.

| Role             | Responsibilities                                                  |
| ---------------- | ----------------------------------------------------------------- |
| Management Admin | Organization management, analytics, payroll, workforce monitoring |
| Recruiter        | Job postings, candidate screening, interview management           |
| Senior Manager   | Team management, leave approvals, performance reviews             |
| Employee         | Attendance, leave requests, payroll access, profile management    |
| Candidate        | Job applications, profile updates, application tracking           |

---

## 🤖 Artificial Intelligence Features

### AI Resume Screening

Google Gemini AI analyzes uploaded resumes and extracts:

* Technical Skills
* Experience
* Qualifications
* Key Candidate Highlights

Reducing manual screening effort and improving recruitment efficiency.

### AI Candidate Matching

Automatically compares candidate profiles against job requirements and generates compatibility insights to assist recruiters in shortlisting decisions.

### AI Performance Review Assistant

Provides AI-generated performance summaries based on employee evaluations, helping managers identify:

* Strengths
* Areas for Improvement
* Performance Trends
* Growth Opportunities

### Machine Learning Hiring Prediction

A dedicated Python Flask microservice predicts candidate suitability using historical recruitment and evaluation data.

**ML Stack**

* Python
* Flask
* Scikit-Learn

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │     React Frontend    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Express REST APIs   │
                    └───────┬───────┬──────┘
                            │       │
                            ▼       ▼
                     MongoDB      AI/ML Service
                                   (Flask)
```

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Context API

### Backend

* Node.js
* Express.js
* JWT Authentication
* Refresh Token Authentication

### Database

* MongoDB
* Mongoose ODM

### AI & Machine Learning

* Google Gemini API
* Python
* Flask
* Scikit-Learn

### Cloud & Deployment

* Cloudinary
* Vercel

---

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/hrise.git
cd hrise
```

### 2. Backend Setup

```bash
cd backend

npm install

npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### 4. Machine Learning Service

```bash
cd ml-service

pip install -r requirements.txt

python api/app.py
```

---

## 📂 Project Structure

```text
HRise
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── services
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── models
│   └── services
│
├── ml-service
│   ├── api
│   ├── models
│   └── training
│
└── README.md
```

---

## 📸 Application Screenshots

### Authentication

* Login Page
* Registration Flow

### Dashboards

* Management Admin Dashboard
* Recruiter Dashboard
* Senior Manager Dashboard
* Employee Dashboard

### Recruitment

* Job Management
* Candidate Tracking
* AI Resume Screening

### Workforce Management

* Attendance Module
* Leave Management
* Payroll Management
* Performance Reviews

> Screenshots can be added here after deployment.

---

## 🎯 Future Roadmap

* AI-Based Employee Retention Prediction
* Email & Notification System
* Mobile Application
* Advanced Workforce Analytics
* Automated Resume Parsing Pipeline
* Interview Feedback Intelligence

---

## 🏆 Hackathon Highlights

✅ Full MERN Stack Architecture

✅ AI-Powered Recruitment System

✅ Machine Learning Integration

✅ Refresh Token Authentication

✅ Multi-Role RBAC System

✅ Production Deployment

✅ Scalable Modular Architecture

---

## 👩‍💻 Developer

**Tanisha Jaiswal**

Final Year B.Tech Computer Science Engineering Student

Lovely Professional University

---

## 🌐 Live Demo

**Application:** https://hrise-app.vercel.app/

---

<div align="center">

### Built with MERN Stack, Google Gemini AI, Python, Flask & Machine Learning

⭐ If you like this project, consider giving it a star.

</div>

# EDUHENS v2 - Educator Assessment Platform

A comprehensive Learning Management System (LMS) designed for educators to manage tasks, assess student submissions, and provide feedback with AI-powered assistance.

## 🚀 Features

### Core Functionality
- **Task Management**: Create, modify, and publish educational tasks
- **Student Submissions**: Track and review student work submissions
- **AI Assessment**: Hens AI provides automated assessment and feedback
- **Educator Assessment**: Manual grading with Pass/Fail options and feedback
- **Dashboard Views**: Separate interfaces for ongoing and closed tasks

### Key Components
- **Submission Details Modal**: Comprehensive assessment interface
- **Closed Task Review**: Inline assessment panel for completed tasks
- **Ongoing Task Management**: Real-time task monitoring and modification
- **Corporate LMS Design**: Professional, responsive interface

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Framework**: Next.js 15.5.6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Turbopack

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── inputs/             # Form input components
│   ├── layouts/            # Layout components
│   ├── App.tsx            # Main application component
│   ├── ClosedTaskReview.tsx
│   ├── OngoingTasks.tsx
│   ├── SubmissionDetailsModal.tsx
│   └── ...
├── services/              # Business logic services
└── lib/                   # Utility functions
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/EDUHENS/v2.git
cd v2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

### For Educators

1. **Create Tasks**: Use the task creation form to design educational activities
2. **Monitor Submissions**: View student submissions in the ongoing tasks view
3. **Assess Work**: Click on submissions to open the assessment modal
4. **Provide Feedback**: Use Pass/Fail grading and written feedback
5. **Review Closed Tasks**: Access completed assessments in the closed tasks view

### Assessment Workflow

1. **Student Submission**: Students submit their work with notes and attachments
2. **AI Assessment**: Hens AI automatically evaluates the submission
3. **Educator Review**: Teachers can review AI assessment and provide their own
4. **Final Approval**: Single "Approve Grade" button completes the process

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Features Implemented

- ✅ Responsive modal design
- ✅ Corporate LMS styling
- ✅ AI assessment integration
- ✅ Educator assessment forms
- ✅ Student submission tracking
- ✅ Task management system
- ✅ Pass/Fail grading system
- ✅ Feedback collection
- ✅ File attachment support

## 📝 Recent Updates

- Removed redundant EducatorSubmissionModal
- Implemented single "Approve Grade" workflow
- Added corporate padding and border styling
- Enhanced responsive design for all screen sizes
- Streamlined assessment process

## 🤝 Contributing

This is a private repository for the EDUHENS project. For contributions, please contact the development team.

## 📄 License

Private - All rights reserved by EDUHENS.

---

**EDUHENS v2** - Empowering educators with intelligent assessment tools.
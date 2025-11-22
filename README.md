# 🎓 AI-Powered Question Paper Generator - Complete Feature List

## 📋 Overview
A comprehensive web application for educators to generate high-quality, customized question papers using AI (Gemini 2.5 Flash).

---

## ✨ Core Features

### 1. **Authentication & User Management**
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Role-based access (User/Admin)
- ✅ Secure password hashing with bcrypt

### 2. **Multi-File Upload** 📚
- ✅ Upload up to 10 files simultaneously
- ✅ Supported formats: PDF, DOCX, TXT
- ✅ Automatic text extraction
- ✅ Combined content analysis
- ✅ File tracking in database

### 3. **Intelligent Exercise Detection** 🔍
- ✅ Auto-detects exercises, examples, problems
- ✅ Regex-based pattern matching
- ✅ Returns unique list of detected exercises
- ✅ Manual exercise addition

### 4. **Advanced Configuration** ⚙️

#### Section-wise Configuration
- ✅ Add/remove sections dynamically
- ✅ Set marks per section
- ✅ Define question count per section
- ✅ Real-time total validation (100 marks)

#### Question Types (10 Types)
- ✅ Numerical
- ✅ Theoretical
- ✅ Conceptual
- ✅ Multiple Choice (MCQ)
- ✅ True/False
- ✅ Fill in the Blanks
- ✅ Short Answer
- ✅ Long Answer
- ✅ Case Study
- ✅ Algorithmic

#### Bloom's Taxonomy Distribution
- ✅ Remember (Recall facts)
- ✅ Understand (Explain ideas)
- ✅ Apply (Use knowledge)
- ✅ Analyze (Break down info)
- ✅ Evaluate (Justify decisions)
- ✅ Create (Design solutions)
- ✅ Slider-based percentage distribution

#### Difficulty Levels
- ✅ Easy, Medium, Hard distribution
- ✅ Percentage-based sliders
- ✅ Visual progress bars

#### Chapter Weightage
- ✅ Auto-calculated weightage
- ✅ Manual override option
- ✅ Chapter-wise distribution

### 5. **Mandatory Exercise Selection** ✅
- ✅ Select from auto-detected exercises
- ✅ Add custom exercises manually
- ✅ Authenticity verification
- ✅ Source attribution

### 6. **Configuration Preview** 👁️
- ✅ Beautiful summary before generation
- ✅ Paper details overview
- ✅ Difficulty mix visualization
- ✅ Section breakdown
- ✅ Validation status

### 7. **AI-Powered Generation** 🤖
- ✅ Gemini 2.5 Flash integration
- ✅ Context-aware question generation
- ✅ Academically rigorous questions
- ✅ Proper formatting and structure
- ✅ JSON and HTML output

### 8. **Smart Regeneration** 🔄
- ✅ Generate completely new questions
- ✅ AI avoids repeating previous versions
- ✅ Maintains all configuration
- ✅ Unlimited regenerations
- ✅ Version tracking in database

### 9. **Full Paper Editing** ✏️
- ✅ Rich text editor with formatting
- ✅ Edit questions, marks, instructions
- ✅ Add/remove content
- ✅ Live updates
- ✅ Save changes

### 10. **Multi-Format Export** 📥
- ✅ **PDF Export** - Print-ready, A4 format
- ✅ **DOCX Export** - Editable in Microsoft Word
- ✅ **HTML Export** - Web-friendly, styled
- ✅ One-click download
- ✅ Proper formatting preserved

### 11. **Admin Panel** 👑
- ✅ System statistics dashboard
- ✅ User management
- ✅ Paper analytics
- ✅ Activity logs
- ✅ Total users, papers, generations
- ✅ Active user tracking

### 12. **Paper Management** 📄
- ✅ View all generated papers
- ✅ Version history
- ✅ Edit existing papers
- ✅ Delete papers
- ✅ Search and filter

---

## 🎨 UI/UX Features

### Design
- ✅ Modern, professional interface
- ✅ Glassmorphism effects
- ✅ Smooth animations (Framer Motion)
- ✅ Responsive design
- ✅ Color-coded elements
- ✅ Dark mode support

### User Experience
- ✅ 3-step wizard interface
- ✅ Progress indicators
- ✅ Loading states
- ✅ Error handling
- ✅ Success notifications
- ✅ Tooltips and help text

---

## 🔧 Technical Stack

### Backend
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + bcrypt
- **AI**: Google Gemini 2.5 Flash
- **File Processing**: Multer, pdf-parse, mammoth
- **Export**: html-pdf-node, docx

### Frontend
- **Framework**: React + Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Rich Text**: React Quill
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 📊 Database Schema

### User Model
- name, email, passwordHash
- role (user/admin)
- provider (email/google)
- lastLogin, timestamps

### Paper Model
- userId, userName, paperName
- config (all settings)
- extractedData (chapters, files, exercises)
- versions (multiple generations)
- timestamps

### ActivityLog Model
- userId, userName, actionType
- metadata, timestamp

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- Gemini API Key

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
node seedAdmin.js  # Create admin user
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### Admin Credentials
- **Email**: admin@qpg.com
- **Password**: admin123

---

## 📝 Usage Flow

1. **Register/Login** → Access the dashboard
2. **Upload Files** → Multiple PDFs/DOCX/TXT
3. **Configure Paper**:
   - Select template
   - Configure sections
   - Choose question types
   - Set difficulty & Bloom's levels
   - Select mandatory exercises
   - Set chapter weightage
4. **Preview Configuration** → Verify settings
5. **Generate Paper** → AI creates questions
6. **Edit Paper** → Make changes in rich editor
7. **Regenerate** → Get new questions (optional)
8. **Export** → Download as PDF/DOCX/HTML
9. **Save** → Store in database

---

## 🎯 Key Differentiators

1. **Multi-File Support** - Upload entire textbooks
2. **Exercise Detection** - Auto-finds exercises from books
3. **Bloom's Taxonomy** - Cognitive level distribution
4. **Smart Regeneration** - No repeated questions
5. **10 Question Types** - Maximum variety
6. **Section-wise Control** - Granular configuration
7. **Multi-Format Export** - PDF, DOCX, HTML
8. **Full Editing** - Rich text editor
9. **Admin Analytics** - Complete oversight
10. **Version Tracking** - All generations saved

---

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Protected API routes
- ✅ Input validation
- ✅ CORS configuration

---

## 📈 Future Enhancements

- Question bank management
- Collaborative editing
- LaTeX export
- Question difficulty analysis
- Plagiarism detection
- Template marketplace
- Mobile app

---

## 🐛 Known Issues & Solutions

### Issue: Frontend port conflict
**Solution**: Changed to port 3000 in `vite.config.js`

### Issue: Gemini JSON parsing
**Solution**: Multiple fallback strategies implemented

### Issue: Export authentication
**Solution**: JWT passed in headers for download routes

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Verify API key configuration
4. Ensure MongoDB is running

---

**Built with ❤️ for educators worldwide**

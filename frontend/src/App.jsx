import React from 'react'
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext'


// =========================================================
// ADMIN PAGES
// =========================================================

import AdminUsers from './pages/AdminUsers'
import AdminCatalog from './pages/AdminCatalog'
import AdminDashboard from './pages/AdminDashboard'
import CreateAccounts from './pages/CreateAccounts'
import Leaderboard from './pages/Leaderboard'
import AdminCertificates from './pages/AdminCertificates'


// =========================================================
// TRAINER PAGES
// =========================================================

import TrainerExams from './pages/TrainerExams'
import TrainerDashboard from './pages/TrainerDashboard'
import TrainerCourseDetail from './pages/TrainerCourseDetail'
import CreateCourse from './pages/CreateCourse'

import TrainerCodingExams from './pages/TrainerCodingExams'
import TrainerCodingQuestions from './pages/TrainerCodingQuestions'
import TrainerCodingExamResults from './pages/TrainerCodingExamResults'


// =========================================================
// AUTH PAGES
// =========================================================

import Login from './pages/Login'
import CreateAccount from './pages/CreateAccount'
import ForgotPassword from './pages/ForgotPassword'


// =========================================================
// LEARNER PAGES
// =========================================================

import LearnerDashboard from './pages/LearnerDashboard'
import LearnerExplore from './pages/LearnerExplore'
import MyLearning from './pages/MyLearning'
import CourseDetail from './pages/CourseDetail'
import LessonPlayer from './pages/LessonPlayer'
import Progress from './pages/Progress'
import LearnerCertificates from './pages/LearnerCertificates'
import LearnerAssessments from './pages/LearnerAssessments'
import LearnerCalendar from './pages/LearnerCalendar'
import LearnerCodingExam from './pages/LearnerCodingExam'
import LearnerExamHistory from './pages/LearnerExamHistory'


// =========================================================
// COMMON PAGES
// =========================================================

import AccountSettings from './pages/AccountSettings'
import ComingSoon from './pages/ComingSoon'


// =========================================================
// EXAMS ROUTER
// =========================================================

function ExamsRoute() {

  const { user } = useAuth()


  // -------------------------------------------------------
  // NOT LOGGED IN
  // -------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  // -------------------------------------------------------
  // LEARNER
  // -------------------------------------------------------

  if (user.role === 'learner') {
    return (
      <LearnerAssessments />
    )
  }


  // -------------------------------------------------------
  // TRAINER
  // -------------------------------------------------------

  if (user.role === 'trainer') {
    return (
      <TrainerExams />
    )
  }


  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------

  if (user.role === 'admin') {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }


  // -------------------------------------------------------
  // UNKNOWN ROLE
  // -------------------------------------------------------

  return (
    <Navigate
      to="/login"
      replace
    />
  )
}


// =========================================================
// MAIN APP
// =========================================================

export default function App() {

  return (

    <AuthProvider>

      <Routes>


        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =================================================
            AUTHENTICATION
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/create-account"
          element={<CreateAccount />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =================================================
            MAIN EXAMS PAGE
        ================================================= */}

        <Route
          path="/exams"
          element={<ExamsRoute />}
        />


        {/* =================================================
            LEARNER CODING EXAM
        ================================================= */}

        <Route
          path="/coding-exam"
          element={<LearnerCodingExam />}
        />

        <Route
          path="/coding-exam/:examId"
          element={<LearnerCodingExam />}
        />


        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        <Route
          path="/admin/catalog"
          element={<AdminCatalog />}
        />

        <Route
          path="/admin/create-accounts"
          element={<CreateAccounts />}
        />

        <Route
          path="/admin/certificates"
          element={<AdminCertificates />}
        />

        <Route
          path="/admin/leaderboard"
          element={
            <Leaderboard
              role="admin"
            />
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AccountSettings
              role="admin"
            />
          }
        />

        <Route
          path="/admin/*"
          element={
            <ComingSoon
              role="admin"
            />
          }
        />


        {/* =================================================
            TRAINER
        ================================================= */}

        <Route
          path="/trainer"
          element={<TrainerDashboard />}
        />

        <Route
          path="/trainer/courses"
          element={<TrainerDashboard />}
        />

        <Route
          path="/trainer/course/:courseId"
          element={<TrainerCourseDetail />}
        />

        <Route
          path="/trainer/create-course"
          element={<CreateCourse />}
        />


        {/* =================================================
            TRAINER CODING EXAMS
        ================================================= */}

        <Route
          path="/trainer/coding-exams"
          element={<TrainerCodingExams />}
        />

        <Route
          path="/trainer/coding-exams/:examId/questions"
          element={<TrainerCodingQuestions />}
        />

        <Route
          path="/trainer/coding-exams/:examId/results"
          element={<TrainerCodingExamResults />}
        />


        {/* =================================================
            TRAINER LEADERBOARD
        ================================================= */}

        <Route
          path="/trainer/leaderboard"
          element={
            <Leaderboard
              role="trainer"
            />
          }
        />


        {/* =================================================
            TRAINER SETTINGS
        ================================================= */}

        <Route
          path="/trainer/settings"
          element={
            <AccountSettings
              role="trainer"
            />
          }
        />


        {/* =================================================
            OLD TRAINER EXAM URLS
        ================================================= */}

        <Route
          path="/trainer/exams"
          element={
            <Navigate
              to="/exams"
              replace
            />
          }
        />

        <Route
          path="/trainer/assignments"
          element={
            <Navigate
              to="/exams"
              replace
            />
          }
        />


        {/* =================================================
            OTHER TRAINER PAGES
        ================================================= */}

        <Route
          path="/trainer/*"
          element={
            <ComingSoon
              role="trainer"
            />
          }
        />


        {/* =================================================
            LEARNER
        ================================================= */}

        <Route
          path="/learner"
          element={<LearnerDashboard />}
        />

        <Route
          path="/learner/progress"
          element={<Progress />}
        />

        <Route
          path="/learner/certificates"
          element={<LearnerCertificates />}
        />

        <Route
          path="/learner/my-learning"
          element={<MyLearning />}
        />

        <Route
          path="/learner/explore"
          element={<LearnerExplore />}
        />

        <Route
          path="/learner/leaderboard"
          element={
            <Leaderboard
              role="learner"
            />
          }
        />

        <Route
          path="/learner/course/:courseId/lesson/:lessonId"
          element={<LessonPlayer />}
        />

        <Route
          path="/learner/course/:courseId"
          element={<CourseDetail />}
        />

        <Route
          path="/learner/settings"
          element={
            <AccountSettings
              role="learner"
            />
          }
        />

        <Route
          path="/learner/calendar"
          element={<LearnerCalendar />}
        />


        {/* =================================================
            LEARNER EXAM HISTORY
        ================================================= */}

        <Route
          path="/exam-history"
          element={<LearnerExamHistory />}
        />


        {/* =================================================
            OLD LEARNER EXAM URLS
        ================================================= */}

        <Route
          path="/learner/exams"
          element={
            <Navigate
              to="/exams"
              replace
            />
          }
        />

        <Route
          path="/learner/assignments"
          element={
            <Navigate
              to="/exams"
              replace
            />
          }
        />

        <Route
          path="/learner/assessments"
          element={
            <Navigate
              to="/exams"
              replace
            />
          }
        />


        {/* =================================================
            OTHER LEARNER PAGES
        ================================================= */}

        <Route
          path="/learner/*"
          element={
            <ComingSoon
              role="learner"
            />
          }
        />


        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  )
}
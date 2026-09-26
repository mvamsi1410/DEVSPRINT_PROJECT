import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./LearnerExamHistory.css";

function LearnerExamHistory() {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    useEffect(() => {
        loadExamHistory();
    }, []);

    async function loadExamHistory() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(
                "/api/learner/coding-exams/history"
            );

            setExams(
                Array.isArray(data?.exams)
                    ? data.exams
                    : []
            );
        } catch (err) {
            console.error(
                "EXAM HISTORY ERROR:",
                err
            );

            setError(
                err?.message ||
                "Failed to load exam history."
            );
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // FILTER
    // =========================================================

    const filteredExams = useMemo(() => {
        switch (activeFilter) {
            case "attempted":
                return exams.filter(
                    (exam) => exam.attempted
                );

            case "passed":
                return exams.filter(
                    (exam) =>
                        exam.status === "passed"
                );

            case "failed":
                return exams.filter(
                    (exam) =>
                        exam.status === "failed"
                );

            case "in_progress":
                return exams.filter(
                    (exam) =>
                        exam.status ===
                        "in_progress"
                );

            case "all":
            default:
                return exams;
        }
    }, [exams, activeFilter]);

    // =========================================================
    // COUNTS
    // =========================================================

    const counts = useMemo(() => {
        return {
            all: exams.length,

            attempted: exams.filter(
                (exam) => exam.attempted
            ).length,

            passed: exams.filter(
                (exam) =>
                    exam.status === "passed"
            ).length,

            failed: exams.filter(
                (exam) =>
                    exam.status === "failed"
            ).length,

            inProgress: exams.filter(
                (exam) =>
                    exam.status ===
                    "in_progress"
            ).length,
        };
    }, [exams]);

    // =========================================================
    // DATE
    // =========================================================

    function formatDate(dateString) {
        if (!dateString) {
            return "Not attempted";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleString();
    }

    // =========================================================
    // STATUS LABEL
    // =========================================================

    function getStatusLabel(status) {
        switch (status) {
            case "passed":
                return "Passed";

            case "failed":
                return "Failed";

            case "in_progress":
                return "In Progress";

            case "not_attempted":
                return "Not Attempted";

            default:
                return "Unknown";
        }
    }

    // =========================================================
    // STATUS CLASS
    // =========================================================

    function getStatusClass(status) {
        switch (status) {
            case "passed":
                return "status-passed";

            case "failed":
                return "status-failed";

            case "in_progress":
                return "status-progress";

            case "not_attempted":
                return "status-not-attempted";

            default:
                return "";
        }
    }

    // =========================================================
    // VIEW RESULT
    // =========================================================

    function handleViewResult(exam) {
        navigate(
            `/coding-exam?examId=${exam.id}`
        );
    }

    // =========================================================
    // START / CONTINUE
    // =========================================================

    function handleStartExam(exam) {
        navigate(
            `/coding-exam?examId=${exam.id}`
        );
    }

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="exam-history-page">

                <div className="exam-history-loading">

                    <div className="loading-spinner"></div>

                    <p>
                        Loading exam history...
                    </p>

                </div>

            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="exam-history-page">

            <div className="exam-history-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="exam-history-header">

                    <div>

                        <h1>
                            Exam History
                        </h1>

                        <p>
                            View all your coding
                            exams, attempts,
                            scores and results.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={loadExamHistory}
                    >
                        ↻ Refresh
                    </button>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="history-error">

                        <div>
                            <strong>
                                Error:
                            </strong>{" "}
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={loadExamHistory}
                        >
                            Try Again
                        </button>

                    </div>
                )}

                {/* =================================================
                    STATISTICS
                ================================================= */}

                <div className="history-stats">

                    {/* ALL */}

                    <button
                        type="button"
                        className={`history-stat-card ${
                            activeFilter === "all"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter("all")
                        }
                    >

                        <span className="stat-number">
                            {counts.all}
                        </span>

                        <span className="stat-label">
                            All Exams
                        </span>

                    </button>

                    {/* ATTEMPTED */}

                    <button
                        type="button"
                        className={`history-stat-card ${
                            activeFilter === "attempted"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter(
                                "attempted"
                            )
                        }
                    >

                        <span className="stat-number">
                            {counts.attempted}
                        </span>

                        <span className="stat-label">
                            Attempted
                        </span>

                    </button>

                    {/* PASSED */}

                    <button
                        type="button"
                        className={`history-stat-card ${
                            activeFilter === "passed"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter(
                                "passed"
                            )
                        }
                    >

                        <span className="stat-number">
                            {counts.passed}
                        </span>

                        <span className="stat-label">
                            Passed
                        </span>

                    </button>

                    {/* FAILED */}

                    <button
                        type="button"
                        className={`history-stat-card ${
                            activeFilter === "failed"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter(
                                "failed"
                            )
                        }
                    >

                        <span className="stat-number">
                            {counts.failed}
                        </span>

                        <span className="stat-label">
                            Failed
                        </span>

                    </button>

                    {/* IN PROGRESS */}

                    <button
                        type="button"
                        className={`history-stat-card ${
                            activeFilter ===
                            "in_progress"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter(
                                "in_progress"
                            )
                        }
                    >

                        <span className="stat-number">
                            {counts.inProgress}
                        </span>

                        <span className="stat-label">
                            In Progress
                        </span>

                    </button>

                </div>

                {/* =================================================
                    SECTION HEADER
                ================================================= */}

                <div className="history-section-header">

                    <div>

                        <h2>
                            {activeFilter === "all"
                                ? "All Exams"
                                : activeFilter ===
                                  "attempted"
                                ? "Attempted Exams"
                                : activeFilter ===
                                  "passed"
                                ? "Passed Exams"
                                : activeFilter ===
                                  "failed"
                                ? "Failed Exams"
                                : "In Progress"}
                        </h2>

                        <span>
                            {filteredExams.length} exam
                            {filteredExams.length !==
                            1
                                ? "s"
                                : ""}
                        </span>

                    </div>

                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {filteredExams.length === 0 && (
                    <div className="empty-history">

                        <div className="empty-icon">
                            📝
                        </div>

                        <h3>
                            No exams found
                        </h3>

                        <p>
                            There are no exams in
                            this category yet.
                        </p>

                    </div>
                )}

                {/* =================================================
                    EXAM LIST
                ================================================= */}

                <div className="exam-history-list">

                    {filteredExams.map(
                        (exam) => (

                            <div
                                className="exam-history-card"
                                key={exam.id}
                            >

                                <div className="exam-card-main">

                                    {/* =================================================
                                        TOP
                                    ================================================= */}

                                    <div className="exam-card-top">

                                        <div>

                                            <h3>
                                                {
                                                    exam.title
                                                }
                                            </h3>

                                            {exam.description && (
                                                <p className="exam-description">
                                                    {
                                                        exam.description
                                                    }
                                                </p>
                                            )}

                                        </div>

                                        <span
                                            className={`exam-status ${getStatusClass(
                                                exam.status
                                            )}`}
                                        >
                                            {getStatusLabel(
                                                exam.status
                                            )}
                                        </span>

                                    </div>

                                    {/* =================================================
                                        DETAILS
                                    ================================================= */}

                                    <div className="exam-card-details">

                                        <div className="exam-detail">

                                            <span>
                                                Score
                                            </span>

                                            <strong>
                                                {
                                                    exam.score ??
                                                    0
                                                }{" "}
                                                /{" "}
                                                {
                                                    exam.total_marks ??
                                                    0
                                                }
                                            </strong>

                                        </div>

                                        <div className="exam-detail">

                                            <span>
                                                Percentage
                                            </span>

                                            <strong>
                                                {
                                                    exam.percentage ??
                                                    0
                                                }
                                                %
                                            </strong>

                                        </div>

                                        <div className="exam-detail">

                                            <span>
                                                Questions
                                            </span>

                                            <strong>
                                                {
                                                    exam.answered_questions ??
                                                    0
                                                }{" "}
                                                /{" "}
                                                {
                                                    exam.total_questions ??
                                                    0
                                                }
                                            </strong>

                                        </div>

                                        <div className="exam-detail">

                                            <span>
                                                Duration
                                            </span>

                                            <strong>
                                                {
                                                    exam.duration ??
                                                    0
                                                }{" "}
                                                min
                                            </strong>

                                        </div>

                                    </div>

                                    {/* =================================================
                                        FOOTER
                                    ================================================= */}

                                    <div className="exam-card-footer">

                                        <span>
                                            Last attempt:{" "}
                                            {formatDate(
                                                exam.last_submitted_at
                                            )}
                                        </span>

                                        <div className="exam-card-actions">

                                            {/* VIEW RESULT */}

                                            {exam.attempted && (
                                                <button
                                                    type="button"
                                                    className="result-button"
                                                    onClick={() =>
                                                        handleViewResult(
                                                            exam
                                                        )
                                                    }
                                                >
                                                    View Result
                                                </button>
                                            )}

                                            {/* START */}

                                            {!exam.attempted && (
                                                <button
                                                    type="button"
                                                    className="start-button"
                                                    onClick={() =>
                                                        handleStartExam(
                                                            exam
                                                        )
                                                    }
                                                >
                                                    Start Exam
                                                </button>
                                            )}

                                            {/* CONTINUE */}

                                            {exam.status ===
                                                "in_progress" && (
                                                <button
                                                    type="button"
                                                    className="continue-button"
                                                    onClick={() =>
                                                        handleStartExam(
                                                            exam
                                                        )
                                                    }
                                                >
                                                    Continue
                                                </button>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )
                    )}

                </div>

            </div>

        </div>
    );
}

export default LearnerExamHistory;
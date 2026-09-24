import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function TrainerExams() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)

  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingExam, setLoadingExam] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showCreateExam, setShowCreateExam] =
    useState(false)

  const [showQuestionForm, setShowQuestionForm] =
    useState(false)

  const [editingQuestion, setEditingQuestion] =
    useState(null)

  const [examTitle, setExamTitle] = useState('')
  const [examDescription, setExamDescription] =
    useState('')

  const [questionText, setQuestionText] =
    useState('')

  const [optionA, setOptionA] =
    useState('')

  const [optionB, setOptionB] =
    useState('')

  const [optionC, setOptionC] =
    useState('')

  const [optionD, setOptionD] =
    useState('')

  const [correctAnswer, setCorrectAnswer] =
    useState('A')

  const [questionMarks, setQuestionMarks] =
    useState(1)

  // =====================================================
  // LOAD TRAINER COURSES
  // =====================================================

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest(
        '/api/trainer/courses'
      )

      setCourses(
        data.courses || []
      )

    } catch (err) {
      console.error(
        'Trainer courses error:',
        err
      )

      setError(
        err.message ||
        'Unable to load courses'
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // LOAD EXAMS
  // =====================================================

  async function loadExams(courseId) {
    try {
      setLoadingExam(true)
      setError('')

      const data = await apiRequest(
        `/api/trainer/courses/${courseId}/quizzes`
      )

      setExams(
        data.exams || []
      )

    } catch (err) {
      console.error(
        'Trainer exams error:',
        err
      )

      setError(
        err.message ||
        'Unable to load exams'
      )
    } finally {
      setLoadingExam(false)
    }
  }

  // =====================================================
  // SELECT COURSE
  // =====================================================

  function selectCourse(course) {
    setSelectedCourse(course)
    setSelectedExam(null)
    setQuestions([])
    setAttempts([])
    setSuccess('')
    setError('')

    loadExams(course.id)
  }

  // =====================================================
  // CREATE EXAM
  // =====================================================

  async function createExam(e) {
    e.preventDefault()

    if (!selectedCourse) {
      return
    }

    if (!examTitle.trim()) {
      setError(
        'Exam title is required'
      )
      return
    }

    try {
      setError('')
      setSuccess('')

      const data = await apiRequest(
        `/api/trainer/courses/${selectedCourse.id}/quizzes`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: examTitle.trim(),
            description:
              examDescription.trim()
          })
        }
      )

      setSuccess(
        'Exam created successfully'
      )

      setExamTitle('')
      setExamDescription('')
      setShowCreateExam(false)

      await loadExams(
        selectedCourse.id
      )

      if (data.exam) {
        openExam(data.exam)
      }

    } catch (err) {
      console.error(
        'Create exam error:',
        err
      )

      setError(
        err.message ||
        'Unable to create exam'
      )
    }
  }

  // =====================================================
  // OPEN EXAM
  // =====================================================

  async function openExam(exam) {
    try {
      setSelectedExam(exam)
      setQuestions([])
      setAttempts([])
      setError('')
      setSuccess('')
      setLoadingExam(true)

      const [
        questionsData,
        attemptsData
      ] = await Promise.all([
        apiRequest(
          `/api/trainer/quizzes/${exam.id}/questions`
        ),
        apiRequest(
          `/api/trainer/quizzes/${exam.id}/attempts`
        )
      ])

      setQuestions(
        questionsData.questions || []
      )

      setAttempts(
        attemptsData.attempts || []
      )

    } catch (err) {
      console.error(
        'Open exam error:',
        err
      )

      setError(
        err.message ||
        'Unable to open exam'
      )
    } finally {
      setLoadingExam(false)
    }
  }

  // =====================================================
  // ADD QUESTION
  // =====================================================

  function openAddQuestion() {
    setEditingQuestion(null)

    setQuestionText('')
    setOptionA('')
    setOptionB('')
    setOptionC('')
    setOptionD('')
    setCorrectAnswer('A')
    setQuestionMarks(1)

    setShowQuestionForm(true)
    setError('')
  }

  // =====================================================
  // EDIT QUESTION
  // =====================================================

  function openEditQuestion(question) {
    setEditingQuestion(question)

    setQuestionText(
      question.question_text || ''
    )

    setOptionA(
      question.option_a || ''
    )

    setOptionB(
      question.option_b || ''
    )

    setOptionC(
      question.option_c || ''
    )

    setOptionD(
      question.option_d || ''
    )

    setCorrectAnswer(
      question.correct_answer || 'A'
    )

    setQuestionMarks(
      question.marks || 1
    )

    setShowQuestionForm(true)
    setError('')
  }

  // =====================================================
  // SAVE QUESTION
  // =====================================================

  async function saveQuestion(e) {
    e.preventDefault()

    if (!selectedExam) {
      return
    }

    if (!questionText.trim()) {
      setError(
        'Question text is required'
      )
      return
    }

    if (
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      setError(
        'All four options are required'
      )
      return
    }

    try {
      setError('')
      setSuccess('')

      const payload = {
        question_text:
          questionText.trim(),

        option_a:
          optionA.trim(),

        option_b:
          optionB.trim(),

        option_c:
          optionC.trim(),

        option_d:
          optionD.trim(),

        correct_answer:
          correctAnswer,

        marks:
          Number(questionMarks) || 1
      }

      if (editingQuestion) {

        await apiRequest(
          `/api/trainer/questions/${editingQuestion.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              payload
            )
          }
        )

        setSuccess(
          'Question updated successfully'
        )

      } else {

        await apiRequest(
          `/api/trainer/quizzes/${selectedExam.id}/questions`,
          {
            method: 'POST',
            body: JSON.stringify(
              payload
            )
          }
        )

        setSuccess(
          'Question added successfully'
        )
      }

      setShowQuestionForm(false)

      await refreshExam()

    } catch (err) {
      console.error(
        'Save question error:',
        err
      )

      setError(
        err.message ||
        'Unable to save question'
      )
    }
  }

  // =====================================================
  // DELETE QUESTION
  // =====================================================

  async function deleteQuestion(question) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this question?'
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await apiRequest(
        `/api/trainer/questions/${question.id}`,
        {
          method: 'DELETE'
        }
      )

      setSuccess(
        'Question deleted successfully'
      )

      await refreshExam()

    } catch (err) {
      console.error(
        'Delete question error:',
        err
      )

      setError(
        err.message ||
        'Unable to delete question'
      )
    }
  }

  // =====================================================
  // DELETE EXAM
  // =====================================================

  async function deleteExam(exam) {
    const confirmed =
      window.confirm(
        `Delete "${exam.title}"? This will also delete its questions and attempt records.`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await apiRequest(
        `/api/trainer/quizzes/${exam.id}`,
        {
          method: 'DELETE'
        }
      )

      setSuccess(
        'Exam deleted successfully'
      )

      setSelectedExam(null)
      setQuestions([])
      setAttempts([])

      await loadExams(
        selectedCourse.id
      )

    } catch (err) {
      console.error(
        'Delete exam error:',
        err
      )

      setError(
        err.message ||
        'Unable to delete exam'
      )
    }
  }

  // =====================================================
  // REFRESH EXAM
  // =====================================================

  async function refreshExam() {
    if (!selectedExam) {
      return
    }

    await openExam(
      selectedExam
    )

    if (selectedCourse) {
      await loadExams(
        selectedCourse.id
      )
    }
  }

  // =====================================================
  // BACK TO EXAMS
  // =====================================================

  function backToExams() {
    setSelectedExam(null)
    setQuestions([])
    setAttempts([])
    setShowQuestionForm(false)
    setError('')
    setSuccess('')

    if (selectedCourse) {
      loadExams(
        selectedCourse.id
      )
    }
  }

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const attemptedCount =
    attempts.length

  // NOTE:
  // This count is based on learners enrolled
  // in the selected course.

  const enrolledLearnerCount =
    selectedCourse?.learner_count ??
    selectedCourse?.enrolled_count ??
    null

  const notAttemptedCount =
    enrolledLearnerCount !== null
      ? Math.max(
          0,
          enrolledLearnerCount -
            attemptedCount
        )
      : null

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout role="trainer">

        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center'
          }}
        >
          Loading courses...
        </div>

      </DashboardLayout>
    )
  }

  // =====================================================
  // EXAM DETAIL
  // =====================================================

  if (selectedExam) {
    return (
      <DashboardLayout role="trainer">

        <div
          className="page-heading-row"
        >

          <div>

            <h1>
              {selectedExam.title}
            </h1>

            <p>
              {selectedExam.description ||
                'Manage exam questions and view learner results.'}
            </p>

          </div>

          <div
            style={{
              display: 'flex',
              gap: 10
            }}
          >

            <button
              className="btn btn-outline"
              onClick={backToExams}
            >
              ← Back
            </button>

            <button
              className="btn btn-danger"
              onClick={() =>
                deleteExam(
                  selectedExam
                )
              }
            >
              Delete Exam
            </button>

          </div>

        </div>

        {error && (
          <div
            className="card"
            style={{
              padding: 16,
              marginBottom: 20
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="card"
            style={{
              padding: 16,
              marginBottom: 20
            }}
          >
            {success}
          </div>
        )}

        {/* =================================================
            EXAM SUMMARY
        ================================================= */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 25
          }}
        >

          <div
            className="card"
            style={{
              padding: 20
            }}
          >
            <strong>
              Questions
            </strong>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginTop: 8
              }}
            >
              {questions.length}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 20
            }}
          >
            <strong>
              Total Marks
            </strong>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginTop: 8
              }}
            >
              {questions.reduce(
                (sum, question) =>
                  sum +
                  Number(
                    question.marks || 0
                  ),
                0
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 20
            }}
          >
            <strong>
              Attempts
            </strong>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginTop: 8
              }}
            >
              {attemptedCount}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 20
            }}
          >
            <strong>
              Enrolled Learners
            </strong>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginTop: 8
              }}
            >
              {enrolledLearnerCount ??
                '—'}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 20
            }}
          >
            <strong>
              Not Attempted
            </strong>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                marginTop: 8
              }}
            >
              {notAttemptedCount ??
                '—'}
            </div>
          </div>

        </div>

        {/* =================================================
            QUESTIONS
        ================================================= */}

        <div
          className="page-heading-row"
        >

          <div>
            <h2>
              Questions
            </h2>

            <p>
              Add, edit or remove questions.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={
              openAddQuestion
            }
          >
            + Add Question
          </button>

        </div>

        {showQuestionForm && (

          <div
            className="card"
            style={{
              padding: 25,
              marginBottom: 25
            }}
          >

            <h2>
              {editingQuestion
                ? 'Edit Question'
                : 'Add Question'}
            </h2>

            <form
              onSubmit={
                saveQuestion
              }
            >

              <div
                style={{
                  marginBottom: 15
                }}
              >

                <label>
                  Question
                </label>

                <textarea
                  value={
                    questionText
                  }
                  onChange={(e) =>
                    setQuestionText(
                      e.target.value
                    )
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    padding: 10
                  }}
                />

              </div>

              {[
                ['A', optionA, setOptionA],
                ['B', optionB, setOptionB],
                ['C', optionC, setOptionC],
                ['D', optionD, setOptionD]
              ].map(
                ([
                  key,
                  value,
                  setter
                ]) => (

                  <div
                    key={key}
                    style={{
                      marginBottom: 12
                    }}
                  >

                    <label>
                      Option {key}
                    </label>

                    <input
                      value={value}
                      onChange={(e) =>
                        setter(
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        marginTop: 6,
                        padding: 10
                      }}
                    />

                  </div>

                )
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 15,
                  marginBottom: 20
                }}
              >

                <div>

                  <label>
                    Correct Answer
                  </label>

                  <select
                    value={
                      correctAnswer
                    }
                    onChange={(e) =>
                      setCorrectAnswer(
                        e.target.value
                      )
                    }
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: 10
                    }}
                  >

                    <option value="A">
                      A
                    </option>

                    <option value="B">
                      B
                    </option>

                    <option value="C">
                      C
                    </option>

                    <option value="D">
                      D
                    </option>

                  </select>

                </div>

                <div>

                  <label>
                    Marks
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      questionMarks
                    }
                    onChange={(e) =>
                      setQuestionMarks(
                        e.target.value
                      )
                    }
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: 10
                    }}
                  />

                </div>

              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10
                }}
              >

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingQuestion
                    ? 'Update Question'
                    : 'Add Question'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    setShowQuestionForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        )}

        {loadingExam ? (

          <div
            className="card"
            style={{
              padding: 30,
              textAlign: 'center'
            }}
          >
            Loading exam...
          </div>

        ) : questions.length === 0 ? (

          <div
            className="card"
            style={{
              padding: 30,
              textAlign: 'center'
            }}
          >

            <h3>
              No Questions Yet
            </h3>

            <p>
              Add the first question to
              this exam.
            </p>

          </div>

        ) : (

          questions.map(
            (question, index) => (

              <div
                className="card"
                key={question.id}
                style={{
                  padding: 24,
                  marginBottom: 18
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: 20
                  }}
                >

                  <div>

                    <h3>
                      {index + 1}.{' '}
                      {question.question_text}
                    </h3>

                    <p>
                      Marks:{' '}
                      <strong>
                        {question.marks}
                      </strong>
                    </p>

                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8
                    }}
                  >

                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        openEditQuestion(
                          question
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        deleteQuestion(
                          question
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    marginTop: 15
                  }}
                >

                  {[
                    ['A', question.option_a],
                    ['B', question.option_b],
                    ['C', question.option_c],
                    ['D', question.option_d]
                  ].map(
                    ([key, text]) => (

                      <div
                        key={key}
                        style={{
                          padding: 10,
                          border:
                            '1px solid #ddd',
                          borderRadius: 6,
                          background:
                            key ===
                            question.correct_answer
                              ? '#ecfdf5'
                              : '#fff'
                        }}
                      >

                        <strong>
                          {key}.
                        </strong>{' '}

                        {text}

                        {key ===
                          question.correct_answer && (
                          <strong
                            style={{
                              marginLeft: 10
                            }}
                          >
                            ✓ Correct
                          </strong>
                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

            )
          )

        )}

        {/* =================================================
            RESULTS
        ================================================= */}

        <div
          style={{
            marginTop: 40
          }}
        >

          <div
            className="page-heading-row"
          >

            <div>

              <h2>
                Learner Results
              </h2>

              <p>
                See who attempted the exam
                and their marks.
              </p>

            </div>

          </div>

          {attempts.length === 0 ? (

            <div
              className="card"
              style={{
                padding: 25,
                textAlign: 'center'
              }}
            >

              No learners have attempted
              this exam yet.

            </div>

          ) : (

            <div
              className="card"
              style={{
                padding: 0,
                overflowX: 'auto'
              }}
            >

              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse'
                }}
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'left'
                      }}
                    >
                      Learner
                    </th>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'left'
                      }}
                    >
                      Email
                    </th>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'center'
                      }}
                    >
                      Score
                    </th>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'center'
                      }}
                    >
                      Percentage
                    </th>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'center'
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        padding: 14,
                        textAlign: 'left'
                      }}
                    >
                      Attempted At
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {attempts.map(
                    (attempt) => (

                      <tr
                        key={
                          attempt.id
                        }
                      >

                        <td
                          style={{
                            padding: 14
                          }}
                        >
                          <strong>
                            {
                              attempt.learner_name
                            }
                          </strong>
                        </td>

                        <td
                          style={{
                            padding: 14
                          }}
                        >
                          {
                            attempt.learner_email
                          }
                        </td>

                        <td
                          style={{
                            padding: 14,
                            textAlign:
                              'center'
                          }}
                        >
                          <strong>
                            {attempt.score}
                            {' / '}
                            {attempt.total}
                          </strong>
                        </td>

                        <td
                          style={{
                            padding: 14,
                            textAlign:
                              'center'
                          }}
                        >
                          {
                            attempt.percentage
                          }%
                        </td>

                        <td
                          style={{
                            padding: 14,
                            textAlign:
                              'center'
                          }}
                        >
                          {attempt.status ||
                            'Completed'}
                        </td>

                        <td
                          style={{
                            padding: 14
                          }}
                        >
                          {attempt.attempted_at
                            ? new Date(
                                attempt.attempted_at
                              ).toLocaleString()
                            : '-'}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </DashboardLayout>
    )
  }

  // =====================================================
  // COURSE / EXAM LIST
  // =====================================================

  return (
    <DashboardLayout role="trainer">

      <div
        className="page-heading-row"
      >

        <div>

          <h1>
            Exams
          </h1>

          <p>
            Create exams, manage questions
            and view learner results.
          </p>

        </div>

      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 20
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 20
          }}
        >
          {success}
        </div>
      )}

      {courses.length === 0 ? (

        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center'
          }}
        >

          <h2>
            No Courses Found
          </h2>

          <p>
            Create a course first before
            creating an exam.
          </p>

        </div>

      ) : (

        courses.map((course) => {

          const courseExams =
            selectedCourse?.id ===
            course.id
              ? exams
              : []

          return (

            <div
              className="card"
              key={course.id}
              style={{
                padding: 24,
                marginBottom: 20
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: 20
                }}
              >

                <div>

                  <h2>
                    {course.title}
                  </h2>

                  <p>
                    {course.description ||
                      'No course description.'}
                  </p>

                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10
                  }}
                >

                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      selectCourse(
                        course
                      )
                    }
                  >
                    View Exams
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedCourse(
                        course
                      )
                      setSelectedExam(null)
                      setShowCreateExam(
                        true
                      )
                      setError('')
                      setSuccess('')

                      loadExams(
                        course.id
                      )
                    }}
                  >
                    + Create Exam
                  </button>

                </div>

              </div>

              {selectedCourse?.id ===
                course.id && (
                <>

                  {showCreateExam && (

                    <div
                      className="card"
                      style={{
                        padding: 20,
                        marginTop: 20
                      }}
                    >

                      <h3>
                        Create Exam
                      </h3>

                      <form
                        onSubmit={
                          createExam
                        }
                      >

                        <div
                          style={{
                            marginBottom: 15
                          }}
                        >

                          <label>
                            Exam Title
                          </label>

                          <input
                            value={
                              examTitle
                            }
                            onChange={(e) =>
                              setExamTitle(
                                e.target.value
                              )
                            }
                            placeholder="Enter exam title"
                            style={{
                              width:
                                '100%',
                              padding: 10,
                              marginTop: 6
                            }}
                          />

                        </div>

                        <div
                          style={{
                            marginBottom: 15
                          }}
                        >

                          <label>
                            Description
                          </label>

                          <textarea
                            value={
                              examDescription
                            }
                            onChange={(e) =>
                              setExamDescription(
                                e.target.value
                              )
                            }
                            rows={3}
                            placeholder="Enter exam description"
                            style={{
                              width:
                                '100%',
                              padding: 10,
                              marginTop: 6
                            }}
                          />

                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 10
                          }}
                        >

                          <button
                            type="submit"
                            className="btn btn-primary"
                          >
                            Create Exam
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() =>
                              setShowCreateExam(
                                false
                              )
                            }
                          >
                            Cancel
                          </button>

                        </div>

                      </form>

                    </div>

                  )}

                  {loadingExam ? (

                    <div
                      style={{
                        padding: 20
                      }}
                    >
                      Loading exams...
                    </div>

                  ) : courseExams.length === 0 ? (

                    <div
                      style={{
                        padding: 20,
                        textAlign:
                          'center'
                      }}
                    >
                      No exams created
                      for this course.
                    </div>

                  ) : (

                    <div
                      style={{
                        marginTop: 20
                      }}
                    >

                      {courseExams.map(
                        (exam) => (

                          <div
                            key={
                              exam.id
                            }
                            style={{
                              border:
                                '1px solid #ddd',
                              borderRadius: 8,
                              padding: 18,
                              marginBottom: 12
                            }}
                          >

                            <div
                              style={{
                                display:
                                  'flex',
                                justifyContent:
                                  'space-between',
                                alignItems:
                                  'center',
                                gap: 20
                              }}
                            >

                              <div>

                                <h3>
                                  {
                                    exam.title
                                  }
                                </h3>

                                <p>
                                  {
                                    exam.description ||
                                    'No description.'
                                  }
                                </p>

                                <p
                                  style={{
                                    color:
                                      'var(--text-500)'
                                  }}
                                >
                                  Questions:{' '}
                                  {
                                    exam.question_count ??
                                    0
                                  }

                                  {' | '}

                                  Marks:{' '}
                                  {
                                    exam.total_marks ??
                                    0
                                  }
                                </p>

                              </div>

                              <button
                                className="btn btn-primary"
                                onClick={() =>
                                  openExam(
                                    exam
                                  )
                                }
                              >
                                Manage Exam →
                              </button>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </>
              )}

            </div>

          )
        })

      )}

    </DashboardLayout>
  )
}
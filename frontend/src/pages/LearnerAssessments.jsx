import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { apiRequest } from '../services/api'

export default function LearnerAssessments() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedExam, setSelectedExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loadingExam, setLoadingExam] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // Result returned after submission or loaded
  // from the database.
  const [result, setResult] = useState(null)

  // =====================================================
  // LOAD AVAILABLE EXAMS
  // =====================================================

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest(
        '/api/learner/exams'
      )

      console.log(
        'EXAMS API:',
        data
      )

      setExams(
        Array.isArray(data.exams)
          ? data.exams
          : []
      )

    } catch (err) {
      console.error(
        'Exams API error:',
        err
      )

      setError(
        err.message ||
        'Unable to load exams'
      )

    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // LOAD SAVED RESULT
  // =====================================================

  async function loadSavedResult(
    examId,
    examData = null
  ) {
    try {
      setError('')

      const data = await apiRequest(
        `/api/learner/exams/${examId}/result`
      )

      console.log(
        'SAVED EXAM RESULT API:',
        data
      )

      if (
        data &&
        data.attempt
      ) {
        setSelectedExam(
          data.exam ||
          examData ||
          null
        )

        setResult(
          buildResultObject(
            data.attempt,
            data.questions
          )
        )

        setQuestions(
          Array.isArray(data.questions)
            ? data.questions
            : []
        )

        return true
      }

      return false

    } catch (err) {
      console.log(
        'No saved result found:',
        err
      )

      return false
    }
  }

  // =====================================================
  // START EXAM
  // =====================================================

  async function startExam(exam) {
    try {
      setLoadingExam(true)
      setError('')
      setResult(null)
      setAnswers({})
      setQuestions([])
      setSelectedExam(null)

      // -------------------------------------------------
      // FIRST CHECK WHETHER THE LEARNER ALREADY
      // HAS A SAVED RESULT.
      // -------------------------------------------------

      const savedResultLoaded =
        await loadSavedResult(
          exam.id,
          exam
        )

      if (savedResultLoaded) {
        setLoadingExam(false)
        return
      }

      // -------------------------------------------------
      // NO PREVIOUS ATTEMPT.
      // LOAD THE ACTUAL EXAM.
      // -------------------------------------------------

      const data = await apiRequest(
        `/api/learner/exams/${exam.id}`
      )

      console.log(
        'EXAM DETAIL API:',
        data
      )

      setSelectedExam(
        data.exam || null
      )

      setQuestions(
        Array.isArray(data.questions)
          ? data.questions
          : []
      )

    } catch (err) {
      console.error(
        'Exam detail error:',
        err
      )

      setError(
        err.message ||
        'Unable to start exam'
      )

      setSelectedExam(null)
      setQuestions([])

    } finally {
      setLoadingExam(false)
    }
  }

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  function selectAnswer(
    questionId,
    optionKey
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionKey
    }))
  }

  // =====================================================
  // SUBMIT EXAM
  // =====================================================

  async function submitExam() {
    if (!selectedExam) {
      return
    }

    const unanswered =
      questions.filter(
        (question) =>
          !answers[question.id]
      )

    if (unanswered.length > 0) {

      const confirmSubmit =
        window.confirm(
          `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`
        )

      if (!confirmSubmit) {
        return
      }
    }

    try {
      setSubmitting(true)
      setError('')

      // -------------------------------------------------
      // SAVE THE ATTEMPT
      // -------------------------------------------------

      const data = await apiRequest(
        `/api/learner/exams/${selectedExam.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            answers
          })
        }
      )

      console.log(
        'EXAM SUBMISSION API:',
        data
      )

      // -------------------------------------------------
      // Backend returns:
      //
      // data.attempt
      // data.attempt.question_results
      // -------------------------------------------------

      const attempt =
        data.attempt ||
        data.result ||
        data

      // -------------------------------------------------
      // Immediately load the saved result from DB.
      //
      // This makes sure what we display is the actual
      // stored result, not just temporary React state.
      // -------------------------------------------------

      try {

        const savedData =
          await apiRequest(
            `/api/learner/exams/${selectedExam.id}/result`
          )

        console.log(
          'SAVED RESULT AFTER SUBMIT:',
          savedData
        )

        if (
          savedData &&
          savedData.attempt
        ) {

          setResult(
            buildResultObject(
              savedData.attempt,
              savedData.questions
            )
          )

          setQuestions(
            Array.isArray(
              savedData.questions
            )
              ? savedData.questions
              : []
          )

        } else {

          setResult(
            buildResultObject(
              attempt,
              attempt?.question_results
            )
          )
        }

      } catch (resultError) {

        console.error(
          'Unable to reload saved result:',
          resultError
        )

        // If the second request fails,
        // still show the result returned
        // from the submit request.

        setResult(
          buildResultObject(
            attempt,
            attempt?.question_results
          )
        )
      }

      // Refresh exam list so "Already attempted"
      // is displayed.
      await loadExams()

    } catch (err) {

      console.error(
        'Exam submission error:',
        err
      )

      setError(
        err.message ||
        'Unable to submit exam'
      )

    } finally {
      setSubmitting(false)
    }
  }

  // =====================================================
  // BACK TO EXAM LIST
  // =====================================================

  function backToExams() {

    setSelectedExam(null)

    setQuestions([])

    setAnswers({})

    setResult(null)

    setError('')

    loadExams()
  }

  // =====================================================
  // LOADING EXAMS
  // =====================================================

  if (loading) {

    return (
      <DashboardLayout role="learner">

        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center'
          }}
        >
          Loading exams...
        </div>

      </DashboardLayout>
    )
  }

  // =====================================================
  // EXAM RESULT
  // =====================================================

  if (result) {

    const resultQuestions =
      Array.isArray(
        result.question_results
      )
        ? result.question_results
        : []

    const score =
      Number(
        result.score || 0
      )

    const total =
      Number(
        result.total || 0
      )

    const percentage =
      Number(
        result.percentage || 0
      )

    const correctCount =
      Number(
        result.correct_count || 0
      )

    const wrongCount =
      Number(
        result.wrong_count || 0
      )

    const unanswered =
      Number(
        result.unanswered_count || 0
      )

    return (
      <DashboardLayout role="learner">

        {/* =================================================
            RESULT HEADER
        ================================================= */}

        <div className="page-heading-row">

          <div>

            <h1>
              Exam Result
            </h1>

            <p>
              {selectedExam?.title ||
                'Exam'}
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

        {/* =================================================
            SCORE SUMMARY
        ================================================= */}

        <div
          className="card"
          style={{
            padding: 30,
            marginBottom: 25
          }}
        >

          <h2
            style={{
              marginTop: 0
            }}
          >
            Exam Completed 🎉
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginTop: 25
            }}
          >

            {/* SCORE */}

            <ResultCard
              title="Marks Obtained"
              value={`${score} / ${total}`}
            />

            {/* PERCENTAGE */}

            <ResultCard
              title="Percentage"
              value={`${percentage}%`}
            />

            {/* CORRECT */}

            <ResultCard
              title="Correct"
              value={correctCount}
            />

            {/* WRONG */}

            <ResultCard
              title="Incorrect"
              value={wrongCount}
            />

            {/* UNANSWERED */}

            <ResultCard
              title="Unanswered"
              value={unanswered}
            />

          </div>

        </div>

        {/* =================================================
            QUESTION-BY-QUESTION RESULT
        ================================================= */}

        <div
          style={{
            marginBottom: 25
          }}
        >

          <h2>
            Question Results
          </h2>

          {resultQuestions.length === 0 ? (

            <div
              className="card"
              style={{
                padding: 25
              }}
            >
              No question result details
              are available.
            </div>

          ) : (

            resultQuestions.map(
              (question, index) => {

                const isCorrect =
                  Boolean(
                    question.is_correct ??
                    question.correct
                  )

                const selectedAnswer =
                  question.selected_answer ||
                  null

                const correctAnswer =
                  question.correct_answer ||
                  ''

                const options = {
                  A: question.option_a,
                  B: question.option_b,
                  C: question.option_c,
                  D: question.option_d
                }

                return (
                  <div
                    className="card"
                    key={
                      question.question_id
                    }
                    style={{
                      padding: 24,
                      marginBottom: 18,
                      borderLeft:
                        isCorrect
                          ? '5px solid #16a34a'
                          : '5px solid #dc2626'
                    }}
                  >

                    {/* QUESTION HEADER */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                        gap: 15,
                        flexWrap: 'wrap'
                      }}
                    >

                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: 8
                        }}
                      >
                        {index + 1}.{' '}
                        {
                          question.question_text ||
                          question.question ||
                          'Question'
                        }
                      </h3>

                      <strong
                        style={{
                          padding:
                            '6px 12px',
                          borderRadius: 20,
                          background:
                            isCorrect
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            isCorrect
                              ? '#166534'
                              : '#991b1b'
                        }}
                      >
                        {isCorrect
                          ? '✓ Correct'
                          : selectedAnswer
                            ? '✗ Incorrect'
                            : '— Unanswered'}
                      </strong>

                    </div>

                    {/* OPTIONS */}

                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        marginTop: 18
                      }}
                    >

                      {Object.entries(
                        options
                      ).map(
                        ([key, text]) => {

                          if (
                            text === null ||
                            text === undefined
                          ) {
                            return null
                          }

                          const learnerSelected =
                            selectedAnswer ===
                            key

                          const correct =
                            correctAnswer ===
                            key

                          let background =
                            '#fff'

                          let border =
                            '1px solid #ddd'

                          if (correct) {
                            background =
                              '#dcfce7'

                            border =
                              '2px solid #16a34a'
                          } else if (
                            learnerSelected &&
                            !correct
                          ) {
                            background =
                              '#fee2e2'

                            border =
                              '2px solid #dc2626'
                          }

                          return (
                            <div
                              key={key}
                              style={{
                                padding: 14,
                                borderRadius: 8,
                                background,
                                border
                              }}
                            >

                              <strong>
                                {key}.
                              </strong>{' '}

                              {text}

                              <div
                                style={{
                                  marginTop: 6,
                                  fontSize: 13,
                                  fontWeight: 600
                                }}
                              >

                                {learnerSelected && (
                                  <span>
                                    Your answer
                                  </span>
                                )}

                                {learnerSelected &&
                                  correct && (
                                    <span>
                                      {' '}
                                      • Correct answer
                                    </span>
                                )}

                                {!learnerSelected &&
                                  correct && (
                                    <span>
                                      Correct answer
                                    </span>
                                )}

                              </div>

                            </div>
                          )
                        }
                      )}

                    </div>

                    {/* ANSWER DETAILS */}

                    <div
                      style={{
                        marginTop: 18,
                        padding: 16,
                        borderRadius: 8,
                        background:
                          '#f8fafc'
                      }}
                    >

                      <p
                        style={{
                          marginTop: 0
                        }}
                      >
                        <strong>
                          Your answer:
                        </strong>{' '}

                        {selectedAnswer
                          ? `${selectedAnswer}. ${
                              options[
                                selectedAnswer
                              ] || ''
                            }`
                          : 'Not answered'}
                      </p>

                      <p>

                        <strong>
                          Correct answer:
                        </strong>{' '}

                        {correctAnswer
                          ? `${correctAnswer}. ${
                              options[
                                correctAnswer
                              ] || ''
                            }`
                          : 'Not available'}

                      </p>

                      <p
                        style={{
                          marginBottom: 0
                        }}
                      >

                        <strong>
                          Marks:
                        </strong>{' '}

                        {question.marks_awarded ??
                          0}
                        {' / '}
                        {question.marks ??
                          0}

                      </p>

                    </div>

                  </div>
                )
              }
            )

          )}

        </div>

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 30,
            marginBottom: 40
          }}
        >

          <button
            className="btn btn-primary"
            onClick={backToExams}
          >
            ← Back to Exams
          </button>

        </div>

      </DashboardLayout>
    )
  }

  // =====================================================
  // ACTIVE EXAM
  // =====================================================

  if (selectedExam) {

    return (
      <DashboardLayout role="learner">

        <div className="page-heading-row">

          <div>

            <h1>
              {selectedExam.title}
            </h1>

            <p>
              {selectedExam.description ||
                'Complete all questions and submit your exam.'}
            </p>

          </div>

          <button
            className="btn btn-outline"
            onClick={() => {

              setSelectedExam(null)

              setQuestions([])

              setAnswers({})

              setResult(null)

              setError('')

            }}
          >
            ← Back
          </button>

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

        {/* =================================================
            EXAM SUMMARY
        ================================================= */}

        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 20
          }}
        >

          <div
            style={{
              display: 'flex',
              gap: 25,
              flexWrap: 'wrap'
            }}
          >

            <div>

              <strong>
                Questions:
              </strong>{' '}

              {questions.length}

            </div>

            <div>

              <strong>
                Total Marks:
              </strong>{' '}

              {selectedExam.total_marks ??
                0}

            </div>

          </div>

        </div>

        {/* =================================================
            QUESTIONS
        ================================================= */}

        {questions.length === 0 ? (

          <div
            className="card"
            style={{
              padding: 30,
              textAlign: 'center'
            }}
          >

            <h2>
              No Questions Found
            </h2>

            <p>
              This exam does not contain
              any questions yet.
            </p>

          </div>

        ) : (

          questions.map(
            (question, index) => {

              const options =
                question.options &&
                typeof question.options ===
                  'object'

                  ? Object.entries(
                      question.options
                    ).map(
                      ([key, text]) => ({
                        key,
                        text
                      })
                    )

                  : []

              return (
                <div
                  className="card"
                  key={question.id}
                  style={{
                    padding: 24,
                    marginBottom: 18
                  }}
                >

                  {/* QUESTION */}

                  <h3>
                    {index + 1}.{' '}

                    {question.question_text ||
                      question.question ||
                      'Question'}
                  </h3>

                  {/* MARKS */}

                  <p
                    style={{
                      color:
                        'var(--text-500)'
                    }}
                  >
                    Marks:{' '}
                    {question.marks ?? 0}
                  </p>

                  {/* OPTIONS */}

                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      marginTop: 16
                    }}
                  >

                    {options.map(
                      (option) => {

                        const selected =
                          answers[
                            question.id
                          ] ===
                          option.key

                        return (
                          <button
                            key={
                              option.key
                            }
                            type="button"
                            onClick={() =>
                              selectAnswer(
                                question.id,
                                option.key
                              )
                            }
                            style={{
                              textAlign:
                                'left',
                              padding: 14,
                              borderRadius: 8,

                              border:
                                selected
                                  ? '2px solid #2563eb'
                                  : '1px solid #ddd',

                              background:
                                selected
                                  ? '#eff6ff'
                                  : '#fff',

                              cursor:
                                'pointer'
                            }}
                          >

                            <strong>
                              {option.key}.
                            </strong>{' '}

                            {option.text}

                          </button>
                        )
                      }
                    )}

                  </div>

                </div>
              )
            }
          )

        )}

        {/* =================================================
            SUBMIT
        ================================================= */}

        {questions.length > 0 && (

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 25,
              marginBottom: 40
            }}
          >

            <button
              className="btn btn-primary"
              onClick={submitExam}
              disabled={submitting}
            >

              {submitting
                ? 'Submitting...'
                : 'Submit Exam'}

            </button>

          </div>

        )}

      </DashboardLayout>
    )
  }

  // =====================================================
  // LOADING SINGLE EXAM
  // =====================================================

  if (loadingExam) {

    return (
      <DashboardLayout role="learner">

        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center'
          }}
        >
          Loading exam...
        </div>

      </DashboardLayout>
    )
  }

  // =====================================================
  // EXAMS LIST
  // =====================================================

  return (
    <DashboardLayout role="learner">

      <div className="page-heading-row">

        <div>

          <h1>
            Exams
          </h1>

          <p>
            View your available exams and
            start an exam.
          </p>

        </div>

        <Link
          className="btn btn-outline"
          to="/learner"
        >
          ← Dashboard
        </Link>

      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 20
          }}
        >

          <h3>
            Unable to load exams
          </h3>

          <p>
            {error}
          </p>

        </div>
      )}

      {!error &&
        exams.length === 0 && (

          <div
            className="card"
            style={{
              padding: 30,
              textAlign: 'center'
            }}
          >

            <h2>
              No Exams Available
            </h2>

            <p>
              Your trainer has not created
              an exam for your enrolled
              courses yet.
            </p>

          </div>

        )}

      {exams.map((exam) => (

        <div
          className="card"
          key={exam.id}
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
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap'
            }}
          >

            <div>

              <h2
                style={{
                  marginTop: 0
                }}
              >
                {exam.title}
              </h2>

              <p>
                {exam.description ||
                  'No description available.'}
              </p>

              <p
                style={{
                  color:
                    'var(--text-500)'
                }}
              >

                Questions:{' '}
                {exam.question_count ??
                  0}

                {'  |  '}

                Total Marks:{' '}

                {exam.total_marks ??
                  0}

              </p>

              {exam.attempted && (

                <p
                  style={{
                    marginBottom: 0,
                    fontWeight: 600
                  }}
                >
                  Already attempted
                </p>

              )}

            </div>

            <button
              className="btn btn-primary"
              onClick={() =>
                startExam(exam)
              }
            >

              {exam.attempted
                ? 'View Result →'
                : 'Start Exam →'}

            </button>

          </div>

        </div>

      ))}

    </DashboardLayout>
  )
}


// =====================================================
// BUILD RESULT OBJECT
// =====================================================

function buildResultObject(
  attempt,
  questionResults = []
) {

  const questions =
    Array.isArray(questionResults)
      ? questionResults
      : []

  const score =
    Number(
      attempt?.score || 0
    )

  const total =
    Number(
      attempt?.total || 0
    )

  const percentage =
    Number(
      attempt?.percentage ||
      (
        total > 0
          ? (score / total) * 100
          : 0
      )
    )

  const correctCount =
    Number(
      attempt?.correct_count ??
      questions.filter(
        (question) =>
          Boolean(
            question.is_correct ??
            question.correct
          )
      ).length
    )

  const answeredCount =
    Number(
      attempt?.answered_count ??
      questions.filter(
        (question) =>
          question.selected_answer
      ).length
    )

  const unansweredCountValue =
    Number(
      attempt?.unanswered_count ??
      Math.max(
        0,
        questions.length -
        answeredCount
      )
    )

  const wrongCount =
    Number(
      attempt?.wrong_count ??
      Math.max(
        0,
        answeredCount -
        correctCount
      )
    )

  return {
    id: attempt?.id,
    score,
    total,
    percentage,
    correct_count: correctCount,
    wrong_count: wrongCount,
    answered_count: answeredCount,
    unanswered_count:
      unansweredCountValue,
    question_results: questions
  }
}


// =====================================================
// RESULT CARD
// =====================================================

function ResultCard({
  title,
  value
}) {

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}
    >

      <div
        style={{
          fontSize: 14,
          color: '#64748b',
          marginBottom: 8
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700
        }}
      >
        {value}
      </div>

    </div>
  )
}
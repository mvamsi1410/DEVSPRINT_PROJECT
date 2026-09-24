import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './TrainerCodingQuestions.css'

const emptyQuestion = {
  title: '',
  description: '',
  difficulty: 'easy',
  points: 10,
  input_format: '',
  output_format: '',
  constraints: '',
  starter_code: '',
  language: 'python',
  test_cases: [
    {
      input_data: '',
      expected_output: '',
      is_sample: true,
    },
  ],
}

export default function TrainerCodingQuestions() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(emptyQuestion)

  useEffect(() => {
    loadQuestions()
  }, [examId])

  async function loadQuestions() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest(
        `/api/trainer/coding-exams/${examId}/questions`
      )

      setExam(data?.exam || null)
      setQuestions(data?.questions || [])
    } catch (err) {
      console.error(err)
      setError(
        err.message ||
        'Failed to load coding questions.'
      )
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setForm({
      ...emptyQuestion,
      test_cases: [
        {
          input_data: '',
          expected_output: '',
          is_sample: true,
        },
      ],
    })
    setError('')
    setShowForm(true)
  }

  function openEditForm(question) {
    setEditingId(question.id)

    setForm({
      title: question.title || '',
      description: question.description || '',
      difficulty: question.difficulty || 'easy',
      points: question.points || 10,
      input_format: question.input_format || '',
      output_format: question.output_format || '',
      constraints: question.constraints || '',
      starter_code: question.starter_code || '',
      language: question.language || 'python',
      test_cases:
        question.test_cases?.length
          ? question.test_cases.map((testCase) => ({
              input_data:
                testCase.input_data || '',
              expected_output:
                testCase.expected_output || '',
              is_sample:
                Boolean(testCase.is_sample),
            }))
          : [
              {
                input_data: '',
                expected_output: '',
                is_sample: true,
              },
            ],
    })

    setError('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) {
      return
    }

    setShowForm(false)
    setEditingId(null)
    setForm(emptyQuestion)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleTestCaseChange(
    index,
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      test_cases: previous.test_cases.map(
        (testCase, testIndex) =>
          testIndex === index
            ? {
                ...testCase,
                [field]: value,
              }
            : testCase
      ),
    }))
  }

  function toggleSample(index) {
    setForm((previous) => ({
      ...previous,
      test_cases: previous.test_cases.map(
        (testCase, testIndex) =>
          testIndex === index
            ? {
                ...testCase,
                is_sample:
                  !testCase.is_sample,
              }
            : testCase
      ),
    }))
  }

  function addTestCase() {
    setForm((previous) => ({
      ...previous,
      test_cases: [
        ...previous.test_cases,
        {
          input_data: '',
          expected_output: '',
          is_sample: false,
        },
      ],
    }))
  }

  function removeTestCase(index) {
    if (form.test_cases.length === 1) {
      return
    }

    setForm((previous) => ({
      ...previous,
      test_cases: previous.test_cases.filter(
        (_, testIndex) =>
          testIndex !== index
      ),
    }))
  }

  async function saveQuestion(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      alert('Please enter a question title.')
      return
    }

    if (!form.description.trim()) {
      alert('Please enter the problem description.')
      return
    }

    const points = Number(form.points)

    if (!points || points <= 0) {
      alert('Points must be greater than 0.')
      return
    }

    const validTestCases =
      form.test_cases.filter(
        (testCase) =>
          testCase.expected_output.trim()
      )

    if (validTestCases.length === 0) {
      alert(
        'Please add at least one test case with expected output.'
      )
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      points,
      input_format:
        form.input_format.trim(),
      output_format:
        form.output_format.trim(),
      constraints:
        form.constraints.trim(),
      starter_code: form.starter_code,
      language: form.language,
      test_cases: validTestCases.map(
        (testCase) => ({
          input_data:
            testCase.input_data,
          expected_output:
            testCase.expected_output.trim(),
          is_sample:
            Boolean(testCase.is_sample),
        })
      ),
    }

    try {
      if (editingId) {
        await apiRequest(
          `/api/trainer/coding-questions/${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        )
      } else {
        await apiRequest(
          `/api/trainer/coding-exams/${examId}/questions`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        )
      }

      closeForm()
      await loadQuestions()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
        'Failed to save coding question.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion(question) {
    const confirmed = window.confirm(
      `Delete "${question.title}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      await apiRequest(
        `/api/trainer/coding-questions/${question.id}`,
        {
          method: 'DELETE',
        }
      )

      await loadQuestions()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
        'Failed to delete coding question.'
      )
    }
  }

  return (
    <div className="trainer-coding-questions-page">

      {/* HEADER */}

      <div className="coding-question-header">

        <div>

          <button
            className="back-button"
            onClick={() =>
              navigate('/trainer/coding-exams')
            }
          >
            ← Back to Coding Exams
          </button>

          <h1>
            {exam?.title || 'Coding Exam'}
          </h1>

          <p>
            Create and manage coding problems
            for this exam.
          </p>

        </div>

        <button
          className="create-question-button"
          onClick={openCreateForm}
        >
          + Add Question
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="coding-question-error">
          {error}
        </div>
      )}


      {/* EXAM SUMMARY */}

      {exam && (
        <div className="coding-question-summary">

          <div>
            <span>Questions</span>
            <strong>{questions.length}</strong>
          </div>

          <div>
            <span>Duration</span>
            <strong>
              {exam.duration} min
            </strong>
          </div>

          <div>
            <span>Total Marks</span>
            <strong>
              {exam.total_marks || 0}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {exam.status || 'draft'}
            </strong>
          </div>

        </div>
      )}


      {/* QUESTION FORM */}

      {showForm && (

        <div className="coding-question-form-card">

          <div className="coding-question-form-header">

            <div>

              <h2>
                {editingId
                  ? 'Edit Coding Question'
                  : 'Add Coding Question'}
              </h2>

              <p>
                Define the problem, starter code,
                and test cases.
              </p>

            </div>

            <button
              className="close-question-form"
              onClick={closeForm}
              disabled={saving}
            >
              ×
            </button>

          </div>


          <form onSubmit={saveQuestion}>

            {/* BASIC INFORMATION */}

            <div className="question-form-grid">

              <div className="question-form-group full">

                <label>
                  Question Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Two Sum"
                  disabled={saving}
                />

              </div>


              <div className="question-form-group">

                <label>
                  Difficulty
                </label>

                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="easy">
                    Easy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="hard">
                    Hard
                  </option>
                </select>

              </div>


              <div className="question-form-group">

                <label>
                  Points
                </label>

                <input
                  type="number"
                  name="points"
                  min="1"
                  value={form.points}
                  onChange={handleChange}
                  disabled={saving}
                />

              </div>


              <div className="question-form-group">

                <label>
                  Language
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="python">
                    Python
                  </option>

                  <option value="javascript">
                    JavaScript
                  </option>

                  <option value="java">
                    Java
                  </option>

                  <option value="cpp">
                    C++
                  </option>

                  <option value="c">
                    C
                  </option>
                </select>

              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="question-form-group">

              <label>
                Problem Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the problem clearly..."
                rows="7"
                disabled={saving}
              />

            </div>


            {/* INPUT / OUTPUT */}

            <div className="question-form-grid">

              <div className="question-form-group">

                <label>
                  Input Format
                </label>

                <textarea
                  name="input_format"
                  value={form.input_format}
                  onChange={handleChange}
                  placeholder="Describe the input..."
                  rows="5"
                  disabled={saving}
                />

              </div>


              <div className="question-form-group">

                <label>
                  Output Format
                </label>

                <textarea
                  name="output_format"
                  value={form.output_format}
                  onChange={handleChange}
                  placeholder="Describe the expected output..."
                  rows="5"
                  disabled={saving}
                />

              </div>

            </div>


            {/* CONSTRAINTS */}

            <div className="question-form-group">

              <label>
                Constraints
              </label>

              <textarea
                name="constraints"
                value={form.constraints}
                onChange={handleChange}
                placeholder="Example: 1 <= nums.length <= 10^5"
                rows="5"
                disabled={saving}
              />

            </div>


            {/* STARTER CODE */}

            <div className="question-form-group">

              <label>
                Starter Code
              </label>

              <textarea
                className="starter-code-input"
                name="starter_code"
                value={form.starter_code}
                onChange={handleChange}
                placeholder={`def two_sum(nums, target):
    # Write your solution here
    pass`}
                rows="10"
                disabled={saving}
              />

            </div>


            {/* TEST CASES */}

            <div className="test-cases-section">

              <div className="test-cases-header">

                <div>

                  <h3>
                    Test Cases
                  </h3>

                  <p>
                    Add inputs and the expected
                    outputs used to evaluate submissions.
                  </p>

                </div>

                <button
                  type="button"
                  className="add-test-case-button"
                  onClick={addTestCase}
                  disabled={saving}
                >
                  + Add Test Case
                </button>

              </div>


              {form.test_cases.map(
                (testCase, index) => (

                  <div
                    className="test-case-editor"
                    key={index}
                  >

                    <div className="test-case-editor-top">

                      <strong>
                        Test Case {index + 1}
                      </strong>

                      <div>

                        <label className="sample-checkbox">

                          <input
                            type="checkbox"
                            checked={
                              testCase.is_sample
                            }
                            onChange={() =>
                              toggleSample(index)
                            }
                            disabled={saving}
                          />

                          Sample

                        </label>

                        {form.test_cases.length >
                          1 && (

                          <button
                            type="button"
                            className="remove-test-case"
                            onClick={() =>
                              removeTestCase(index)
                            }
                            disabled={saving}
                          >
                            Remove
                          </button>

                        )}

                      </div>

                    </div>


                    <div className="test-case-grid">

                      <div className="question-form-group">

                        <label>
                          Input
                        </label>

                        <textarea
                          value={
                            testCase.input_data
                          }
                          onChange={(event) =>
                            handleTestCaseChange(
                              index,
                              'input_data',
                              event.target.value
                            )
                          }
                          placeholder="2 7 11 15
9"
                          rows="5"
                          disabled={saving}
                        />

                      </div>


                      <div className="question-form-group">

                        <label>
                          Expected Output
                        </label>

                        <textarea
                          value={
                            testCase.expected_output
                          }
                          onChange={(event) =>
                            handleTestCaseChange(
                              index,
                              'expected_output',
                              event.target.value
                            )
                          }
                          placeholder="0 1"
                          rows="5"
                          disabled={saving}
                        />

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>


            {/* FORM ACTIONS */}

            <div className="question-form-actions">

              <button
                type="button"
                className="question-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="question-save-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Question'
                    : 'Create Question'}
              </button>

            </div>

          </form>

        </div>

      )}


      {/* QUESTIONS */}

      {!showForm && (

        <div className="coding-questions-list">

          {loading ? (

            <div className="questions-empty-state">
              <div className="questions-empty-icon">
                ⏳
              </div>

              <h3>
                Loading questions...
              </h3>

              <p>
                Please wait.
              </p>
            </div>

          ) : questions.length === 0 ? (

            <div className="questions-empty-state">

              <div className="questions-empty-icon">
                💻
              </div>

              <h3>
                No questions yet
              </h3>

              <p>
                Add your first coding problem
                to this exam.
              </p>

              <button
                className="create-question-button"
                onClick={openCreateForm}
              >
                + Add Question
              </button>

            </div>

          ) : (

            questions.map(
              (question, index) => (

                <div
                  className="coding-question-card"
                  key={question.id}
                >

                  <div className="coding-question-card-top">

                    <div className="question-number">
                      {index + 1}
                    </div>

                    <div className="question-card-main">

                      <div className="question-card-title-row">

                        <h3>
                          {question.title}
                        </h3>

                        <span
                          className={`difficulty-badge ${question.difficulty}`}
                        >
                          {question.difficulty}
                        </span>

                      </div>

                      <p>
                        {question.description}
                      </p>

                      <div className="question-card-meta">

                        <span>
                          {question.points} points
                        </span>

                        <span>
                          {question.language}
                        </span>

                        <span>
                          {question.test_cases?.length ||
                            0}{' '}
                          test cases
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="question-card-actions">

                    <button
                      className="edit-question-button"
                      onClick={() =>
                        openEditForm(question)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-question-button"
                      onClick={() =>
                        deleteQuestion(question)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      )}

    </div>
  )
}
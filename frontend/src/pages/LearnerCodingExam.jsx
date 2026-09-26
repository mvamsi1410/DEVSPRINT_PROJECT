import { useEffect, 
    useMemo, 
    useRef,
    useState 
} from "react";
import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { apiRequest } from "../services/api";
import "./LearnerCodingExam.css";

function LearnerCodingExam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  // ========================================================
  // EXAM STATE
  // ========================================================

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ========================================================
  // CODE STATE
  // ========================================================

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  // ========================================================
  // TERMINAL STATE
  // ========================================================

  const [activeTab, setActiveTab] = useState("test");
  const [output, setOutput] = useState("");

  // ========================================================
  // UI STATE
  // ========================================================

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [error, setError] = useState("");

  // ========================================================
  // TIMER STATE
  // ========================================================

  const [examStarted, setExamStarted] = useState(false);
  const [examExpired, setExamExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
    // ========================================================
  // PROCTORING / MONITORING STATE
  // ========================================================

  const [monitoringSession, setMonitoringSession] =
    useState(null);

  const [monitoringError, setMonitoringError] =
    useState("");

  const [startingExam, setStartingExam] =
    useState(false);

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [microphoneEnabled, setMicrophoneEnabled] =
    useState(false);

  const [showMonitoringInstructions, setShowMonitoringInstructions] =
    useState(false);

  const mediaStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const [faceDetectorReady, setFaceDetectorReady] =
  useState(false);

  const faceDetectionIntervalRef =
    useRef(null);

  const noFaceSinceRef =
    useRef(null);

  const warningCooldownRef =
    useRef(0);
  const restoringMonitoringRef =
  useRef(false);

  const warningCountRef =
  useRef(0);

  const [warningCount, setWarningCount] =
    useState(0);

  const screenshotTimeoutRef =
  useRef(null);
 
  const [faceDetected, setFaceDetected] =
    useState(true);

  const [monitoringMessage, setMonitoringMessage] =
    useState("");

  // ========================================================
  // CURRENT QUESTION
  // ========================================================

  const currentQuestion =
    questions[currentIndex] || null;

  // ========================================================
  // TIMER KEY
  // ========================================================

  function getTimerKey(id) {
    return `coding_exam_end_time_${id}`;
  }

  // ========================================================
  // LOAD EXAM
  // ========================================================

  useEffect(() => {
    loadExam();
  }, [examId]);

  async function loadExam() {
    setLoading(true);
    setError("");

    try {
      let selectedExamId = examId;

      // ----------------------------------------------------
      // LOAD AVAILABLE EXAM IF NO ID IN URL
      // ----------------------------------------------------

      if (!selectedExamId) {
        const examListData =
          await apiRequest(
            "/api/learner/coding-exams"
          );

        const availableExams =
          examListData?.exams || [];

        if (availableExams.length === 0) {
          throw new Error(
            "No coding exams are currently available."
          );
        }

        selectedExamId =
          availableExams[0].id;
      }

      // ----------------------------------------------------
      // LOAD COMPLETE EXAM
      // ----------------------------------------------------

      const data =
        await apiRequest(
          `/api/learner/coding-exams/${selectedExamId}`
        );

      // ----------------------------------------------------
      // CHECK EXISTING RESULT
      // ----------------------------------------------------

      try {
        const resultData =
          await apiRequest(
            `/api/learner/coding-exams/${selectedExamId}/result`
          );

        // --------------------------------------------------
        // COMPLETED EXAM
        // --------------------------------------------------

        if (resultData?.completed) {
          setExamCompleted(true);
          setSubmitted(true);
          setExamResult(resultData);

          setExam(
            resultData.exam || null
          );

          setQuestions(
            resultData.questions || []
          );

          setCurrentIndex(0);

          setExamStarted(false);
          setExamExpired(false);
          setTimeLeft(0);

          localStorage.removeItem(
            getTimerKey(selectedExamId)
          );

          return;
        }

        // --------------------------------------------------
        // NOT COMPLETED
        // --------------------------------------------------

        setExamCompleted(false);
        setExamResult(null);

      } catch (resultError) {
        console.log(
          "No completed result:",
          resultError
        );

        setExamCompleted(false);
        setExamResult(null);
      }

      // ----------------------------------------------------
      // LOAD EXAM DATA
      // ----------------------------------------------------

      const loadedExam =
        data?.exam || null;

      const loadedQuestions =
        data?.questions || [];

      setExam(loadedExam);
      setQuestions(loadedQuestions);
      setCurrentIndex(0);

      setSubmitted(false);
      setOutput("");
      setActiveTab("test");

      // ----------------------------------------------------
      // TIMER
      // ----------------------------------------------------

      if (loadedExam) {
        const timerKey =
          getTimerKey(loadedExam.id);

        const savedEndTime =
          localStorage.getItem(timerKey);

        if (savedEndTime) {
          const endTime =
            Number(savedEndTime);

          const remaining =
            Math.max(
              0,
              Math.ceil(
                (endTime - Date.now()) /
                  1000
              )
            );

          if (remaining > 0) {
            setExamStarted(true);
            setExamExpired(false);
            setTimeLeft(remaining);
          } else {
            setExamStarted(true);
            setExamExpired(true);
            setTimeLeft(0);
          }
        } else {
          setExamStarted(false);
          setExamExpired(false);

          setTimeLeft(
            Number(
              loadedExam.duration || 60
            ) * 60
          );
        }
      }

      // ----------------------------------------------------
      // FIRST QUESTION
      // ----------------------------------------------------

      if (loadedQuestions.length > 0) {
        const firstQuestion =
          loadedQuestions[0];

        setCode(
          firstQuestion.starter_code || ""
        );

        setLanguage(
          firstQuestion.language ||
            "python"
        );
      } else {
        setCode("");
        setLanguage("python");
      }

    } catch (err) {
      console.error(
        "Failed to load coding exam:",
        err
      );

      setError(
        err?.message ||
          "Failed to load the coding exam."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // START EXAM
  // ========================================================

    async function startExam() {
    if (
      examCompleted ||
      !exam ||
      questions.length === 0 ||
      startingExam
    ) {
      return;
    }

    setStartingExam(true);
    setMonitoringError("");

    let stream = null;

    try {
      // ----------------------------------------------------
      // REQUEST CAMERA + MICROPHONE PERMISSION
      // ----------------------------------------------------

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera and microphone access is not supported by this browser."
        );
      }

      stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      const videoTracks =
        stream.getVideoTracks();

      const audioTracks =
        stream.getAudioTracks();

      const cameraIsEnabled =
        videoTracks.length > 0 &&
        videoTracks.some(
          (track) =>
            track.readyState === "live"
        );

      const microphoneIsEnabled =
        audioTracks.length > 0 &&
        audioTracks.some(
          (track) =>
            track.readyState === "live"
        );

      if (!cameraIsEnabled) {
        throw new Error(
          "Camera access is required to start the monitored exam."
        );
      }

      if (!microphoneIsEnabled) {
        throw new Error(
          "Microphone access is required to start the monitored exam."
        );
      }

      mediaStreamRef.current = stream;

      setCameraEnabled(true);
      setMicrophoneEnabled(true);

      // ----------------------------------------------------
      // CREATE BACKEND MONITORING SESSION
      // ----------------------------------------------------

      const sessionResponse =
        await apiRequest(
          `/api/learner/coding-exams/${exam.id}/session/start`,
          {
            method: "POST",

            body: JSON.stringify({
              camera_enabled: true,
              microphone_enabled: true,
            }),
          }
        );

      const session =
        sessionResponse?.session;

      if (!session?.id) {
        throw new Error(
          "Unable to create the exam monitoring session."
        );
      }

      setMonitoringSession(session);

      // ----------------------------------------------------
      // START EXISTING EXAM TIMER
      // ----------------------------------------------------

      const durationSeconds =
        Number(exam.duration || 60) * 60;

      const endTime =
        Date.now() +
        durationSeconds * 1000;

      localStorage.setItem(
        getTimerKey(exam.id),
        String(endTime)
      );

      setExamStarted(true);
      setExamExpired(false);
      setSubmitted(false);
      setOutput("");
      setActiveTab("test");
      setTimeLeft(durationSeconds);

    } catch (err) {
      console.error(
        "Unable to start monitored coding exam:",
        err
      );

      // Stop any stream that may have been
      // partially created.
      if (stream) {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      mediaStreamRef.current = null;

      setCameraEnabled(false);
      setMicrophoneEnabled(false);
      setMonitoringSession(null);

      setMonitoringError(
        err?.message ||
          "Camera and microphone permission are required to start the exam."
      );

    } finally {
      setStartingExam(false);
    }
  }

  // ========================================================
  // START NEW ATTEMPT
  // ========================================================

  function restartExam() {
    if (
      !exam ||
      examCompleted
    ) {
      return;
    }

    localStorage.removeItem(
      getTimerKey(exam.id)
    );

    setExamStarted(false);
    setExamExpired(false);
    setSubmitted(false);
    setOutput("");
    setActiveTab("test");
    setCurrentIndex(0);

    if (questions.length > 0) {
      const firstQuestion =
        questions[0];

      setCode(
        firstQuestion.starter_code || ""
      );

      setLanguage(
        firstQuestion.language ||
          "python"
      );
    }

    setTimeLeft(
      Number(exam.duration || 60) * 60
    );
  }


     // ========================================================
  // RESTORE MONITORING AFTER PAGE RELOAD
  // ========================================================

  async function restoreMonitoringAfterReload() {
    if (
      restoringMonitoringRef.current
    ) {
      console.log(
        "Monitoring restoration is already running."
      );

      return;
    }

    if (
      !exam ||
      examCompleted ||
      examExpired
    ) {
      console.log(
        "Cannot restore monitoring: exam is not active."
      );

      return;
    }

    if (
      monitoringSession?.id
    ) {
      console.log(
        "Monitoring session already exists:",
        monitoringSession.id
      );

      return;
    }

    restoringMonitoringRef.current =
      true;

    console.log(
      "========================================"
    );

    console.log(
      "RESTORING MONITORING AFTER RELOAD"
    );

    console.log(
      "Exam ID:",
      exam.id
    );

    console.log(
      "========================================"
    );

    setMonitoringError("");

    setMonitoringMessage(
      "Restoring camera and microphone..."
    );

    let stream = null;

    try {
      // ====================================================
      // REQUEST CAMERA + MICROPHONE
      // ====================================================

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera and microphone access are not supported by this browser."
        );
      }

      console.log(
        "Requesting camera and microphone..."
      );

      stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true,
          }
        );

      console.log(
        "Camera and microphone permission granted."
      );

      // ====================================================
      // CHECK VIDEO TRACK
      // ====================================================

      const videoTracks =
        stream.getVideoTracks();

      const audioTracks =
        stream.getAudioTracks();

      console.log(
        "Video tracks:",
        videoTracks
      );

      console.log(
        "Audio tracks:",
        audioTracks
      );

      const cameraIsEnabled =
        videoTracks.length >
          0 &&
        videoTracks.some(
          (track) =>
            track.readyState ===
            "live"
        );

      const microphoneIsEnabled =
        audioTracks.length >
          0 &&
        audioTracks.some(
          (track) =>
            track.readyState ===
            "live"
        );

      if (
        !cameraIsEnabled
      ) {
        throw new Error(
          "Camera access is required to continue the monitored exam."
        );
      }

      if (
        !microphoneIsEnabled
      ) {
        throw new Error(
          "Microphone access is required to continue the monitored exam."
        );
      }

      // ====================================================
      // STORE MEDIA STREAM
      // ====================================================

      mediaStreamRef.current =
        stream;

      setCameraEnabled(
        true
      );

      setMicrophoneEnabled(
        true
      );

      // ====================================================
      // CONNECT CAMERA IMMEDIATELY
      // ====================================================

      if (
        cameraVideoRef.current
      ) {
        cameraVideoRef.current.srcObject =
          stream;

        try {
          await cameraVideoRef.current.play();

          console.log(
            "Camera preview started after reload."
          );
        } catch (
          videoError
        ) {
          console.warn(
            "Camera preview play failed:",
            videoError
          );
        }
      }

      // ====================================================
      // CREATE NEW MONITORING SESSION
      // ====================================================

      console.log(
        "Creating new monitoring session..."
      );

      const sessionResponse =
        await apiRequest(
          `/api/learner/coding-exams/${exam.id}/session/start`,
          {
            method: "POST",

            body: JSON.stringify(
              {
                camera_enabled:
                  true,

                microphone_enabled:
                  true,
              }
            ),
          }
        );

      console.log(
        "Monitoring session response:",
        sessionResponse
      );

      const session =
        sessionResponse?.session;

      if (
        !session?.id
      ) {
        throw new Error(
          "Backend did not return a monitoring session."
        );
      }

      // ====================================================
      // STORE SESSION
      // ====================================================

      setMonitoringSession(
        session
      );

      setWarningCount(
        0
      );

      warningCountRef.current =
        0;

      noFaceSinceRef.current =
        null;

      warningCooldownRef.current =
        0;

      setFaceDetected(
        true
      );

      setMonitoringMessage(
        "Monitoring restored. Please keep your face visible."
      );

      console.log(
        "========================================"
      );

      console.log(
        "MONITORING RESTORED SUCCESSFULLY"
      );

      console.log(
        "Session ID:",
        session.id
      );

      console.log(
        "========================================"
      );

    } catch (
      error
    ) {
      console.error(
        "FAILED TO RESTORE MONITORING:",
        error
      );

      // ====================================================
      // CLEAN UP FAILED STREAM
      // ====================================================

      if (
        stream
      ) {
        stream
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );
      }

      mediaStreamRef.current =
        null;

      setCameraEnabled(
        false
      );

      setMicrophoneEnabled(
        false
      );

      setMonitoringSession(
        null
      );

      setMonitoringError(
        error?.message ||
          "Unable to restore camera and microphone monitoring."
      );

      setMonitoringMessage(
        "Monitoring could not be restored."
      );

    } finally {
      restoringMonitoringRef.current =
        false;
    }
  }

    // ========================================================
  // AUTOMATICALLY RESTORE MONITORING AFTER RELOAD
  // ========================================================

  useEffect(() => {
    if (
      !examStarted
    ) {
      return;
    }

    if (
      examCompleted ||
      examExpired
    ) {
      return;
    }

    if (
      !exam?.id
    ) {
      return;
    }

    if (
      monitoringSession?.id
    ) {
      console.log(
        "Monitoring session already available:",
        monitoringSession.id
      );

      return;
    }

    console.log(
      "Exam is active but monitoring session is missing."
    );

    console.log(
      "Starting monitoring restoration..."
    );

    restoreMonitoringAfterReload();

  }, [
    examStarted,
    examCompleted,
    examExpired,
    exam?.id,
    monitoringSession?.id,
  ]);
    // ========================================================
  // CONNECT CAMERA STREAM TO VIDEO PREVIEW
  // ========================================================

  useEffect(() => {
    if (
      !examStarted
    ) {
      return;
    }

    const stream =
      mediaStreamRef.current;

    const video =
      cameraVideoRef.current;

    if (
      !stream ||
      !video
    ) {
      console.log(
        "Camera preview waiting for media stream..."
      );

      return;
    }

    console.log(
      "Connecting camera stream to preview..."
    );

    video.srcObject =
      stream;

    const startVideo =
      async () => {
        try {
          await video.play();

          console.log(
            "Camera preview is playing."
          );
        } catch (
          error
        ) {
          console.warn(
            "Camera preview could not play:",
            error
          );
        }
      };

    startVideo();

  }, [
    examStarted,
    monitoringSession?.id,
  ]);

// ========================================================
// INITIALIZE FACE DETECTOR
// ========================================================

useEffect(() => {
  let cancelled = false;

  async function initializeFaceDetector() {
    try {
      console.log("Starting face detector initialization...");

      const vision =
        await FilesetResolver.forVisionTasks(
         "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

      console.log("MediaPipe vision loaded.");

      const detector =
        await FaceDetector.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          }
        );

      if (!cancelled) {
        faceDetectorRef.current = detector;

        setFaceDetectorReady(true);

        console.log(
          "Face detector is READY."
        );
      }
    } catch (error) {
      console.error(
        "Failed to initialize face detector:",
        error
      );

      if (!cancelled) {
        setFaceDetectorReady(false);

        setMonitoringMessage(
          "Face detection could not be initialized."
        );
      }
    }
  }

  initializeFaceDetector();

  return () => {
    cancelled = true;

    if (faceDetectorRef.current) {
      faceDetectorRef.current.close();
      faceDetectorRef.current = null;
    }

    setFaceDetectorReady(false);
  };
}, []);

  // ========================================================
  // CONTINUOUS FACE MONITORING
  // ========================================================

  useEffect(() => {
    let stopped = false;
    let intervalId = null;

    console.log(
      "Face monitoring effect:",
      {
        examStarted,
        examExpired,
        examCompleted,
        sessionId:
          monitoringSession?.id,
        detectorReady:
          faceDetectorReady,
        detectorExists:
          !!faceDetectorRef.current,
        videoExists:
          !!cameraVideoRef.current,
      }
    );

    if (
      !examStarted ||
      examExpired ||
      examCompleted
    ) {
      console.log(
        "Face monitoring not started: exam is not active."
      );

      return;
    }

    if (
      !monitoringSession?.id
    ) {
      console.log(
        "Face monitoring waiting for monitoring session..."
      );

      return;
    }

    if (
      !faceDetectorReady ||
      !faceDetectorRef.current
    ) {
      console.log(
        "Face monitoring waiting for face detector..."
      );

      return;
    }

    console.log(
      "Starting continuous face monitoring."
    );

    warningCountRef.current =
      warningCount;

    let checkingFace = false;

    // ------------------------------------------------------
    // CHECK FACE
    // ------------------------------------------------------

    const checkFace =
      async () => {
        if (
          stopped ||
          checkingFace
        ) {
          return;
        }

        const video =
          cameraVideoRef.current;

        const detector =
          faceDetectorRef.current;

        if (
          !video ||
          !detector
        ) {
          return;
        }

        if (
          video.readyState <
          HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          console.log(
            "Waiting for camera video data..."
          );

          return;
        }

        checkingFace = true;

        try {
          const timestamp =
            performance.now();

          const result =
            detector.detectForVideo(
              video,
              timestamp
            );

          const detections =
            result?.detections ||
            [];

          const hasFace =
            detections.length >
            0;

          // ================================================
          // FACE FOUND
          // ================================================

          if (
            hasFace
          ) {
            setFaceDetected(
              true
            );

            setMonitoringMessage(
              "Face detected."
            );

            noFaceSinceRef.current =
              null;

            return;
          }

          // ================================================
          // FACE NOT FOUND
          // ================================================

          setFaceDetected(
            false
          );

          setMonitoringMessage(
            "Face not detected. Please remain visible to the camera."
          );

          console.log(
            "No face detected."
          );

          if (
            !noFaceSinceRef.current
          ) {
            noFaceSinceRef.current =
              Date.now();

            console.log(
              "Started no-face timer."
            );

            return;
          }

          const missingFor =
            Date.now() -
            noFaceSinceRef.current;

          console.log(
            "Face missing for:",
            Math.round(
              missingFor / 1000
            ),
            "seconds"
          );

          // ================================================
          // 5 SECOND GRACE PERIOD
          // ================================================

          if (
            missingFor <
            5000
          ) {
            return;
          }

          // ================================================
          // THREE WARNING LIMIT
          // ================================================

          if (
            warningCountRef.current >=
            3
          ) {
            setMonitoringMessage(
              "Maximum warnings reached. This attempt has been flagged for trainer review."
            );

            return;
          }

          // ================================================
          // WARNING COOLDOWN
          // ================================================

          if (
            Date.now() <
            warningCooldownRef.current
          ) {
            return;
          }

          warningCooldownRef.current =
            Date.now() +
            15000;

          noFaceSinceRef.current =
            null;

          console.log(
            "Sending face warning to backend..."
          );

          // ================================================
          // SEND WARNING
          // ================================================

          try {
            const response =
              await apiRequest(
                `/api/learner/coding-exams/${exam.id}/session/${monitoringSession.id}/event`,
                {
                  method: "POST",

                  body: JSON.stringify(
                    {
                      event_type:
                        "face_not_detected",

                      message:
                        "Face was not detected by the monitoring camera.",

                      metadata: {
                        missing_for_seconds:
                          Math.round(
                            missingFor /
                              1000
                          ),
                      },
                    }
                  ),
                }
              );

            console.log(
              "Face warning response:",
              response
            );

            const serverWarningCount =
              Number(
                response?.warning_count
              );

            let nextWarningCount;

            if (
              Number.isFinite(
                serverWarningCount
              )
            ) {
              nextWarningCount =
                serverWarningCount;
            } else {
              nextWarningCount =
                warningCountRef.current +
                1;
            }

            nextWarningCount =
              Math.min(
                3,
                nextWarningCount
              );

            warningCountRef.current =
              nextWarningCount;

            setWarningCount(
              nextWarningCount
            );

            if (
              nextWarningCount >=
              3
            ) {
              setMonitoringMessage(
                "Warning 3 of 3: maximum warnings reached. This attempt has been flagged for trainer review."
              );
            } else {
              setMonitoringMessage(
                `Warning ${nextWarningCount} of 3: please keep your face visible to the camera.`
              );
            }

          } catch (
            warningError
          ) {
            console.error(
              "Failed to record face warning:",
              warningError
            );

            setMonitoringMessage(
              "Face was not detected, but the warning could not be recorded."
            );
          }

        } catch (
          detectionError
        ) {
          console.error(
            "Face detection failed:",
            detectionError
          );

          setMonitoringMessage(
            "Face monitoring encountered an error."
          );

        } finally {
          checkingFace =
            false;
        }
      };

    // ------------------------------------------------------
    // RUN FIRST CHECK
    // ------------------------------------------------------

    checkFace();

    // ------------------------------------------------------
    // CHECK EVERY SECOND
    // ------------------------------------------------------

    intervalId =
      setInterval(
        checkFace,
        1000
      );

    // ------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------

    return () => {
      stopped = true;

      if (
        intervalId
      ) {
        clearInterval(
          intervalId
        );

        intervalId =
          null;
      }

      noFaceSinceRef.current =
        null;

      console.log(
        "Continuous face monitoring stopped."
      );
    };

  }, [
    examStarted,
    examExpired,
    examCompleted,
    monitoringSession?.id,
    faceDetectorReady,
    exam?.id,
  ]);


// ========================================================
// RANDOM MONITORING SCREENSHOT
// ========================================================

useEffect(() => {
  if (
    !examStarted ||
    examExpired ||
    examCompleted ||
    !monitoringSession
  ) {
    return;
  }

  let cancelled = false;

  function scheduleNextScreenshot() {
    if (cancelled) {
      return;
    }

    // Random delay between 45 seconds
    // and 120 seconds.
    const minimumDelay = 45000;
    const maximumDelay = 120000;

    const randomDelay =
      Math.floor(
        Math.random() *
          (
            maximumDelay -
            minimumDelay
          )
      ) + minimumDelay;

    screenshotTimeoutRef.current =
      setTimeout(
        captureMonitoringScreenshot,
        randomDelay
      );
  }

  async function captureMonitoringScreenshot() {
    if (
      cancelled ||
      !examStarted ||
      examExpired ||
      examCompleted ||
      !monitoringSession ||
      !cameraVideoRef.current
    ) {
      return;
    }

    const video =
      cameraVideoRef.current;

    // Make sure the camera has a usable frame.
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      scheduleNextScreenshot();
      return;
    }

    try {
      // ----------------------------------------------------
      // CREATE CANVAS
      // ----------------------------------------------------

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const context =
        canvas.getContext("2d");

      if (!context) {
        scheduleNextScreenshot();
        return;
      }

      // ----------------------------------------------------
      // CAPTURE CURRENT CAMERA FRAME
      // ----------------------------------------------------

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // ----------------------------------------------------
      // CONVERT FRAME TO JPEG
      // ----------------------------------------------------

      const blob =
        await new Promise(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.75
            );
          }
        );

      if (!blob) {
        throw new Error(
          "Could not create screenshot."
        );
      }

      // ----------------------------------------------------
      // UPLOAD SCREENSHOT
      // ----------------------------------------------------

      const formData =
        new FormData();

      formData.append(
        "screenshot",
        blob,
        "monitoring.jpg"
      );

      await apiRequest(
        `/api/learner/coding-exams/${exam.id}/session/${monitoringSession.id}/screenshot`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "Random monitoring screenshot captured."
      );
    } catch (error) {
      console.error(
        "Failed to capture monitoring screenshot:",
        error
      );
    }

    // Schedule another random capture.
    scheduleNextScreenshot();
  }

  // Schedule the first random capture.
  scheduleNextScreenshot();

  return () => {
    cancelled = true;

    if (
      screenshotTimeoutRef.current
    ) {
      clearTimeout(
        screenshotTimeoutRef.current
      );

      screenshotTimeoutRef.current =
        null;
    }
  };
}, [
  examStarted,
  examExpired,
  examCompleted,
  monitoringSession,
  exam,
]);

  // ========================================================
  // TIMER
  // ========================================================

  useEffect(() => {
    if (
      !examStarted ||
      examExpired ||
      examCompleted ||
      !exam
    ) {
      return;
    }

    const timerKey =
      getTimerKey(exam.id);

    function updateTimer() {
      const savedEndTime =
        localStorage.getItem(timerKey);

      if (!savedEndTime) {
        return;
      }

      const endTime =
        Number(savedEndTime);

      const remaining =
        Math.max(
          0,
          Math.ceil(
            (endTime - Date.now()) /
              1000
          )
        );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setExamExpired(true);
        setTimeLeft(0);
      }
    }

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        250
      );

    return () => {
      clearInterval(interval);
    };
  }, [
    examStarted,
    examExpired,
    examCompleted,
    exam,
  ]);

  // ========================================================
  // FORMAT TIMER
  // ========================================================

  function formatTime(seconds) {
    const safeSeconds =
      Math.max(
        0,
        Number(seconds) || 0
      );

    const hours =
      Math.floor(
        safeSeconds / 3600
      );

    const minutes =
      Math.floor(
        (safeSeconds % 3600) / 60
      );

    const remainingSeconds =
      safeSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(
        remainingSeconds
      ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  // ========================================================
  // SELECT QUESTION
  // ========================================================

  function selectQuestion(
    question,
    index
  ) {
    if (
      examExpired ||
      !examStarted ||
      examCompleted
    ) {
      return;
    }

    setCurrentIndex(index);

    setCode(
      question.starter_code || ""
    );

    setLanguage(
      question.language || "python"
    );

    setOutput("");
    setActiveTab("test");
    setSubmitted(false);
  }

  // ========================================================
  // RESET CODE
  // ========================================================

  function resetCode() {
    if (
      !currentQuestion ||
      examCompleted ||
      examExpired
    ) {
      return;
    }

    setCode(
      currentQuestion.starter_code || ""
    );

    setOutput("");
    setActiveTab("test");
    setSubmitted(false);
  }

  // ========================================================
  // RUN CODE
  // ========================================================

  async function handleRunCode() {
    if (
      !currentQuestion ||
      examExpired ||
      examCompleted ||
      !examStarted ||
      running
    ) {
      return;
    }

    if (!code.trim()) {
      setActiveTab("output");

      setOutput(
        "No code was provided.\n\n" +
          "Write your solution in the editor and try again."
      );

      return;
    }

    setRunning(true);
    setActiveTab("output");

    setOutput(
      "Running your code..."
    );

    try {
      const inputData =
        sampleTestCases.length > 0
          ? sampleTestCases[0]
              ?.input_data || ""
          : "";

      const response =
        await apiRequest(
          "/api/learner/coding-exams/run-code",
          {
            method: "POST",

            body: JSON.stringify({
              code,
              language,
              input_data: inputData,
              exam_id: exam.id,
              question_id:
                currentQuestion.id,
            }),
          }
        );

      const status =
        response?.status || "error";

      const stdout =
        response?.stdout || "";

      const stderr =
        response?.stderr || "";

      const executionTime =
        response?.execution_time ?? 0;

      if (status === "success") {
        setOutput(
          "✓ Execution Successful\n\n" +
            "Your Output:\n" +
            `${stdout || "(no output)"}\n\n` +
            `Execution time: ${executionTime}s`
        );

        return;
      }

      if (status === "empty") {
        setOutput(
          "No code was provided.\n\n" +
            "Write your solution in the editor and try again."
        );

        return;
      }

      if (
        status ===
        "time_limit_exceeded"
      ) {
        setOutput(
          "⏱ Time Limit Exceeded\n\n" +
            `${stderr}`
        );

        return;
      }

      if (
        status === "runtime_error"
      ) {
        setOutput(
          "✕ Runtime Error\n\n" +
            `${
              stderr ||
              "Your program terminated with an error."
            }`
        );

        return;
      }

      setOutput(
        "✕ Execution Error\n\n" +
          `${
            stderr ||
            "Unable to execute the code."
          }`
      );

    } catch (err) {
      console.error(
        "Run code error:",
        err
      );

      setOutput(
        "✕ Unable to run code\n\n" +
          `${
            err?.message ||
            "The code execution service is unavailable."
          }`
      );
    } finally {
      setRunning(false);
    }
  }

  // ========================================================
  // SUBMIT CODE
  // ========================================================

  async function handleSubmit() {
    if (
      !currentQuestion ||
      examExpired ||
      examCompleted ||
      !examStarted ||
      running
    ) {
      return;
    }

    if (!code.trim()) {
      setActiveTab("output");

      setOutput(
        "Cannot submit empty code.\n\n" +
          "Write your solution before submitting."
      );

      return;
    }

    setRunning(true);
    setActiveTab("output");

    setOutput(
      "Submitting your code...\n\n" +
        "Running all test cases..."
    );

    try {
      const response =
        await apiRequest(
          "/api/learner/coding-exams/submit-code",
          {
            method: "POST",

            body: JSON.stringify({
              exam_id: exam.id,
              question_id:
                currentQuestion.id,
              language,
              code,
            }),
          }
        );

      const submission =
        response?.submission || {};

      const results =
        response?.results || [];

      let resultText = "";

      if (
        submission.status ===
        "accepted"
      ) {
        resultText +=
          "✓ Accepted\n\n";
      } else if (
        submission.status ===
        "partial"
      ) {
        resultText +=
          "⚠ Partially Accepted\n\n";
      } else {
        resultText +=
          "✕ Failed\n\n";
      }

      resultText +=
        `Score: ${
          submission.score ?? 0
        }\n`;

      resultText +=
        `Passed: ${
          submission.passed_tests ?? 0
        } / ${
          submission.total_tests ?? 0
        }\n`;

      resultText +=
        `Execution time: ${
          submission.execution_time ?? 0
        }s\n\n`;

      resultText +=
        "Test Results\n";

      resultText +=
        "────────────────────────\n\n";

      results.forEach(
        (testResult) => {
          const testNumber =
            testResult.test_case;

          const status =
            testResult.status;

          if (
            status === "passed"
          ) {
            resultText +=
              `✓ Test Case ${testNumber}: Passed\n`;
          } else if (
            status === "failed"
          ) {
            resultText +=
              `✕ Test Case ${testNumber}: Failed\n`;
          } else {
            resultText +=
              `• Test Case ${testNumber}: Not Run\n`;
          }

          if (
            testResult.is_sample
          ) {
            if (
              testResult.input !==
                null &&
              testResult.input !==
                undefined
            ) {
              resultText +=
                `  Input: ${
                  testResult.input ||
                  "(empty)"
                }\n`;
            }

            if (
              testResult.expected_output !==
                null &&
              testResult.expected_output !==
                undefined
            ) {
              resultText +=
                `  Expected: ${
                  testResult.expected_output ||
                  "(empty)"
                }\n`;
            }

            if (
              testResult.actual_output !==
                null &&
              testResult.actual_output !==
                undefined
            ) {
              resultText +=
                `  Your Output: ${
                  testResult.actual_output ||
                  "(empty)"
                }\n`;
            }
          }

          if (
            testResult.error
          ) {
            resultText +=
              `  Error: ${testResult.error}\n`;
          }

          resultText += "\n";
        }
      );

      setOutput(resultText);
      setSubmitted(true);

    } catch (err) {
      console.error(
        "Submit code error:",
        err
      );

      setOutput(
        "✕ Submission Failed\n\n" +
          `${
            err?.message ||
            "Unable to submit your code."
          }`
      );

      setSubmitted(false);

    } finally {
      setRunning(false);
    }
  }

  // ========================================================
  // SUBMIT ENTIRE EXAM
  // ========================================================

  async function handleSubmitExam() {
    if (
      !exam ||
      examExpired ||
      examCompleted ||
      running
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to submit this exam?"
      );

    if (!confirmed) {
      return;
    }

    setRunning(true);
    setActiveTab("output");

    setOutput(
      "Checking your exam...\n\n" +
        "Please wait."
    );

    try {
      const resultData =
        await apiRequest(
          `/api/learner/coding-exams/${exam.id}/result`
        );

      const result =
        resultData?.result || {};

      const answeredQuestions =
        Number(
          result.answered_questions || 0
        );

      const totalExamQuestions =
        Number(
          result.total_questions ||
            questions.length
        );

      if (
        !resultData?.completed
      ) {
        const remaining =
          Math.max(
            0,
            totalExamQuestions -
              answeredQuestions
          );

        setOutput(
          "⚠ Exam cannot be completed yet.\n\n" +
            `Submitted questions: ${answeredQuestions} / ${totalExamQuestions}\n` +
            `Remaining questions: ${remaining}\n\n` +
            "Please submit your code for every question before submitting the entire exam."
        );

        setRunning(false);
        return;
      }

      // ----------------------------------------------------
      // GET FRESH COMPLETE RESULT
      // ----------------------------------------------------

      const freshResult =
        await apiRequest(
          `/api/learner/coding-exams/${exam.id}/result`
        );

      setExamCompleted(true);
      setSubmitted(true);
      setExamResult(freshResult);

      setExamStarted(false);
      setExamExpired(false);
      setTimeLeft(0);

      localStorage.removeItem(
        getTimerKey(exam.id)
      );

      setOutput(
        "Exam completed successfully."
      );

    } catch (err) {
      console.error(
        "Submit exam error:",
        err
      );

      setOutput(
        "✕ Unable to complete the exam\n\n" +
          `${
            err?.message ||
            "Unable to retrieve the exam result."
          }`
      );
    } finally {
      setRunning(false);
    }
  }

  // ========================================================
  // DERIVED VALUES
  // ========================================================

  const totalQuestions =
    questions.length;

  const progress =
    totalQuestions > 0
      ? ((currentIndex + 1) /
          totalQuestions) *
        100
      : 0;

  const sampleTestCases =
    useMemo(() => {
      if (!currentQuestion) {
        return [];
      }

      return (
        currentQuestion.test_cases?.filter(
          (testCase) =>
            testCase.is_sample
        ) || []
      );
    }, [currentQuestion]);

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "18px",
          }}
        >
          Loading coding exam...
        </div>

      </div>
    );
  }

  // ========================================================
  // ERROR
  // ========================================================

  if (error) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            color: "white",
            padding: "30px",
            textAlign: "center",
          }}
        >

          <h2>
            Unable to load coding exam
          </h2>

          <p>{error}</p>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >

            <button
              onClick={loadExam}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>

            <button
              onClick={() =>
                navigate("/exams")
              }
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to Exams
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ========================================================
  // NO EXAM
  // ========================================================

  if (!exam) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            color: "white",
          }}
        >

          <h2>
            No coding exam available
          </h2>

          <p>
            There are currently no
            published coding exams
            available for you.
          </p>

          <button
            onClick={() =>
              navigate("/exams")
            }
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Exams
          </button>

        </div>

      </div>
    );
  }

  // ========================================================
  // COMPLETED / RESULT SCREEN
  // ========================================================

  if (
    examCompleted &&
    examResult
  ) {
    const result =
      examResult.result || {};

    const resultQuestions =
      examResult.questions || [];

    const score =
      Number(result.score || 0);

    const totalMarks =
      Number(
        result.total_marks || 0
      );

    const percentage =
      Number(
        result.percentage || 0
      );

    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            padding: "40px 20px 60px",
            color: "white",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "950px",
              margin: "0 auto",
            }}
          >

            {/* ==================================================
                COMPLETED HEADER
            ================================================== */}

            <div
              style={{
                background: "#111827",
                border:
                  "1px solid #263244",
                borderRadius: "18px",
                padding: "40px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >

              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "50%",
                  background:
                    "rgba(34,197,94,0.15)",
                  border:
                    "2px solid #22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin:
                    "0 auto 20px",
                  fontSize: "36px",
                }}
              >
                ✓
              </div>

              <h1
                style={{
                  margin:
                    "0 0 10px",
                }}
              >
                Exam Completed
              </h1>

              <p
                style={{
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {exam.title}
              </p>

              {examResult.completed_at && (
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginTop: "10px",
                  }}
                >
                  Completed:{" "}
                  {new Date(
                    examResult.completed_at
                  ).toLocaleString()}
                </p>
              )}

            </div>

            {/* ==================================================
                FINAL RESULT
            ================================================== */}

            <div
              style={{
                background: "#111827",
                border:
                  "1px solid #263244",
                borderRadius: "16px",
                padding: "30px",
                marginBottom: "24px",
              }}
            >

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "24px",
                }}
              >
                Your Result
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius: "12px",
                    padding: "22px",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "13px",
                      marginBottom: "8px",
                    }}
                  >
                    Score
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "700",
                    }}
                  >
                    {score} / {totalMarks}
                  </div>
                </div>

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius: "12px",
                    padding: "22px",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "13px",
                      marginBottom: "8px",
                    }}
                  >
                    Percentage
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "700",
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius: "12px",
                    padding: "22px",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "13px",
                      marginBottom: "8px",
                    }}
                  >
                    Questions
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "700",
                    }}
                  >
                    {result.answered_questions ?? 0}
                    {" / "}
                    {result.total_questions ??
                      totalQuestions}
                  </div>
                </div>

              </div>

            </div>

            {/* ==================================================
                QUESTION RESULTS
            ================================================== */}

            <div
              style={{
                background: "#111827",
                border:
                  "1px solid #263244",
                borderRadius: "16px",
                padding: "30px",
                marginBottom: "24px",
              }}
            >

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Question Results
              </h2>

              {resultQuestions.length === 0 ? (

                <p
                  style={{
                    color: "#9ca3af",
                  }}
                >
                  No question results available.
                </p>

              ) : (

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >

                  {resultQuestions.map(
                    (question, index) => {

                      const status =
                        question.status ||
                        "not_submitted";

                      let statusText =
                        "Not Submitted";

                      let statusColor =
                        "#9ca3af";

                      if (
                        status === "accepted"
                      ) {
                        statusText =
                          "✓ Accepted";

                        statusColor =
                          "#22c55e";

                      } else if (
                        status === "partial"
                      ) {
                        statusText =
                          "⚠ Partially Accepted";

                        statusColor =
                          "#f59e0b";

                      } else if (
                        status === "failed"
                      ) {
                        statusText =
                          "✕ Failed";

                        statusColor =
                          "#ef4444";
                      }

                      return (
                        <div
                          key={
                            question.question_id ||
                            index
                          }
                          style={{
                            background:
                              "#0f172a",
                            border:
                              "1px solid #263244",
                            borderRadius:
                              "14px",
                            padding: "22px",
                          }}
                        >

                          {/* QUESTION HEADER */}

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              gap: "20px",
                              marginBottom:
                                "18px",
                            }}
                          >

                            <div>

                              <div
                                style={{
                                  fontSize:
                                    "18px",
                                  fontWeight:
                                    "700",
                                  marginBottom:
                                    "8px",
                                }}
                              >
                                Question{" "}
                                {index + 1}
                                {" — "}
                                {
                                  question.question_title ||
                                  question.title ||
                                  `Question ${
                                    index + 1
                                  }`
                                }
                              </div>

                              <div
                                style={{
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                {question.difficulty ||
                                  "medium"}
                                {" • "}
                                {question.points ||
                                  0}
                                {" points"}
                              </div>

                            </div>

                            <div
                              style={{
                                textAlign:
                                  "right",
                                flexShrink: 0,
                              }}
                            >

                              <div
                                style={{
                                  fontSize:
                                    "18px",
                                  fontWeight:
                                    "700",
                                }}
                              >
                                {question.score ||
                                  0}
                                {" / "}
                                {question.points ||
                                  0}
                              </div>

                              <div
                                style={{
                                  color:
                                    statusColor,
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    "600",
                                  marginTop:
                                    "4px",
                                }}
                              >
                                {statusText}
                              </div>

                            </div>

                          </div>

                          {/* QUESTION DESCRIPTION */}

                          {question.question_description && (

                            <div
                              style={{
                                background:
                                  "#111827",
                                borderRadius:
                                  "10px",
                                padding:
                                  "16px",
                                marginBottom:
                                  "16px",
                              }}
                            >

                              <div
                                style={{
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "600",
                                  marginBottom:
                                    "8px",
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                Question
                              </div>

                              <div
                                style={{
                                  whiteSpace:
                                    "pre-wrap",
                                  lineHeight:
                                    "1.6",
                                }}
                              >
                                {
                                  question.question_description
                                }
                              </div>

                            </div>

                          )}

                          {/* TEST INFORMATION */}

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(3, minmax(0, 1fr))",
                              gap: "10px",
                              marginBottom:
                                "16px",
                            }}
                          >

                            <div
                              style={{
                                background:
                                  "#111827",
                                borderRadius:
                                  "8px",
                                padding:
                                  "12px",
                              }}
                            >

                              <div
                                style={{
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "12px",
                                  marginBottom:
                                    "4px",
                                }}
                              >
                                Tests Passed
                              </div>

                              <strong>
                                {question.passed_tests ||
                                  0}
                                {" / "}
                                {question.total_tests ||
                                  0}
                              </strong>

                            </div>

                            <div
                              style={{
                                background:
                                  "#111827",
                                borderRadius:
                                  "8px",
                                padding:
                                  "12px",
                              }}
                            >

                              <div
                                style={{
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "12px",
                                  marginBottom:
                                    "4px",
                                }}
                              >
                                Language
                              </div>

                              <strong>
                                {question.language ||
                                  "python"}
                              </strong>

                            </div>

                            <div
                              style={{
                                background:
                                  "#111827",
                                borderRadius:
                                  "8px",
                                padding:
                                  "12px",
                              }}
                            >

                              <div
                                style={{
                                  color:
                                    "#9ca3af",
                                  fontSize:
                                    "12px",
                                  marginBottom:
                                    "4px",
                                }}
                              >
                                Execution Time
                              </div>

                              <strong>
                                {
                                  question.execution_time ??
                                  0
                                }
                                s
                              </strong>

                            </div>

                          </div>

                          {/* SUBMITTED CODE */}

                          {question.submitted &&
                          question.source_code ? (

                            <div>

                              <div
                                style={{
                                  color:
                                    "#d1d5db",
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    "600",
                                  marginBottom:
                                    "8px",
                                }}
                              >
                                Your Submitted Code
                              </div>

                              <pre
                                style={{
                                  margin: 0,
                                  background:
                                    "#020617",
                                  border:
                                    "1px solid #263244",
                                  borderRadius:
                                    "10px",
                                  padding:
                                    "16px",
                                  overflowX:
                                    "auto",
                                  maxHeight:
                                    "400px",
                                  overflowY:
                                    "auto",
                                  color:
                                    "#e5e7eb",
                                  fontSize:
                                    "13px",
                                  lineHeight:
                                    "1.6",
                                  whiteSpace:
                                    "pre-wrap",
                                }}
                              >
                                {
                                  question.source_code
                                }
                              </pre>

                            </div>

                          ) : (

                            <div
                              style={{
                                color:
                                  "#9ca3af",
                                fontSize:
                                  "14px",
                                padding:
                                  "12px 0",
                              }}
                            >
                              No code was submitted
                              for this question.
                            </div>

                          )}

                          {/* SUBMISSION TIME */}

                          {question.submitted_at && (

                            <div
                              style={{
                                color:
                                  "#6b7280",
                                fontSize:
                                  "12px",
                                marginTop:
                                  "12px",
                              }}
                            >
                              Submitted:{" "}
                              {new Date(
                                question.submitted_at
                              ).toLocaleString()}
                            </div>

                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

            {/* ==================================================
                SUBMISSION SUMMARY
            ================================================== */}

            <div
              style={{
                background: "#111827",
                border:
                  "1px solid #263244",
                borderRadius: "16px",
                padding: "30px",
                marginBottom: "24px",
              }}
            >

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Submission Summary
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "12px",
                }}
              >

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius:
                      "10px",
                    padding: "16px",
                  }}
                >

                  <div
                    style={{
                      color:
                        "#9ca3af",
                      fontSize:
                        "12px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Accepted
                  </div>

                  <strong>
                    {
                      result.accepted_questions ??
                      0
                    }
                  </strong>

                </div>

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius:
                      "10px",
                    padding: "16px",
                  }}
                >

                  <div
                    style={{
                      color:
                        "#9ca3af",
                      fontSize:
                        "12px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Partial
                  </div>

                  <strong>
                    {
                      result.partial_questions ??
                      0
                    }
                  </strong>

                </div>

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius:
                      "10px",
                    padding: "16px",
                  }}
                >

                  <div
                    style={{
                      color:
                        "#9ca3af",
                      fontSize:
                        "12px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Failed
                  </div>

                  <strong>
                    {
                      result.failed_questions ??
                      0
                    }
                  </strong>

                </div>

                <div
                  style={{
                    background:
                      "#0f172a",
                    borderRadius:
                      "10px",
                    padding: "16px",
                  }}
                >

                  <div
                    style={{
                      color:
                        "#9ca3af",
                      fontSize:
                        "12px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Tests Passed
                  </div>

                  <strong>
                    {
                      result.passed_tests ??
                      0
                    }
                    {" / "}
                    {
                      result.total_tests ??
                      0
                    }
                  </strong>

                </div>

              </div>

            </div>

            {/* ==================================================
                BACK BUTTON
            ================================================== */}

            <button
              onClick={() =>
                navigate("/exams")
              }
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "10px",
                border: "none",
                background:
                  "#4f46e5",
                color: "white",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Back to Exams
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ========================================================
  // START EXAM SCREEN
  // ========================================================

  if (!examStarted) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            color: "white",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              background: "#111827",
              border:
                "1px solid #263244",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
            }}
          >

            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "14px",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin:
                  "0 auto 20px",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              L
            </div>

            <h1
              style={{
                marginBottom: "10px",
              }}
            >
              {exam.title}
            </h1>

            <p
              style={{
                color: "#9ca3af",
                marginBottom: "30px",
              }}
            >
              {exam.description ||
                "Coding assessment"}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "14px",
                marginBottom: "30px",
              }}
            >

              <div
                style={{
                  background:
                    "#0f172a",
                  borderRadius:
                    "10px",
                  padding: "18px",
                }}
              >

                <div
                  style={{
                    color:
                      "#9ca3af",
                    fontSize:
                      "13px",
                    marginBottom:
                      "6px",
                  }}
                >
                  Duration
                </div>

                <strong>
                  {exam.duration || 60}
                  {" minutes"}
                </strong>

              </div>

              <div
                style={{
                  background:
                    "#0f172a",
                  borderRadius:
                    "10px",
                  padding: "18px",
                }}
              >

                <div
                  style={{
                    color:
                      "#9ca3af",
                    fontSize:
                      "13px",
                    marginBottom:
                      "6px",
                  }}
                >
                  Questions
                </div>

                <strong>
                  {totalQuestions}
                </strong>

              </div>

            </div>

            <div
             style={{
                background:
                  "rgba(245,158,11,0.08)",
                 border:
                    "1px solid rgba(245,158,11,0.25)",
                borderRadius:
                      "10px",
                padding: "18px",
                marginBottom:
                      "25px",
                 color:
                  "#fbbf24",
                fontSize:
                     "14px",
                 lineHeight:
                      "1.6",
                  textAlign:
                     "left",
                }}
            >
                 <strong
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      fontSize: "15px",
                 }}
                >
                     Before you start
                    </strong>
                    {monitoringError && (
                    <div
                        style={{
                        background:
                            "rgba(239,68,68,0.10)",
                        border:
                            "1px solid rgba(239,68,68,0.35)",
                        borderRadius:
                            "10px",
                        padding:
                            "14px",
                        marginBottom:
                            "15px",
                        color:
                            "#fca5a5",
                        fontSize:
                            "14px",
                        lineHeight:
                            "1.5",
                        textAlign:
                            "left",
                        }}
                    >
                        <strong>
                        Monitoring setup failed
                        </strong>

                        <div
                        style={{
                            marginTop: "6px",
                        }}
                        >
                        {monitoringError}
                        </div>

                        <div
                        style={{
                            marginTop: "8px",
                        }}
                        >
                        Please allow camera and microphone
                        access in your browser and try again.
                        </div>
                    </div>
                    )}
                    <div>
                        • Camera and microphone access are required.
                    </div>

                     <div>
                        • Your camera will be used during the exam to
                          monitor face visibility.
                    </div>

                    <div>
                    • You may receive up to 3 warnings if your face
                     is not detected.
                    </div>

                    <div>
                      • Screenshots may be captured at random times
                         during the exam.
                    </div>

                    <div>
                     • Monitoring events and screenshots are stored
                        for trainer review.
                    </div>

                    <div>
                      • The exact timing of screenshots is not shown
                        during the exam.
                    </div>

                    <div
                        style={{
                        marginTop: "10px",
                        }}
                    >
                        • The exam timer starts only after the required
                        permissions are granted and monitoring begins.
                    </div>
                </div>

            <button
              onClick={startExam}
              disabled={
                totalQuestions === 0 ||
                startingExam
              }
              style={{
                width: "100%",
                padding:
                  "14px 20px",
                borderRadius:
                  "10px",
                border: "none",
                background:
                  totalQuestions === 0 ||
                  startingExam
                    ? "#374151"
                    : "#4f46e5",
                color: "white",
                fontSize:
                  "16px",
                fontWeight:
                  "700",
                cursor:
                  totalQuestions === 0 ||
                  startingExam
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {startingExam
                ? "Starting Secure Exam..."
                : "Allow & Start Exam"}
            </button>

            <button
              onClick={() =>
                navigate("/exams")
              }
              style={{
                marginTop:
                  "12px",
                width: "100%",
                padding:
                  "12px 20px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #374151",
                background:
                  "transparent",
                color:
                  "#d1d5db",
                cursor:
                  "pointer",
              }}
            >
              Back to Exams
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ========================================================
  // EXPIRED SCREEN
  // ========================================================

  if (examExpired) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            padding: "30px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "550px",
              textAlign: "center",
              background:
                "#111827",
              border:
                "1px solid #374151",
              borderRadius:
                "16px",
              padding: "40px",
            }}
          >

            <div
              style={{
                fontSize:
                  "50px",
                marginBottom:
                  "15px",
              }}
            >
              ⏰
            </div>

            <h2>
              Time's Up
            </h2>

            <p
              style={{
                color:
                  "#9ca3af",
                lineHeight:
                  "1.6",
                margin:
                  "15px 0 25px",
              }}
            >
              The time allowed for this
              coding exam has expired.
            </p>

            <button
              onClick={restartExam}
              style={{
                width: "100%",
                padding:
                  "13px 24px",
                borderRadius:
                  "8px",
                border:
                  "none",
                background:
                  "#4f46e5",
                color: "white",
                cursor:
                  "pointer",
                fontWeight:
                  "600",
                fontSize:
                  "15px",
                marginBottom:
                  "12px",
              }}
            >
              ↻ Start New Attempt
            </button>

            <button
              onClick={() =>
                navigate("/exams")
              }
              style={{
                width: "100%",
                padding:
                  "12px 24px",
                borderRadius:
                  "8px",
                border:
                  "1px solid #374151",
                background:
                  "transparent",
                color:
                  "#d1d5db",
                cursor:
                  "pointer",
                fontWeight:
                  "600",
              }}
            >
              Back to Exams
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ========================================================
  // NO QUESTIONS
  // ========================================================

  if (!currentQuestion) {
    return (
      <div className="coding-exam">

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection:
              "column",
            gap: "16px",
            color: "white",
          }}
        >

          <h2>
            No coding questions yet
          </h2>

          <p>
            This exam does not contain
            any coding questions.
          </p>

          <button
            onClick={() =>
              navigate("/exams")
            }
            style={{
              padding:
                "10px 18px",
              borderRadius:
                "8px",
              border:
                "none",
              cursor:
                "pointer",
            }}
          >
            Back to Exams
          </button>

        </div>

      </div>
    );
  }

  // ========================================================
  // MAIN EXAM UI
  // ========================================================

  return (
    <div className="coding-exam">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="coding-header">

        <div className="coding-brand">

          <div className="brand-mark">
            L
          </div>

          <div>

            <div className="brand-title">
              LMS Coding Exam
            </div>

            <div className="brand-subtitle">
              {exam.title}
            </div>

          </div>

        </div>
        

        {/* ==================================================
            CAMERA MONITORING PREVIEW
        ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "auto",
            marginRight: "16px",
          }}
        >

          <div
            style={{
              position: "relative",
              width: "150px",
              height: "90px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#020617",
              border: "1px solid #374151",
            }}
          >

            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "8px",
                bottom: "7px",
                background:
                  "rgba(0,0,0,0.65)",
                color: "#fca5a5",
                borderRadius: "5px",
                padding: "3px 6px",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              ● Monitoring
            </div>

          </div>

        </div>
                

        {/* ==================================================
            MONITORING STATUS / WARNING
        ================================================== */}

        {examStarted && (
          <div
            style={{
              minWidth: "190px",
              maxWidth: "280px",
              marginRight: "16px",
              padding: "8px 12px",
              borderRadius: "8px",
              border:
                warningCount > 0
                  ? "1px solid rgba(239,68,68,0.55)"
                  : "1px solid rgba(34,197,94,0.35)",
              background:
                warningCount > 0
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(34,197,94,0.10)",
              color:
                warningCount > 0
                  ? "#fca5a5"
                  : "#86efac",
              fontSize: "12px",
              lineHeight: "1.4",
            }}
          >

            <div
              style={{
                fontWeight: "700",
                marginBottom: "3px",
              }}
            >
              {warningCount > 0
                ? `⚠ Warning ${warningCount} of 3`
                : faceDetected
                  ? "✓ Face detected"
                  : "⚠ Face not detected"}
            </div>

            <div>
              {warningCount > 0
                ? monitoringMessage
                : faceDetected
                  ? "Monitoring is active."
                  : "Please remain visible to the camera."}
            </div>

          </div>
        )}
        <div className="exam-info">

          <span className="question-progress">
            Question{" "}
            {currentIndex + 1} /{" "}
            {totalQuestions}
          </span>

          <div
            className={`exam-timer ${
              timeLeft <= 300
                ? "timer-warning"
                : ""
            }`}
          >
            <span>⏱</span>

            {formatTime(timeLeft)}
          </div>

          <button
            className="submit-exam-button"
            onClick={
              handleSubmitExam
            }
            disabled={running}
          >
            {running
              ? "Checking..."
              : "Submit Exam"}
          </button>

        </div>

      </header>

      {/* ==================================================
          MAIN AREA
      ================================================== */}

      <div className="coding-main">

        {/* ==================================================
            QUESTION SIDEBAR
        ================================================== */}

        <aside className="question-sidebar">

          <div className="sidebar-title">
            Questions
          </div>

          <div className="question-list">

            {questions.map(
              (
                question,
                index
              ) => (

                <button
                  key={question.id}
                  className={`question-item ${
                    currentQuestion.id ===
                    question.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectQuestion(
                      question,
                      index
                    )
                  }
                >

                  <div className="question-number">
                    {index + 1}
                  </div>

                  <div className="question-info">

                    <div className="question-name">
                      {question.title}
                    </div>

                    <div className="question-meta">

                      <span>
                        {question.difficulty}
                      </span>

                      <span>
                        {question.points} pts
                      </span>

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

          <div className="exam-progress">

            <div className="progress-heading">
              Exam Progress
            </div>

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <div className="progress-text">
              {currentIndex + 1} of{" "}
              {totalQuestions} questions
            </div>

          </div>

        </aside>

        {/* ==================================================
            WORKSPACE
        ================================================== */}

        <main className="coding-workspace">

          {/* QUESTION */}

          <section className="problem-panel">

            <div className="problem-header">

              <div>

                <h1>
                  {currentQuestion.title}
                </h1>

                <div className="problem-badges">

                  <span className="difficulty-badge">
                    {currentQuestion.difficulty}
                  </span>

                  <span className="points-badge">
                    {currentQuestion.points} points
                  </span>

                </div>

              </div>

            </div>

            <div className="problem-description">

              <h2>
                Description
              </h2>

              <p>
                {currentQuestion.description ||
                  "No description provided."}
              </p>

              {currentQuestion.input_format && (
                <>
                  <h2>
                    Input Format
                  </h2>

                  <p>
                    {currentQuestion.input_format}
                  </p>
                </>
              )}

              {currentQuestion.output_format && (
                <>
                  <h2>
                    Output Format
                  </h2>

                  <p>
                    {currentQuestion.output_format}
                  </p>
                </>
              )}

              <h2>
                Examples
              </h2>

              {sampleTestCases.length === 0 ? (

                <p>
                  No sample test cases available.
                </p>

              ) : (

                sampleTestCases.map(
                  (
                    testCase,
                    index
                  ) => (

                    <div
                      className="example-box"
                      key={testCase.id}
                    >

                      <div>
                        <strong>
                          Example{" "}
                          {index + 1}
                        </strong>
                      </div>

                      <div className="example-line">

                        <span>
                          Input
                        </span>

                        <code>
                          {testCase.input_data ||
                            "(empty)"}
                        </code>

                      </div>

                      <div className="example-line">

                        <span>
                          Output
                        </span>

                        <code>
                          {testCase.expected_output ||
                            "(hidden)"}
                        </code>

                      </div>

                    </div>

                  )
                )

              )}

              {currentQuestion.constraints && (
                <>
                  <h2>
                    Constraints
                  </h2>

                  <div className="constraints">

                    {currentQuestion.constraints
                      .split("\n")
                      .filter(
                        (item) =>
                          item.trim()
                      )
                      .map(
                        (
                          constraint,
                          index
                        ) => (

                          <div
                            key={index}
                          >
                            <code>
                              {constraint}
                            </code>
                          </div>

                        )
                      )}

                  </div>
                </>
              )}

            </div>

          </section>

          {/* CODE EDITOR */}

          <section className="editor-section">

            <div className="editor-toolbar">

              <div className="language-selector">

                <span>
                  Language
                </span>

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target.value
                    )
                  }
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

              <button
                className="reset-button"
                onClick={resetCode}
              >
                Reset Code
              </button>

            </div>

            <div className="editor-container">

              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) =>
                  setCode(value || "")
                }
                options={{
                  fontSize: 14,

                  minimap: {
                    enabled: false,
                  },

                  automaticLayout:
                    true,

                  wordWrap:
                    "on",

                  padding: {
                    top: 15,
                  },

                  scrollBeyondLastLine:
                    false,
                }}
              />

            </div>

          </section>

          {/* TERMINAL */}

          <section className="terminal-section">

            <div className="terminal-tabs">

              <button
                className={
                  activeTab === "test"
                    ? "terminal-tab active"
                    : "terminal-tab"
                }
                onClick={() =>
                  setActiveTab("test")
                }
              >
                Test Cases
              </button>

              <button
                className={
                  activeTab === "output"
                    ? "terminal-tab active"
                    : "terminal-tab"
                }
                onClick={() =>
                  setActiveTab("output")
                }
              >
                Run Output
              </button>

            </div>

            <div className="terminal-content">

              {activeTab === "test" ? (

                <div className="test-cases">

                  {sampleTestCases.length ===
                  0 ? (

                    <div>
                      No sample test cases available.
                    </div>

                  ) : (

                    sampleTestCases.map(
                      (
                        testCase,
                        index
                      ) => (

                        <div
                          className="test-case"
                          key={testCase.id}
                        >

                          <div className="test-case-title">
                            Test Case{" "}
                            {index + 1}
                          </div>

                          <div className="test-case-row">

                            <span>
                              Input
                            </span>

                            <code>
                              {testCase.input_data ||
                                "(empty)"}
                            </code>

                          </div>

                          <div className="test-case-row">

                            <span>
                              Expected
                            </span>

                            <code>
                              {testCase.expected_output ||
                                "(hidden)"}
                            </code>

                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

              ) : (

                <pre className="terminal-output">
                  {output ||
                    "Run your code to see the output here..."}
                </pre>

              )}

            </div>

            <div className="terminal-actions">

              <button
                className="run-button"
                onClick={handleRunCode}
                disabled={
                  running ||
                  examExpired ||
                  examCompleted
                }
              >
                {running
                  ? "Running..."
                  : "▶ Run Code"}
              </button>

              <button
                className="submit-code-button"
                onClick={handleSubmit}
                disabled={
                  examExpired ||
                  examCompleted ||
                  running
                }
              >
                {running
                  ? "Evaluating..."
                  : submitted
                    ? "Submitted"
                    : "Submit Code"}
              </button>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default LearnerCodingExam;
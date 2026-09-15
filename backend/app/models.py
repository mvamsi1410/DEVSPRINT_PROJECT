from datetime import datetime
from . import db


# =========================================================
# USER
# =========================================================

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    mobile = db.Column(db.String(30))

    password_hash = db.Column(db.String(255), nullable=False)

    # admin / trainer / learner
    role = db.Column(db.String(30), nullable=False, default="learner")

    # active / inactive
    status = db.Column(db.String(20), nullable=False, default="active")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# =========================================================
# TRAINER
# =========================================================

class Trainer(db.Model):
    __tablename__ = "trainer"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        unique=True,
        nullable=False
    )

    specialization = db.Column(db.String(150))
    experience = db.Column(db.Integer, default=0)
    bio = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="active")

    user = db.relationship(
        "User",
        backref=db.backref("trainer_profile", uselist=False)
    )


# =========================================================
# BATCH
# =========================================================

class Batch(db.Model):
    __tablename__ = "batch"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)

    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

    trainer_id = db.Column(
        db.Integer,
        db.ForeignKey("trainer.id")
    )

    status = db.Column(db.String(20), default="active")


# =========================================================
# LEARNER
# =========================================================

class Learner(db.Model):
    __tablename__ = "learner"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        unique=True,
        nullable=False
    )

    batch_id = db.Column(
        db.Integer,
        db.ForeignKey("batch.id")
    )

    education = db.Column(db.String(200))

    status = db.Column(db.String(20), default="active")

    user = db.relationship(
        "User",
        backref=db.backref("learner_profile", uselist=False)
    )


# =========================================================
# COURSE
# =========================================================

class Course(db.Model):
    __tablename__ = "course"

    id = db.Column(db.String(80), primary_key=True)

    trainer_id = db.Column(
        db.Integer,
        db.ForeignKey("trainer.id"),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)

    level = db.Column(
        db.String(50),
        nullable=False,
        default="Beginner"
    )

    description = db.Column(db.Text, default="")
    thumbnail = db.Column(db.Text, default="")

    published = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    trainer = db.relationship(
        "Trainer",
        backref="courses"
    )


# =========================================================
# MODULE
# =========================================================

class Module(db.Model):
    __tablename__ = "module"

    id = db.Column(db.Integer, primary_key=True)

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    order_no = db.Column(
        db.Integer,
        nullable=False
    )


# =========================================================
# LESSON
# =========================================================

class Lesson(db.Model):
    __tablename__ = "lesson"

    id = db.Column(
        db.String(80),
        primary_key=True
    )

    module_id = db.Column(
        db.Integer,
        db.ForeignKey("module.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    content = db.Column(
        db.Text,
        default=""
    )

    # -----------------------------------------------------
    # LEGACY VIDEO
    # -----------------------------------------------------
    # Kept for compatibility with your existing lessons.
    # New videos will be stored in LessonResource.
    video_url = db.Column(
        db.Text,
        default=""
    )

    # -----------------------------------------------------
    # LEGACY PDF
    # -----------------------------------------------------
    # Kept for compatibility with your existing lessons.
    # New PDFs will be stored in LessonResource.
    pdf_url = db.Column(
        db.Text,
        default=""
    )

    # -----------------------------------------------------
    # LESSON DURATION
    # -----------------------------------------------------
    # Trainer can update this through the API.
    #
    # Examples:
    # 10:00
    # 15:30
    # 01:20:00
    # -----------------------------------------------------
    duration = db.Column(
        db.String(20),
        default="00:00"
    )

    order_no = db.Column(
        db.Integer,
        nullable=False
    )

    # Relationship to multiple uploaded resources
    resources = db.relationship(
        "LessonResource",
        backref="lesson",
        lazy=True,
        cascade="all, delete-orphan"
    )


# =========================================================
# LESSON RESOURCE
# =========================================================
#
# This is the NEW table.
#
# One lesson can have:
#
#   Video 1
#   Video 2
#   Video 3
#   PDF 1
#   PDF 2
#   PDF 3
#
# There is no fixed limit.
#
# resource_type:
#   video
#   pdf
#
# Example:
#
# lesson_id = "les-101"
# resource_type = "video"
# file_name = "java-introduction.mp4"
# file_path = "uploads/videos/java-introduction.mp4"
#
# =========================================================

class LessonResource(db.Model):
    __tablename__ = "lesson_resource"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Which lesson this file belongs to
    lesson_id = db.Column(
        db.String(80),
        db.ForeignKey("lesson.id"),
        nullable=False,
        index=True
    )

    # video / pdf
    resource_type = db.Column(
        db.String(20),
        nullable=False
    )

    # Original file name
    file_name = db.Column(
        db.String(255),
        nullable=False
    )

    # Actual file location on the server
    file_path = db.Column(
        db.String(500),
        nullable=False
    )

    # Optional title displayed in frontend
    title = db.Column(
        db.String(200),
        default=""
    )

    uploaded_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# =========================================================
# ENROLLMENT
# =========================================================

class Enrollment(db.Model):
    __tablename__ = "enrollment"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    progress = db.Column(
        db.Integer,
        default=0
    )

    status = db.Column(
        db.String(20),
        default="active"
    )

    enrolled_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "learner_id",
            "course_id",
            name="uq_enrollment"
        ),
    )


# =========================================================
# LESSON PROGRESS
# =========================================================

class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    lesson_id = db.Column(
        db.String(80),
        db.ForeignKey("lesson.id"),
        nullable=False
    )

    completed = db.Column(
        db.Boolean,
        default=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "learner_id",
            "lesson_id",
            name="uq_lesson_progress"
        ),
    )


# =========================================================
# ASSIGNMENT
# =========================================================

class Assignment(db.Model):
    __tablename__ = "assignment"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    trainer_id = db.Column(
        db.Integer,
        db.ForeignKey("trainer.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        default=""
    )

    due_date = db.Column(
        db.DateTime
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# =========================================================
# ASSIGNMENT SUBMISSION
# =========================================================

class AssignmentSubmission(db.Model):
    __tablename__ = "assignment_submission"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    assignment_id = db.Column(
        db.Integer,
        db.ForeignKey("assignment.id"),
        nullable=False
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    submission = db.Column(
        db.Text,
        default=""
    )

    submitted_at = db.Column(
        db.DateTime
    )

    grade = db.Column(
        db.Integer
    )

    feedback = db.Column(
        db.Text,
        default=""
    )


# =========================================================
# QUIZ
# =========================================================

class Quiz(db.Model):
    __tablename__ = "quiz"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        default=""
    )

    total_marks = db.Column(
        db.Integer,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# =========================================================
# QUESTION
# =========================================================

class Question(db.Model):
    __tablename__ = "question"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    quiz_id = db.Column(
        db.Integer,
        db.ForeignKey("quiz.id"),
        nullable=False
    )

    question_text = db.Column(
        db.Text,
        nullable=False
    )

    option_a = db.Column(db.String(500))
    option_b = db.Column(db.String(500))
    option_c = db.Column(db.String(500))
    option_d = db.Column(db.String(500))

    correct_answer = db.Column(
        db.String(10)
    )

    marks = db.Column(
        db.Integer,
        default=1
    )


# =========================================================
# QUIZ ATTEMPT
# =========================================================

class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempt"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    quiz_id = db.Column(
        db.Integer,
        db.ForeignKey("quiz.id"),
        nullable=False
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    score = db.Column(
        db.Integer,
        default=0
    )

    total = db.Column(
        db.Integer,
        default=0
    )

    attempted_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# =========================================================
# CERTIFICATE
# =========================================================

class Certificate(db.Model):
    __tablename__ = "certificate"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    certificate_number = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    issue_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    status = db.Column(
        db.String(20),
        default="valid"
    )


# =========================================================
# ATTENDANCE
# =========================================================

class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    batch_id = db.Column(
        db.Integer,
        db.ForeignKey("batch.id"),
        nullable=False
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False
    )

    marked_by = db.Column(
        db.Integer,
        db.ForeignKey("user.id")
    )


# =========================================================
# PAYMENT
# =========================================================

class Payment(db.Model):
    __tablename__ = "payment"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    amount = db.Column(
        db.Float,
        nullable=False
    )

    payment_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    payment_method = db.Column(
        db.String(50)
    )

    status = db.Column(
        db.String(20),
        default="pending"
    )


# =========================================================
# INVOICE
# =========================================================

class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    invoice_number = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    amount = db.Column(
        db.Float,
        nullable=False
    )

    invoice_date = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    status = db.Column(
        db.String(20),
        default="unpaid"
    )


# =========================================================
# DISCUSSION / COMMUNITY
# =========================================================

class Discussion(db.Model):
    __tablename__ = "discussion"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    lesson_id = db.Column(
        db.String(80),
        db.ForeignKey("lesson.id"),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# =========================================================
# WISHLIST
# =========================================================

class Wishlist(db.Model):
    __tablename__ = "wishlist"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    learner_id = db.Column(
        db.Integer,
        db.ForeignKey("learner.id"),
        nullable=False
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "learner_id",
            "course_id",
            name="uq_wishlist"
        ),
    )


# =========================================================
# COURSE DOCUMENT
# =========================================================

class CourseDocument(db.Model):
    __tablename__ = "course_document"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    course_id = db.Column(
        db.String(80),
        db.ForeignKey("course.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    file_name = db.Column(
        db.String(255),
        nullable=False
    )

    file_path = db.Column(
        db.String(500),
        nullable=False
    )

    uploaded_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    course = db.relationship(
        "Course",
        backref="documents"
    )
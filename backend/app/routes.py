from flask import Blueprint, request, jsonify, send_from_directory, current_app
import os
from werkzeug.utils import secure_filename
from . import db
from .models import (
    User,
    Trainer,
    Learner,
    Batch,
    Course,
    CourseDocument,
    Module,
    Lesson,
    Enrollment,
    Assignment,
    AssignmentSubmission,
    Quiz,
    Question,
    QuizAttempt,
    Certificate,
    Attendance,
    Payment,
    Invoice,
    LessonProgress,
    Wishlist,
    Discussion,
)
from .auth import (
    make_token,
    login_user,
    create_password_hash,
    token_required,
    role_required,
)
from datetime import datetime


api = Blueprint("api", __name__)


# =========================================================
# FILE UPLOAD CONFIGURATION
# =========================================================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOAD_ROOT = os.path.join(PROJECT_ROOT, "uploads")
VIDEO_UPLOAD_ROOT = os.path.join(UPLOAD_ROOT, "videos")
PDF_UPLOAD_ROOT = os.path.join(UPLOAD_ROOT, "documents")

os.makedirs(VIDEO_UPLOAD_ROOT, exist_ok=True)
os.makedirs(PDF_UPLOAD_ROOT, exist_ok=True)

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "avi", "mkv"}
ALLOWED_PDF_EXTENSIONS = {"pdf"}


def allowed_extension(filename, allowed):
    return bool(filename and "." in filename and filename.rsplit(".", 1)[1].lower() in allowed)


def lesson_owner(user, lesson):
    """Return (trainer, course) after checking the lesson hierarchy."""
    trainer = Trainer.query.filter_by(user_id=user.id).first()
    if not trainer:
        return None, None

    module = Module.query.get(lesson.module_id)
    if not module:
        return trainer, None

    course = Course.query.get(module.course_id)
    if not course or course.trainer_id != trainer.id:
        return trainer, None

    return trainer, course


def resource_folder(lesson_id, resource_type):
    root = VIDEO_UPLOAD_ROOT if resource_type == "video" else PDF_UPLOAD_ROOT
    folder = os.path.join(root, secure_filename(str(lesson_id)))
    os.makedirs(folder, exist_ok=True)
    return folder


def resource_url(lesson_id, resource_type, filename):
    return f"/api/lessons/{lesson_id}/resources/{resource_type}/{filename}"


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def user_json(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at.isoformat()
        if user.created_at else None,
    }


def trainer_json(trainer):
    return {
        "id": trainer.id,
        "user_id": trainer.user_id,
        "name": trainer.user.name if trainer.user else None,
        "email": trainer.user.email if trainer.user else None,
        "mobile": trainer.user.mobile if trainer.user else None,
        "specialization": trainer.specialization,
        "experience": trainer.experience,
        "bio": trainer.bio,
        "status": trainer.status,
    }


def learner_json(learner):
    return {
        "id": learner.id,
        "user_id": learner.user_id,
        "name": learner.user.name if learner.user else None,
        "email": learner.user.email if learner.user else None,
        "mobile": learner.user.mobile if learner.user else None,
        "education": learner.education,
        "batch_id": learner.batch_id,
        "status": learner.status,
    }


def calculate_learning_time(learner_id):
    """Total duration of completed lessons for this learner."""
    rows = (
        db.session.query(Lesson.duration)
        .join(LessonProgress, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Enrollment, Enrollment.course_id == Module.course_id)
        .filter(
            LessonProgress.learner_id == learner_id,
            LessonProgress.completed.is_(True),
            Enrollment.learner_id == learner_id,
            Enrollment.status == "active"
        )
        .all()
    )

    total_seconds = 0

    for (duration,) in rows:
        if not duration:
            continue

        try:
            parts = [int(x) for x in str(duration).split(":")]
            if len(parts) == 2:
                minutes, seconds = parts
                total_seconds += minutes * 60 + seconds
            elif len(parts) == 3:
                hours, minutes, seconds = parts
                total_seconds += hours * 3600 + minutes * 60 + seconds
        except (ValueError, TypeError):
            continue

    total_minutes = total_seconds // 60
    hours = total_minutes // 60
    minutes = total_minutes % 60

    return {
        "hours": hours,
        "minutes": minutes,
        "totalMinutes": total_minutes,
        "formatted": f"{hours}h {minutes}m"
    }


def course_json(course, progress=0):
    lesson_count = (
        Lesson.query
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course.id)
        .count()
    )

    return {
        "id": course.id,
        "title": course.title,
        "trainer_id": course.trainer_id,
        "trainer": (
            course.trainer.user.name
            if course.trainer and course.trainer.user
            else None
        ),
        "level": course.level,
        "description": course.description,
        "thumbnail": course.thumbnail,
        "published": course.published,
        "progress": progress,
        "totalLessons": lesson_count,
        "lessons": (
            f"{round(lesson_count * progress / 100)}/{lesson_count} Lessons"
            if lesson_count
            else "0/0 Lessons"
        ),
    }


# =========================================================
# HEALTH
# =========================================================

@api.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "DevSprint LMS Backend",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


# =========================================================
# AUTHENTICATION
# =========================================================

@api.post("/auth/register")
def register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    mobile = data.get("mobile", "").strip()

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "Email already registered"
        }), 409

    # Create user
    user = User(
        name=name,
        email=email,
        mobile=mobile,
        password_hash=create_password_hash(password),
        role="learner",
        status="active",
    )

    db.session.add(user)
    db.session.flush()

    # Create learner profile
    learner = Learner(
        user_id=user.id,
        education=data.get("education"),
        status="active",
    )

    db.session.add(learner)

    db.session.commit()

    token = make_token(user)

    return jsonify({
        "message": "Registration successful",
        "user": user_json(user),
        "token": token,
    }), 201

@api.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "")
    password = data.get("password", "")

    user = login_user(email, password)

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if user.status != "active":
        return jsonify({
            "error": "Your account is inactive"
        }), 403

    requested_role = data.get("role")

    if requested_role and requested_role != user.role:
        return jsonify({
            "error": f"This account is registered as {user.role}"
        }), 403

    return jsonify({
        "message": "Login successful",
        "user": user_json(user),
        "token": make_token(user)
    })


@api.get("/auth/me")
@token_required
def me(user):
    return jsonify({
        "user": user_json(user)
    })


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@api.get("/admin/dashboard")
@role_required("admin")
def admin_dashboard(user):

    return jsonify({
        "user": user_json(user),
        "stats": {
            "totalUsers": User.query.count(),
            "totalTrainers": Trainer.query.count(),
            "totalLearners": Learner.query.count(),
            "totalAdmins": User.query.filter_by(role="admin").count(),
            "activeUsers": User.query.filter_by(status="active").count(),
            "totalCourses": Course.query.count(),
            "totalBatches": Batch.query.count(),
            "totalCertificates": Certificate.query.count(),
            "totalPayments": Payment.query.count(),
        }
    })


# =========================================================
# ADMIN - USERS
# =========================================================

@api.get("/admin/users")
@role_required("admin")
def admin_users(user):

    users = User.query.order_by(
        User.created_at.desc()
    ).all()

    return jsonify({
        "users": [
            user_json(u)
            for u in users
        ]
    })


@api.put("/admin/users/<int:user_id>/status")
@role_required("admin")
def admin_update_user_status(user, user_id):

    target = User.query.get_or_404(user_id)

    data = request.get_json(silent=True) or {}

    status = data.get("status")

    if status not in ["active", "inactive"]:
        return jsonify({
            "error": "Status must be active or inactive"
        }), 400

    target.status = status

    db.session.commit()

    return jsonify({
        "message": "User status updated",
        "user": user_json(target)
    })


@api.delete("/admin/users/<int:user_id>")
@role_required("admin")
def admin_delete_user(user, user_id):

    target = User.query.get_or_404(user_id)

    if target.id == user.id:
        return jsonify({
            "error": "Admin cannot delete your own account"
        }), 400

    learner = Learner.query.filter_by(
        user_id=target.id
    ).first()

    if learner:
        db.session.execute(
            db.delete(LessonProgress).where(
                LessonProgress.learner_id == learner.id
            )
        )

        db.session.execute(
            db.delete(Enrollment).where(
                Enrollment.learner_id == learner.id
            )
        )

        db.session.delete(learner)

    db.session.delete(target)

    db.session.commit()

    return jsonify({
        "message": "User deleted successfully"
    })

    try:

        # =====================================================
        # DELETE LEARNER-RELATED DATA
        # =====================================================

        learner = Learner.query.filter_by(
            user_id=target.id
        ).first()

        if learner:

            # Delete lesson progress
            LessonProgress.query.filter_by(
                learner_id=learner.id
            ).delete(
                synchronize_session=False
            )

            # Delete assignment submissions
            AssignmentSubmission.query.filter_by(
                learner_id=learner.id
            ).delete(
                synchronize_session=False
            )

            # Delete quiz attempts
            QuizAttempt.query.filter_by(
                learner_id=learner.id
            ).delete(
                synchronize_session=False
            )

            # Delete enrollments
            Enrollment.query.filter_by(
                learner_id=learner.id
            ).delete(
                synchronize_session=False
            )

            # Delete certificates
            Certificate.query.filter_by(
                learner_id=learner.id
            ).delete(
                synchronize_session=False
            )

            # Finally delete learner profile
            db.session.delete(learner)

        # =====================================================
        # DELETE USER
        # =====================================================

        db.session.delete(target)

        db.session.commit()

        return jsonify({
            "message": "User deleted successfully"
        })

    except Exception as error:

        db.session.rollback()

        print("ADMIN DELETE USER ERROR:", error)

        return jsonify({
            "error": "Unable to delete user",
            "details": str(error)
        }), 500

    
# =========================================================
# ADMIN - COURSE CATALOG
# =========================================================

@api.get("/admin/courses")
@role_required("admin")
def admin_courses(user):

    courses = Course.query.order_by(
        Course.created_at.desc()
    ).all()

    result = []

    for course in courses:

        modules = []

        course_modules = Module.query.filter_by(
            course_id=course.id
        ).order_by(
            Module.order_no
        ).all()

        for module in course_modules:

            lessons = []

            course_lessons = Lesson.query.filter_by(
                module_id=module.id
            ).order_by(
                Lesson.order_no
            ).all()

            for lesson in course_lessons:

                resources = lesson_resource_list(
                    lesson.id
                )

                video_count = len([
                    resource
                    for resource in resources
                    if resource["type"] == "video"
                ])

                pdf_count = len([
                    resource
                    for resource in resources
                    if resource["type"] == "pdf"
                ])

                lessons.append({

                    "id": lesson.id,

                    "title": lesson.title,

                    "duration":
                        lesson.duration,

                    "video_url":
                        lesson.video_url,

                    "pdf_url":
                        lesson.pdf_url,

                    "video_count":
                        video_count,

                    "pdf_count":
                        pdf_count

                })

            modules.append({

                "id": module.id,

                "title":
                    module.title,

                "order_no":
                    module.order_no,

                "lessons":
                    lessons

            })

        result.append({

            "id":
                course.id,

            "title":
                course.title,

            "level":
                course.level,

            "description":
                course.description,

            "thumbnail":
                course.thumbnail,

            "published":
                course.published,

            "trainer_id":
                course.trainer_id,

            "trainer": (
                course.trainer.user.name
                if course.trainer
                and course.trainer.user
                else None
            ),

            "modules":
                modules

        })

    return jsonify({

        "courses":
            result

    })

# =========================================================
# ADMIN - TRAINERS
# =========================================================

@api.get("/admin/trainers")
@role_required("admin")
def admin_trainers(user):

    trainers = Trainer.query.all()

    return jsonify({
        "trainers": [
            trainer_json(t)
            for t in trainers
        ]
    })


@api.post("/admin/trainers")
@role_required("admin")
def admin_create_trainer(user):

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or len(password) < 6:
        return jsonify({
            "error": "Name, email and password of at least 6 characters are required"
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "error": "An account with this email already exists"
        }), 409

    trainer_user = User(
        name=name,
        email=email,
        mobile=data.get("mobile", ""),
        role="trainer",
        password_hash=create_password_hash(password)
    )

    db.session.add(trainer_user)
    db.session.flush()

    trainer = Trainer(
        user_id=trainer_user.id,
        specialization=data.get("specialization", ""),
        experience=int(data.get("experience", 0)),
        bio=data.get("bio", "")
    )

    db.session.add(trainer)
    db.session.commit()

    return jsonify({
        "message": "Trainer created successfully",
        "trainer": trainer_json(trainer)
    }), 201


@api.get("/admin/trainers/<int:trainer_id>")
@role_required("admin")
def admin_get_trainer(user, trainer_id):

    trainer = Trainer.query.get_or_404(trainer_id)

    return jsonify({
        "trainer": trainer_json(trainer)
    })


@api.put("/admin/trainers/<int:trainer_id>")
@role_required("admin")
def admin_update_trainer(user, trainer_id):

    trainer = Trainer.query.get_or_404(trainer_id)

    data = request.get_json(silent=True) or {}

    if "name" in data:
        trainer.user.name = data["name"]

    if "email" in data:
        trainer.user.email = data["email"].strip().lower()

    if "mobile" in data:
        trainer.user.mobile = data["mobile"]

    if "specialization" in data:
        trainer.specialization = data["specialization"]

    if "experience" in data:
        trainer.experience = int(data["experience"])

    if "bio" in data:
        trainer.bio = data["bio"]

    if "status" in data:
        trainer.status = data["status"]

    db.session.commit()

    return jsonify({
        "message": "Trainer updated successfully",
        "trainer": trainer_json(trainer)
    })


@api.delete("/admin/trainers/<int:trainer_id>")
@role_required("admin")
def admin_delete_trainer(user, trainer_id):

    trainer = Trainer.query.get_or_404(trainer_id)

    trainer.user.status = "inactive"
    trainer.status = "inactive"

    db.session.commit()

    return jsonify({
        "message": "Trainer deactivated successfully"
    })


# =========================================================
# ADMIN - LEARNERS
# =========================================================

@api.get("/admin/learners")
@role_required("admin")
def admin_learners(user):

    learners = Learner.query.all()

    return jsonify({
        "learners": [
            learner_json(l)
            for l in learners
        ]
    })
# =========================================================
# TRAINER - COURSE ENROLLED LEARNERS
# =========================================================

@api.get("/trainer/courses/<course_id>/learners")
@role_required("trainer")
def trainer_course_learners(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    if not trainer:
        return jsonify({
            "error": "Trainer profile not found"
        }), 404

    course = Course.query.get_or_404(course_id)

    # Make sure this course belongs to the logged-in trainer
    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    enrollments = Enrollment.query.filter_by(
        course_id=course.id
    ).all()

    learners = []

    for enrollment in enrollments:

        learner = Learner.query.get(
            enrollment.learner_id
        )

        if learner and learner.user:

            learners.append({
                "learner_id": learner.id,
                "user_id": learner.user_id,
                "name": learner.user.name,
                "email": learner.user.email,
                "mobile": learner.user.mobile,
                "education": learner.education,
                "progress": enrollment.progress,
                "status": enrollment.status,
                "enrolled_at": (
                    enrollment.enrolled_at.isoformat()
                    if enrollment.enrolled_at else None
                )
            })

    return jsonify({
        "course": {
            "id": course.id,
            "title": course.title
        },
        "totalLearners": len(learners),
        "learners": learners
    })
@api.post("/admin/learners")
@role_required("admin")
def admin_create_learner(user):

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    mobile = data.get("mobile", "").strip()

    if not name or not email or len(password) < 6:
        return jsonify({
            "error": "Name, email and password of at least 6 characters are required"
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "error": "An account with this email already exists"
        }), 409

    learner_user = User(
        name=name,
        email=email,
        mobile=mobile,
        role="learner",
        status="active",
        password_hash=create_password_hash(password)
    )

    db.session.add(learner_user)
    db.session.flush()

    learner = Learner(
        user_id=learner_user.id,
        education=data.get("education", ""),
        batch_id=data.get("batch_id"),
        status="active"
    )

    db.session.add(learner)
    db.session.commit()

    return jsonify({
        "message": "Learner created successfully",
        "learner": learner_json(learner)
    }), 201



# =========================================================
# ADMIN - COURSE ENROLLMENTS
# =========================================================

@api.get("/admin/enrollments")
@role_required("admin")
def admin_enrollments(user):

    enrollments = Enrollment.query.all()

    result = []

    for enrollment in enrollments:

        learner = Learner.query.get(
            enrollment.learner_id
        )

        course = Course.query.get(
            enrollment.course_id
        )

        if learner and learner.user and course:

            result.append({
                "enrollment_id": enrollment.id,
                "course_id": course.id,
                "course_title": course.title,
                "learner_id": learner.id,
                "learner_name": learner.user.name,
                "learner_email": learner.user.email,
                "progress": enrollment.progress,
                "status": enrollment.status,
                "enrolled_at": (
                    enrollment.enrolled_at.isoformat()
                    if enrollment.enrolled_at else None
                )
            })

    return jsonify({
        "totalEnrollments": len(result),
        "enrollments": result
    })


# =========================================================
# ADMIN - BATCHES
# =========================================================

@api.get("/admin/batches")
@role_required("admin")
def admin_batches(user):

    batches = Batch.query.all()

    return jsonify({
        "batches": [
            {
                "id": b.id,
                "name": b.name,
                "start_date": b.start_date.isoformat()
                if b.start_date else None,
                "end_date": b.end_date.isoformat()
                if b.end_date else None,
                "trainer_id": b.trainer_id,
                "status": b.status
            }
            for b in batches
        ]
    })


@api.post("/admin/batches")
@role_required("admin")
def admin_create_batch(user):

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()

    if not name:
        return jsonify({
            "error": "Batch name is required"
        }), 400

    batch = Batch(
        name=name,
        status=data.get("status", "active")
    )

    db.session.add(batch)
    db.session.commit()

    return jsonify({
        "message": "Batch created successfully",
        "batch": {
            "id": batch.id,
            "name": batch.name,
            "status": batch.status
        }
    }), 201


# =========================================================
# COURSES - COMMON
# =========================================================

@api.get("/courses")
@token_required
def courses(user):

    rows = []

    for course in Course.query.filter_by(
        published=True
    ).order_by(
        Course.created_at.desc()
    ).all():

        progress = 0

        if user.role == "learner":

            learner = Learner.query.filter_by(
                user_id=user.id
            ).first()

            if learner:

                enrollment = Enrollment.query.filter_by(
                    learner_id=learner.id,
                    course_id=course.id
                ).first()

                if enrollment:
                    progress = enrollment.progress

        rows.append(
            course_json(course, progress)
        )

    return jsonify({
        "courses": rows
    })


def lesson_resource_list(lesson_id):
    resources = []
    for resource_type, root in (("video", VIDEO_UPLOAD_ROOT), ("pdf", PDF_UPLOAD_ROOT)):
        folder = os.path.join(root, secure_filename(str(lesson_id)))
        if not os.path.isdir(folder):
            continue
        for filename in sorted(os.listdir(folder)):
            path = os.path.join(folder, filename)
            if not os.path.isfile(path):
                continue
            resources.append({
                "type": resource_type,
                "fileName": filename,
                "url": resource_url(lesson_id, resource_type, filename)
            })
    return resources


@api.get("/courses/<course_id>")
@token_required
def course_detail(user, course_id):

    course = Course.query.get_or_404(course_id)

    progress = 0
    wishlisted = False

    if user.role == "learner":

        learner = Learner.query.filter_by(
            user_id=user.id
        ).first()

        if learner:

            enrollment = Enrollment.query.filter_by(
                learner_id=learner.id,
                course_id=course.id
            ).first()

            if enrollment:
                progress = enrollment.progress

            wishlisted = bool(
                Wishlist.query.filter_by(
                    learner_id=learner.id,
                    course_id=course.id
                ).first()
            )

    modules = []

    for module in Module.query.filter_by(
        course_id=course.id
    ).order_by(
        Module.order_no
    ).all():

        lessons = []

        for lesson in Lesson.query.filter_by(
            module_id=module.id
        ).order_by(
            Lesson.order_no
        ).all():

            completed = False

            if user.role == "learner":

                learner = Learner.query.filter_by(
                    user_id=user.id
                ).first()

                if learner:

                    lp = LessonProgress.query.filter_by(
                        learner_id=learner.id,
                        lesson_id=lesson.id
                    ).first()

                    completed = bool(
                        lp and lp.completed
                    )

            lessons.append({
                "id": lesson.id,
                "title": lesson.title,
                "duration": lesson.duration,
                "content": lesson.content,
                "video_url": lesson.video_url,
                "pdf_url": lesson.pdf_url,
                "resources": lesson_resource_list(lesson.id),
                "completed": completed
            })

        modules.append({
            "id": module.id,
            "module": module.title,
            "lessons": lessons
        })

    return jsonify({
        "course": course_json(course, progress),
        "modules": modules,
        "wishlisted": wishlisted
    })


# =========================================================
# LEARNER - ENROLLMENT
# =========================================================

@api.post("/courses/<course_id>/enroll")
@role_required("learner")
def enroll(user, course_id):

    course = Course.query.get(course_id)

    if not course:
        return jsonify({
            "error": "Course not found"
        }), 404

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    enrollment = Enrollment.query.filter_by(
        learner_id=learner.id,
        course_id=course.id
    ).first()

    if not enrollment:

        enrollment = Enrollment(
            learner_id=learner.id,
            course_id=course.id,
            progress=0
        )

        db.session.add(enrollment)
        db.session.commit()

    return jsonify({
        "message": "Course enrolled",
        "progress": enrollment.progress
    })


@api.get("/my-learning")
@role_required("learner")
def my_learning(user):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    enrollments = Enrollment.query.filter_by(
        learner_id=learner.id
    ).all()

    result = []

    for enrollment in enrollments:

        course = Course.query.get(
            enrollment.course_id
        )

        if course:
            result.append(
                course_json(
                    course,
                    enrollment.progress
                )
            )

    return jsonify({
        "courses": result
    })


# =========================================================
# LEARNER - WISHLIST
# =========================================================

@api.put("/courses/<course_id>/wishlist")
@role_required("learner")
def toggle_wishlist(user, course_id):

    course = Course.query.get(course_id)

    if not course:
        return jsonify({
            "error": "Course not found"
        }), 404

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    item = Wishlist.query.filter_by(
        learner_id=learner.id,
        course_id=course_id
    ).first()

    if item:

        db.session.delete(item)
        wishlisted = False

    else:

        db.session.add(
            Wishlist(
                learner_id=learner.id,
                course_id=course_id
            )
        )

        wishlisted = True

    db.session.commit()

    return jsonify({
        "wishlisted": wishlisted
    })


# =========================================================
# LEARNER - LESSON PROGRESS
# =========================================================

@api.put("/lessons/<lesson_id>/progress")
@role_required("learner")
def lesson_progress(user, lesson_id):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    lesson = Lesson.query.get_or_404(
        lesson_id
    )

    data = request.get_json(silent=True) or {}

    completed = bool(
        data.get("completed", True)
    )

    row = LessonProgress.query.filter_by(
        learner_id=learner.id,
        lesson_id=lesson.id
    ).first()

    if not row:

        row = LessonProgress(
            learner_id=learner.id,
            lesson_id=lesson.id
        )

        db.session.add(row)

    row.completed = completed
    row.updated_at = datetime.utcnow()

    module = Module.query.get(
        lesson.module_id
    )

    enrollment = Enrollment.query.filter_by(
        learner_id=learner.id,
        course_id=module.course_id
    ).first()

    if enrollment:

        total = Lesson.query.join(
            Module
        ).filter(
            Module.course_id == module.course_id
        ).count()

        completed_count = (
            LessonProgress.query
            .join(
                Lesson,
                LessonProgress.lesson_id == Lesson.id
            )
            .join(
                Module,
                Lesson.module_id == Module.id
            )
            .filter(
                LessonProgress.learner_id == learner.id,
                LessonProgress.completed.is_(True),
                Module.course_id == module.course_id
            )
            .count()
        )

        enrollment.progress = (
            round((completed_count / total) * 100)
            if total else 0
        )

    db.session.commit()

    return jsonify({
        "message": "Progress updated",
        "completed": completed,
        "courseProgress": (
            enrollment.progress
            if enrollment else 0
        )
    })


# =========================================================
# LEARNER DASHBOARD
# =========================================================

@api.get("/dashboard")
@role_required("learner")
def learner_dashboard(user):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    enrollments = Enrollment.query.filter_by(
        learner_id=learner.id
    ).all()

    courses_data = []

    for enrollment in enrollments:

        course = Course.query.get(
            enrollment.course_id
        )

        if course:
            courses_data.append(
                course_json(
                    course,
                    enrollment.progress
                )
            )

    return jsonify({
        "user": user_json(user),

        "stats": {
            "coursesEnrolled": len(enrollments),
            "certificates": Certificate.query.filter_by(
                learner_id=learner.id
            ).count(),
            "assignments": AssignmentSubmission.query.filter_by(
                learner_id=learner.id
            ).count(),
            "assessments": QuizAttempt.query.filter_by(
                learner_id=learner.id
            ).count(),
            "learningTime": calculate_learning_time(learner.id)
        },

        "courses": courses_data
    })


# =========================================================
# TRAINER DASHBOARD
# =========================================================

@api.get("/trainer/dashboard")
@role_required("trainer")
def trainer_dashboard(user):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    if not trainer:
        return jsonify({
            "error": "Trainer profile not found"
        }), 404

    courses = Course.query.filter_by(
        trainer_id=trainer.id
    ).all()

    return jsonify({
        "user": user_json(user),

        "stats": {
            "courses": len(courses),
            "assignments": Assignment.query.filter_by(
                trainer_id=trainer.id
            ).count(),
            "students": Enrollment.query
            .join(Course)
            .filter(
                Course.trainer_id == trainer.id
            ).count()
        },

        "courses": [
            course_json(c)
            for c in courses
        ]
    })


# =========================================================
# TRAINER - CREATE COURSE
# =========================================================

@api.post("/trainer/courses")
@role_required("trainer")
def trainer_create_course(user):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    if not trainer:
        return jsonify({
            "error": "Trainer profile not found"
        }), 404

    data = request.get_json(silent=True) or {}

    course_id = data.get("id", "").strip()
    title = data.get("title", "").strip()

    if not course_id or not title:
        return jsonify({
            "error": "Course id and title are required"
        }), 400

    if Course.query.get(course_id):
        return jsonify({
            "error": "Course id already exists"
        }), 409

    course = Course(
        id=course_id,
        trainer_id=trainer.id,
        title=title,
        level=data.get("level", "Beginner"),
        description=data.get("description", ""),
        thumbnail=data.get("thumbnail", ""),
        published=data.get("published", False)
    )

    db.session.add(course)
    db.session.commit()

    return jsonify({
        "message": "Course created",
        "course": course_json(course)
    }), 201


# =========================================================
# TRAINER - MY COURSES
# =========================================================

@api.get("/trainer/courses")
@role_required("trainer")
def trainer_courses(user):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    courses = Course.query.filter_by(
        trainer_id=trainer.id
    ).all()

    return jsonify({
        "courses": [
            course_json(c)
            for c in courses
        ]
    })


# =========================================================
# TRAINER - UPDATE COURSE
# =========================================================

@api.put("/trainer/courses/<course_id>")
@role_required("trainer")
def trainer_update_course(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    data = request.get_json(silent=True) or {}

    if "title" in data:
        course.title = data["title"]

    if "level" in data:
        course.level = data["level"]

    if "description" in data:
        course.description = data["description"]

    if "thumbnail" in data:
        course.thumbnail = data["thumbnail"]

    if "published" in data:
        course.published = bool(
            data["published"]
        )

    db.session.commit()

    return jsonify({
        "message": "Course updated",
        "course": course_json(course)
    })


# =========================================================
# TRAINER - DELETE COURSE
# =========================================================

@api.delete("/trainer/courses/<course_id>")
@role_required("trainer")
def trainer_delete_course(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    course.published = False

    db.session.commit()

    return jsonify({
        "message": "Course unpublished successfully"
    })


# =========================================================
# TRAINER - CREATE MODULE
# =========================================================

@api.post("/trainer/courses/<course_id>/modules")
@role_required("trainer")
def trainer_create_module(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "error": "Module title is required"
        }), 400

    module = Module(
        course_id=course.id,
        title=title,
        order_no=int(
            data.get("order_no", 1)
        )
    )

    db.session.add(module)
    db.session.commit()

    return jsonify({
        "message": "Module created",
        "module": {
            "id": module.id,
            "course_id": module.course_id,
            "title": module.title,
            "order_no": module.order_no
        }
    }), 201


# =========================================================
# TRAINER - UPDATE MODULE
# =========================================================

@api.put("/trainer/modules/<int:module_id>")
@role_required("trainer")
def trainer_update_module(user, module_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    if not trainer:
        return jsonify({
            "error": "Trainer profile not found"
        }), 404

    module = Module.query.get_or_404(
        module_id
    )

    course = Course.query.get_or_404(
        module.course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this module"
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    title = data.get(
        "title",
        module.title
    )

    if not isinstance(title, str):
        return jsonify({
            "error": "Module title must be text"
        }), 400

    title = title.strip()

    if not title:
        return jsonify({
            "error": "Module title is required"
        }), 400

    module.title = title

    if "order_no" in data:
        try:
            module.order_no = int(
                data["order_no"]
            )
        except (TypeError, ValueError):
            return jsonify({
                "error": "Invalid module order"
            }), 400

    db.session.commit()

    return jsonify({
        "message": "Module updated successfully",
        "module": {
            "id": module.id,
            "course_id": module.course_id,
            "title": module.title,
            "module": module.title,
            "order_no": module.order_no
        }
    })


# =========================================================
# TRAINER - CREATE LESSON
# =========================================================

@api.post("/trainer/modules/<int:module_id>/lessons")
@role_required("trainer")
def trainer_create_lesson(user, module_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    module = Module.query.get_or_404(
        module_id
    )

    course = Course.query.get_or_404(
        module.course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    data = request.get_json(silent=True) or {}

    lesson_id = data.get("id", "").strip()
    title = data.get("title", "").strip()

    if not lesson_id or not title:
        return jsonify({
            "error": "Lesson id and title are required"
        }), 400

    if Lesson.query.get(lesson_id):
        return jsonify({
            "error": "Lesson id already exists"
        }), 409

    lesson = Lesson(
        id=lesson_id,
        module_id=module.id,
        title=title,
        content=data.get("content", ""),
        video_url=data.get("video_url", ""),
        pdf_url=data.get("pdf_url", ""),
        duration=data.get("duration", "00:00"),
        order_no=int(
            data.get("order_no", 1)
        )
    )

    db.session.add(lesson)
    db.session.commit()

    return jsonify({
        "message": "Lesson created",
        "lesson": {
            "id": lesson.id,
            "module_id": lesson.module_id,
            "title": lesson.title,
            "duration": lesson.duration
        }
    }), 201



# =========================================================
# TRAINER - UPLOAD REAL LESSON VIDEO
# =========================================================

# =========================================================
# TRAINER - UPLOAD LESSON VIDEO
# =========================================================

@api.post("/trainer/lessons/<lesson_id>/video")
@role_required("trainer")
def trainer_upload_lesson_video(user, lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    trainer, course = lesson_owner(user, lesson)

    if not trainer:
        return jsonify({"error": "Trainer profile not found"}), 404
    if not course:
        return jsonify({"error": "You do not own this course"}), 403

    video = request.files.get("video") or request.files.get("file")
    if not video or not video.filename:
        return jsonify({"error": "Video file is required"}), 400

    if not allowed_extension(video.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify({"error": "Only MP4, WebM, MOV, AVI and MKV videos are allowed"}), 400

    original_name = secure_filename(video.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"{timestamp}_{original_name}"
    folder = resource_folder(lesson.id, "video")
    file_path = os.path.join(folder, filename)

    try:
        video.save(file_path)
    except Exception as error:
        print("VIDEO UPLOAD ERROR:", error)
        return jsonify({"error": "Unable to save video file"}), 500

    # Keep the latest video in the existing Lesson column so the current
    # learner video player continues to work. All uploaded videos remain
    # available through the resources endpoint.
    lesson.video_url = resource_url(lesson.id, "video", filename)
    db.session.commit()

    return jsonify({
        "message": "Video uploaded successfully",
        "lesson_id": lesson.id,
        "video_url": lesson.video_url,
        "resources": lesson_resource_list(lesson.id)
    }), 201


# Backward-compatible alias used by older frontend code.
@api.post("/trainer/lessons/<lesson_id>/resources/video")
@role_required("trainer")
def trainer_upload_lesson_video_resource(user, lesson_id):
    return trainer_upload_lesson_video(user, lesson_id)


# =========================================================
# SERVE LESSON VIDEOS
# =========================================================

@api.get("/videos/<filename>")
@token_required
def serve_video(user, filename):

    # Support legacy files stored directly in uploads/videos.
    if os.path.isfile(os.path.join(VIDEO_UPLOAD_ROOT, filename)):
        return send_from_directory(VIDEO_UPLOAD_ROOT, filename)

    # New multi-resource videos are stored in lesson subfolders.
    safe_filename = secure_filename(os.path.basename(filename))
    for lesson_dir in os.listdir(VIDEO_UPLOAD_ROOT):
        folder = os.path.join(VIDEO_UPLOAD_ROOT, lesson_dir)
        candidate = os.path.join(folder, safe_filename)
        if os.path.isfile(candidate):
            return send_from_directory(folder, safe_filename)

    return jsonify({"error": "Video not found"}), 404


# =========================================================
# TRAINER - UPDATE LESSON DURATION
# =========================================================

@api.put("/trainer/lessons/<lesson_id>/duration")
@role_required("trainer")
def trainer_update_lesson_duration(user, lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    trainer, course = lesson_owner(user, lesson)

    if not trainer:
        return jsonify({"error": "Trainer profile not found"}), 404
    if not course:
        return jsonify({"error": "You do not own this course"}), 403

    data = request.get_json(silent=True) or {}
    duration = str(data.get("duration", "")).strip()

    if not duration:
        return jsonify({"error": "Duration is required"}), 400

    try:
        parts = [int(x) for x in duration.split(":")]
        if len(parts) == 2:
            minutes, seconds = parts
            if minutes < 0 or not 0 <= seconds < 60:
                raise ValueError
            normalized = f"{minutes:02d}:{seconds:02d}"
        elif len(parts) == 3:
            hours, minutes, seconds = parts
            if hours < 0 or not 0 <= minutes < 60 or not 0 <= seconds < 60:
                raise ValueError
            normalized = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Duration must be MM:SS or HH:MM:SS"}), 400

    lesson.duration = normalized
    db.session.commit()

    return jsonify({
        "message": "Lesson duration updated successfully",
        "lesson": {
            "id": lesson.id,
            "title": lesson.title,
            "duration": lesson.duration
        }
    })


# =========================================================
# TRAINER - UPLOAD LESSON PDF
# =========================================================

@api.post("/trainer/lessons/<lesson_id>/pdf")
@role_required("trainer")
def trainer_upload_lesson_pdf(user, lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    trainer, course = lesson_owner(user, lesson)

    if not trainer:
        return jsonify({"error": "Trainer profile not found"}), 404
    if not course:
        return jsonify({"error": "You do not own this course"}), 403

    pdf = request.files.get("pdf") or request.files.get("file")
    if not pdf or not pdf.filename:
        return jsonify({"error": "PDF file is required"}), 400

    if not allowed_extension(pdf.filename, ALLOWED_PDF_EXTENSIONS):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    original_name = secure_filename(pdf.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"{timestamp}_{original_name}"
    folder = resource_folder(lesson.id, "pdf")
    file_path = os.path.join(folder, filename)

    try:
        pdf.save(file_path)
    except Exception as error:
        print("PDF UPLOAD ERROR:", error)
        return jsonify({"error": "Unable to save PDF file"}), 500

    lesson.pdf_url = resource_url(lesson.id, "pdf", filename)
    db.session.commit()

    return jsonify({
        "message": "PDF uploaded successfully",
        "lesson_id": lesson.id,
        "pdf_url": lesson.pdf_url,
        "resources": lesson_resource_list(lesson.id)
    }), 201


@api.post("/trainer/lessons/<lesson_id>/resources/pdf")
@role_required("trainer")
def trainer_upload_lesson_pdf_resource(user, lesson_id):
    return trainer_upload_lesson_pdf(user, lesson_id)


# =========================================================
# LESSON RESOURCES - LIST
# =========================================================

@api.get("/lessons/<lesson_id>/resources")
@token_required
def get_lesson_resources(user, lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify({
        "lessonId": lesson.id,
        "resources": lesson_resource_list(lesson.id)
    })


# =========================================================
# LESSON RESOURCE - VIEW
# =========================================================

@api.get("/lessons/<lesson_id>/resources/<resource_type>/<path:filename>")
@token_required
def view_lesson_resource(user, lesson_id, resource_type, filename):
    lesson = Lesson.query.get_or_404(lesson_id)

    if resource_type not in {"video", "pdf"}:
        return jsonify({"error": "Invalid resource type"}), 400

    safe_name = secure_filename(os.path.basename(filename))
    if safe_name != filename:
        filename = safe_name

    folder = resource_folder(lesson.id, resource_type)
    full_path = os.path.join(folder, filename)

    if not os.path.isfile(full_path):
        return jsonify({"error": "Resource not found"}), 404

    return send_from_directory(
        folder,
        filename,
        as_attachment=False
    )


# =========================================================
# TRAINER - DELETE LESSON RESOURCE
# =========================================================

@api.delete("/trainer/lessons/<lesson_id>/resources/<resource_type>/<path:filename>")
@role_required("trainer")
def delete_lesson_resource(user, lesson_id, resource_type, filename):
    lesson = Lesson.query.get_or_404(lesson_id)
    trainer, course = lesson_owner(user, lesson)

    if not trainer:
        return jsonify({"error": "Trainer profile not found"}), 404
    if not course:
        return jsonify({"error": "You do not own this course"}), 403
    if resource_type not in {"video", "pdf"}:
        return jsonify({"error": "Invalid resource type"}), 400

    safe_name = secure_filename(os.path.basename(filename))
    folder = resource_folder(lesson.id, resource_type)
    full_path = os.path.join(folder, safe_name)

    if not os.path.isfile(full_path):
        return jsonify({"error": "Resource not found"}), 404

    try:
        os.remove(full_path)
    except OSError as error:
        print("RESOURCE DELETE ERROR:", error)
        return jsonify({"error": "Unable to delete resource"}), 500

    remaining = lesson_resource_list(lesson.id)

    # Keep legacy single-file fields pointing to an existing resource.
    same_type = [r for r in remaining if r["type"] == resource_type]
    if resource_type == "video" and lesson.video_url and filename in lesson.video_url:
        lesson.video_url = same_type[-1]["url"] if same_type else ""
    if resource_type == "pdf" and lesson.pdf_url and filename in lesson.pdf_url:
        lesson.pdf_url = same_type[-1]["url"] if same_type else ""

    db.session.commit()

    return jsonify({
        "message": "Resource deleted successfully",
        "resources": remaining
    })


# =========================================================
# TRAINER - UPLOAD COURSE DOCUMENT
# =========================================================

@api.post("/trainer/courses/<course_id>/documents")
@role_required("trainer")
def trainer_upload_document(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    if not trainer:
        return jsonify({
            "error": "Trainer profile not found"
        }), 404

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    if "file" not in request.files:
        return jsonify({
            "error": "Document file is required"
        }), 400

    document_file = request.files["file"]

    if not document_file.filename:
        return jsonify({
            "error": "No document selected"
        }), 400

    allowed_extensions = {
        "pdf",
        "doc",
        "docx",
        "ppt",
        "pptx",
        "txt"
    }

    extension = document_file.filename.rsplit(
        ".", 1
    )[-1].lower()

    if extension not in allowed_extensions:
        return jsonify({
            "error": "Only PDF, DOC, DOCX, PPT, PPTX and TXT files are allowed"
        }), 400

    title = request.form.get(
        "title",
        document_file.filename
    ).strip()

    if not title:
        title = document_file.filename

    original_filename = document_file.filename

    filename = secure_filename(
        original_filename
    )

    timestamp = datetime.utcnow().strftime(
        "%Y%m%d%H%M%S%f"
    )

    filename = f"{timestamp}_{filename}"

    upload_folder = os.path.abspath(
        os.path.join(
            current_app.root_path,
            "..",
            "uploads",
            "documents"
        )
    )

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_folder,
        filename
    )

    document_file.save(file_path)

    document = CourseDocument(
        course_id=course.id,
        title=title,
        file_name=original_filename,
        file_path=file_path
    )

    db.session.add(document)
    db.session.commit()

    return jsonify({
        "message": "Document uploaded successfully",
        "document": {
            "id": document.id,
            "course_id": document.course_id,
            "title": document.title,
            "file_name": document.file_name,
            "uploaded_at": (
                document.uploaded_at.isoformat()
                if document.uploaded_at
                else None
            )
        }
    }), 201


# =========================================================
# LEARNER - VIEW COURSE DOCUMENTS
# =========================================================

@api.get("/learner/courses/<course_id>/documents")
@role_required("learner")
def learner_course_documents(user, course_id):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    enrollment = Enrollment.query.filter_by(
        learner_id=learner.id,
        course_id=course_id,
        status="active"
    ).first()

    if not enrollment:
        return jsonify({
            "error": "You are not enrolled in this course"
        }), 403

    documents = CourseDocument.query.filter_by(
        course_id=course_id
    ).order_by(
        CourseDocument.uploaded_at.desc()
    ).all()

    return jsonify({
        "course_id": course_id,
        "documents": [
            {
                "id": document.id,
                "title": document.title,
                "file_name": document.file_name,
                "uploaded_at": (
                    document.uploaded_at.isoformat()
                    if document.uploaded_at
                    else None
                )
            }
            for document in documents
        ]
    })


# =========================================================
# LEARNER - DOWNLOAD COURSE DOCUMENT
# =========================================================

@api.get("/learner/documents/<int:document_id>/download")
@role_required("learner")
def learner_download_document(user, document_id):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    if not learner:
        return jsonify({
            "error": "Learner profile not found"
        }), 404

    document = CourseDocument.query.get_or_404(
        document_id
    )

    enrollment = Enrollment.query.filter_by(
        learner_id=learner.id,
        course_id=document.course_id,
        status="active"
    ).first()

    if not enrollment:
        return jsonify({
            "error": "You are not enrolled in this course"
        }), 403

    if not os.path.exists(
        document.file_path
    ):
        return jsonify({
            "error": "Document file not found"
        }), 404

    return send_from_directory(
        os.path.dirname(document.file_path),
        os.path.basename(document.file_path),
        as_attachment=True,
        download_name=document.file_name
    )


# =========================================================
# TRAINER - CREATE ASSIGNMENT
# =========================================================

@api.post("/trainer/courses/<course_id>/assignments")
@role_required("trainer")
def trainer_create_assignment(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "error": "Assignment title is required"
        }), 400

    assignment = Assignment(
        course_id=course.id,
        trainer_id=trainer.id,
        title=title,
        description=data.get("description", "")
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify({
        "message": "Assignment created",
        "assignment": {
            "id": assignment.id,
            "title": assignment.title,
            "course_id": assignment.course_id
        }
    }), 201


# =========================================================
# TRAINER - CREATE QUIZ
# =========================================================

@api.post("/trainer/courses/<course_id>/quizzes")
@role_required("trainer")
def trainer_create_quiz(user, course_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    course = Course.query.get_or_404(
        course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this course"
        }), 403

    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "error": "Quiz title is required"
        }), 400

    quiz = Quiz(
        course_id=course.id,
        title=title,
        description=data.get("description", ""),
        total_marks=int(
            data.get("total_marks", 0)
        )
    )

    db.session.add(quiz)
    db.session.commit()

    return jsonify({
        "message": "Quiz created",
        "quiz": {
            "id": quiz.id,
            "course_id": quiz.course_id,
            "title": quiz.title,
            "total_marks": quiz.total_marks
        }
    }), 201


# =========================================================
# TRAINER - ADD QUESTION
# =========================================================

@api.post("/trainer/quizzes/<int:quiz_id>/questions")
@role_required("trainer")
def trainer_add_question(user, quiz_id):

    trainer = Trainer.query.filter_by(
        user_id=user.id
    ).first()

    quiz = Quiz.query.get_or_404(
        quiz_id
    )

    course = Course.query.get_or_404(
        quiz.course_id
    )

    if course.trainer_id != trainer.id:
        return jsonify({
            "error": "You do not own this quiz"
        }), 403

    data = request.get_json(silent=True) or {}

    question_text = data.get(
        "question_text",
        ""
    ).strip()

    if not question_text:
        return jsonify({
            "error": "Question text is required"
        }), 400

    question = Question(
        quiz_id=quiz.id,
        question_text=question_text,
        option_a=data.get("option_a"),
        option_b=data.get("option_b"),
        option_c=data.get("option_c"),
        option_d=data.get("option_d"),
        correct_answer=data.get("correct_answer"),
        marks=int(
            data.get("marks", 1)
        )
    )

    db.session.add(question)
    db.session.commit()

    return jsonify({
        "message": "Question added",
        "question": {
            "id": question.id,
            "quiz_id": question.quiz_id,
            "question_text": question.question_text
        }
    }), 201


# =========================================================
# LEARNER - SUBMIT ASSIGNMENT
# =========================================================

@api.post("/learner/assignments/<int:assignment_id>/submit")
@role_required("learner")
def learner_submit_assignment(user, assignment_id):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    assignment = Assignment.query.get_or_404(
        assignment_id
    )

    data = request.get_json(silent=True) or {}

    submission = data.get(
        "submission",
        ""
    ).strip()

    if not submission:
        return jsonify({
            "error": "Submission is required"
        }), 400

    row = AssignmentSubmission(
        assignment_id=assignment.id,
        learner_id=learner.id,
        submission=submission,
        submitted_at=datetime.utcnow()
    )

    db.session.add(row)
    db.session.commit()

    return jsonify({
        "message": "Assignment submitted",
        "submission_id": row.id
    }), 201


# =========================================================
# LEARNER - QUIZ ATTEMPT
# =========================================================

@api.post("/learner/quizzes/<int:quiz_id>/attempt")
@role_required("learner")
def learner_quiz_attempt(user, quiz_id):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    quiz = Quiz.query.get_or_404(
        quiz_id
    )

    data = request.get_json(silent=True) or {}

    score = int(
        data.get("score", 0)
    )

    total = int(
        data.get(
            "total",
            quiz.total_marks
        )
    )

    if score < 0 or score > total:
        return jsonify({
            "error": "Invalid score"
        }), 400

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        learner_id=learner.id,
        score=score,
        total=total
    )

    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        "message": "Quiz attempt saved",
        "attempt": {
            "id": attempt.id,
            "score": attempt.score,
            "total": attempt.total
        }
    }), 201


@api.get("/learner/quiz-attempts")
@role_required("learner")
def learner_quiz_attempts(user):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    attempts = QuizAttempt.query.filter_by(
        learner_id=learner.id
    ).order_by(
        QuizAttempt.attempted_at.desc()
    ).all()

    return jsonify({
        "attempts": [
            {
                "id": a.id,
                "quiz_id": a.quiz_id,
                "score": a.score,
                "total": a.total,
                "attempted_at": (
                    a.attempted_at.isoformat()
                    if a.attempted_at else None
                )
            }
            for a in attempts
        ]
    })


# =========================================================
# CERTIFICATES
# =========================================================

@api.get("/learner/certificates")
@role_required("learner")
def learner_certificates(user):

    learner = Learner.query.filter_by(
        user_id=user.id
    ).first()

    certificates = Certificate.query.filter_by(
        learner_id=learner.id
    ).all()

    return jsonify({
        "certificates": [
            {
                "id": c.id,
                "course_id": c.course_id,
                "certificate_number": c.certificate_number,
                "issue_date": (
                    c.issue_date.isoformat()
                    if c.issue_date else None
                ),
                "status": c.status
            }
            for c in certificates
        ]
    })


# =========================================================
# DISCUSSION / COMMUNITY
# =========================================================

@api.get("/lessons/<lesson_id>/discussions")
@token_required
def discussions(user, lesson_id):

    rows = Discussion.query.filter_by(
        lesson_id=lesson_id
    ).order_by(
        Discussion.created_at.asc()
    ).all()

    result = []

    for d in rows:

        discussion_user = User.query.get(
            d.user_id
        )

        result.append({
            "id": d.id,
            "message": d.message,
            "user": (
                discussion_user.name
                if discussion_user else None
            ),
            "createdAt": (
                d.created_at.isoformat()
                if d.created_at else None
            )
        })

    return jsonify({
        "discussions": result
    })


@api.post("/lessons/<lesson_id>/discussions")
@token_required
def create_discussion(user, lesson_id):

    if not Lesson.query.get(lesson_id):
        return jsonify({
            "error": "Lesson not found"
        }), 404

    message = (
        request.get_json(silent=True) or {}
    ).get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Message is required"
        }), 400

    row = Discussion(
        user_id=user.id,
        lesson_id=lesson_id,
        message=message
    )

    db.session.add(row)
    db.session.commit()

    return jsonify({
        "message": "Discussion posted",
        "discussion": {
            "id": row.id,
            "message": row.message,
            "user": user.name,
            "createdAt": row.created_at.isoformat()
        }
    }), 201


// routes/organiser.js
import { Router } from "express";
import { requireOrganiser } from "../middlewares/requireAuth.js";
import { coursesDb, sessionsDb } from "../models/_db.js";
import { BookingModel } from "../models/bookingModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { CourseModel } from "../models/courseModel.js";

const router = Router();

// GET /organiser
router.get("/organiser", requireOrganiser, (req, res) => {
  res.render("organiser_dashboard", {
    title: "Organiser Dashboard",
    user: req.session.user,
  });
});

// GET /organiser/courses
router.get("/organiser/courses", requireOrganiser, async (req, res) => {
  const courses = await CourseModel.listAll();
  res.render("organiser_courses", {
    title: "Manage Courses",
    user: req.session.user,
    courses,
  });
});

// GET /organiser/courses/new
router.get("/organiser/courses/new", requireOrganiser, (req, res) => {
  res.render("organiser_courses_new", {
    title: "Add New Course",
    user: req.session.user,
  });
});

// GET /organiser/courses/:id/edit
router.get("/organiser/courses/:id/edit", requireOrganiser, async (req, res) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) {
    return res.status(404).send("Course not found");
  }

  course.isBeginner = course.level === "Beginner";
  course.isIntermediate = course.level === "Intermediate";
  course.isAdvanced = course.level === "Advanced";

  res.render("organiser_course_edit", {
    title: "Edit Course",
    user: req.session.user,
    course,
  });
});

// POST /organiser/courses
router.post("/organiser/courses", requireOrganiser, async (req, res) => {
  const {
    title,
    description,
    level,
    duration,
    type,
    allowDropIn,
    startDate,
    endDate,
    location,
    price
  } = req.body;

    await CourseModel.create({
    title,
    description,
    level,
    duration: Number(duration),
    type: type || "Yoga",
    allowDropIn: allowDropIn === "on",
    startDate: startDate || null,
    endDate: endDate || null,
    location,
    price: Number(price),
    createdAt: new Date().toISOString(),
    });

  res.redirect("/organiser/courses");
});

// POST /organiser/courses/:id
router.post("/organiser/courses/:id", requireOrganiser, async (req, res) => {
  const {
    title,
    description,
    level,
    duration,
    type,
    allowDropIn,
    startDate,
    endDate,
    location,
    price
  } = req.body;

  await CourseModel.update(req.params.id, {
  title,
  description,
  level,
  duration: Number(duration),
  type: type || "Yoga",
  allowDropIn: allowDropIn === "on",
  startDate: startDate || null,
  endDate: endDate || null,
  location,
  price: Number(price),
});

  res.redirect("/organiser/courses");
});

// GET /organiser/courses/:id/delete
router.get("/organiser/courses/:id/delete", requireOrganiser, async (req, res) => {
  await CourseModel.delete(req.params.id);
  res.redirect("/organiser/courses");
});

// GET /organiser/courses/:id/sessions
router.get(
  "/organiser/courses/:id/sessions",
  requireOrganiser,
  async (req, res) => {
    const course = await coursesDb.findOne({ _id: req.params.id });
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const sessions = await SessionModel.listByCourse(req.params.id);

    res.render("organiser_sessions", {
      title: "Manage Sessions",
      user: req.session.user,
      course,
      sessions,
    });
  }
);

// GET /organiser/courses/:id/sessions/new
router.get(
  "/organiser/courses/:id/sessions/new",
  requireOrganiser,
  async (req, res) => {
    const course = await coursesDb.findOne({ _id: req.params.id });

    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("organiser_session_new", {
      title: "Add New Sessions",
      user: req.session.user,
      course,
    });
  }
);

// POST /organiser/courses/:id/sessions
router.post(
  "/organiser/courses/:id/sessions",
  requireOrganiser,
  async (req, res) => {
    const { date, time, capacity } = req.body;

    await SessionModel.create({
    courseId: req.params.id,
    date,
    time,
    startDateTime: `${date} ${time}`,
    endDateTime: `${date} ${time}`,
    capacity: Number(capacity),
    bookedCount: 0,
    createdAt: new Date().toISOString(),
    });

    res.redirect(`/organiser/courses/${req.params.id}/sessions`);
  }
);

// GET /organiser/sessions/:id/edit
router.get(
  "/organiser/sessions/:id/edit",
  requireOrganiser,
  async (req, res) => {
    const session = await SessionModel.findById(req.params.id);

    if (!session) {
      return res.status(404).send("Session not found");
    }

    const course = await coursesDb.findOne({ _id: session.courseId });

    res.render("organiser_session_edit", {
      title: "Edit Session",
      user: req.session.user,
      session,
      course,
    });
  }
);

// POST /organiser/sessions/:id
router.post(
  "/organiser/sessions/:id",
  requireOrganiser,
  async (req, res) => {
    const { date, time, capacity } = req.body;

    await SessionModel.update(req.params.id, {
        date,
        time,
        startDateTime: `${date} ${time}`,
        endDateTime: `${date} ${time}`,
        capacity: Number(capacity),
    });

    const updatedSession = await sessionsDb.findOne({ _id: req.params.id });

    res.redirect(`/organiser/courses/${updatedSession.courseId}/sessions`);
  }
);

// GET /organiser/sessions/:id/delete
router.get(
  "/organiser/sessions/:id/delete",
  requireOrganiser,
  async (req, res) => {
    const session = await sessionsDb.findOne({ _id: req.params.id });

    if (!session) {
      return res.status(404).send("Session not found");
    }

    await SessionModel.delete(req.params.id);

    res.redirect(`/organiser/courses/${session.courseId}/sessions`);
  }
);

// GET /organiser/bookings (dashboard)
router.get("/organiser/bookings", requireOrganiser, async (req, res) => {
  const bookings = await BookingModel.listAll();

  const detailed = await Promise.all(
    bookings.map(async (b) => {
      const course = b.courseId
        ? await CourseModel.findById(b.courseId)
        : null;

      const session = b.sessionIds?.length
        ? await SessionModel.findById(b.sessionIds[0])
        : null;

      return {
        id: b._id,
        userId: b.userId,
        status: b.status,
        createdAt: b.createdAt,
        courseTitle: course?.title || "Unknown course",
        sessionDate: session?.startDateTime || "No session",
        capacity: session?.capacity || 0,
        booked: session?.bookedCount ?? 0,
      };
    })
  );

  res.render("organiser_bookings", {
    title: "All Bookings",
    user: req.session.user,
    bookings: detailed,
  });
});

// ------------------------------
// USER MANAGEMENT
// ------------------------------

import { usersDb } from "../models/_db.js";
// GET /organiser/users
router.get("/organiser/users", requireOrganiser, async (req, res) => {
  const users = await usersDb.find({}).sort({ createdAt: -1 });

  const decorated = users.map(u => ({
    ...u,
    isStudent: u.role === "student",
    isOrganiser: u.role === "organiser"
  }));

  res.render("organiser_users", {
    title: "Manage Users",
    user: req.session.user,
    users: decorated
  });
});

// POST /organiser/users/:id/promote
router.post("/organiser/users/:id/promote", requireOrganiser, async (req, res) => {
  await usersDb.update(
    { _id: req.params.id },
    { $set: { role: "organiser" } }
  );
  res.redirect("/organiser/users");
});

// POST /organiser/users/:id/demote
router.post("/organiser/users/:id/demote", requireOrganiser, async (req, res) => {
  await usersDb.update(
    { _id: req.params.id },
    { $set: { role: "student" } }
  );
  res.redirect("/organiser/users");
});

// POST /organiser/users/:id/delete
router.post("/organiser/users/:id/delete", requireOrganiser, async (req, res) => {
  await usersDb.remove({ _id: req.params.id }, {});
  res.redirect("/organiser/users");
});

// ------------------------------
// (PARTICIPANTS)
// ------------------------------


// GET /organiser/sessions/:id/participants
router.get("/organiser/sessions/:id/participants", requireOrganiser, async (req, res) => {
  const sessionId = req.params.id;

  // Find the session
  const session = await sessionsDb.findOne({ _id: sessionId });
  if (!session) {
    return res.status(404).send("Session not found");
  }

  // Find the course
  const course = await coursesDb.findOne({ _id: session.courseId });

  // Find bookings for this session
  const bookings = await BookingModel.listBySession(sessionId);

  // Join with user data
  const participants = await Promise.all(
    bookings.map(async (b) => {
      const user = await usersDb.findOne({ _id: b.userId });
      return {
        name: user?.name,
        email: user?.email,
        status: b.status,
        bookingId: b._id,
      };
    })
  );

  res.render("organiser_session_participants", {
    title: "Class List",
    user: req.session.user,
    course,
    session,
    participants,
  });
});

export default router;
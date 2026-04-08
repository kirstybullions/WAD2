// routes/views.js
import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
} from "../controllers/viewsController.js";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { requireLogin } from "../middlewares/requireAuth.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { BookingModel } from "../models/bookingModel.js";

const router = Router();

router.get("/", homePage);
router.get("/courses", async (req, res) => {
  const courses = await CourseModel.list();

  const enhancedCourses = await Promise.all(
    courses.map(async (course) => {
      const sessions = await SessionModel.listByCourse(course._id);

      // Convert date + time into real Date objects
      const parsedSessions = sessions.map(s => {
        const dateTime = new Date(`${s.date}T${s.time}`);
        return { ...s, dateTime };
      });

      // Sort by datetime
      parsedSessions.sort((a, b) => a.dateTime - b.dateTime);

      const first = parsedSessions[0];
      const last = parsedSessions[parsedSessions.length - 1];

      return {
        ...course,
        id: course._id,

        startDate: first ? first.date : "N/A",
        endDate: last ? last.date : "N/A",

        nextSession: first
          ? first.dateTime.toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short"
            })
          : "TBA",

        sessionsCount: parsedSessions.length,
      };
    })
  );

  res.render("courses", {
    title: "Upcoming Courses",
    courses: enhancedCourses,
    user: req.session.user
  });
});

router.get("/courses/:id", async (req, res) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) return res.status(404).send("Course not found");

  const sessions = await SessionModel.listByCourse(course._id);

  // Convert date + time into real Date objects
  const parsedSessions = sessions.map(s => {
    const dateTime = new Date(`${s.date}T${s.time}`);

    return {
        ...s,
      dateTime,
      startFormatted: dateTime.toLocaleString("en-GB", {
        dateStyle: "long",
        timeStyle: "short"
      }),
      endFormatted: dateTime.toLocaleString("en-GB", {
        dateStyle: "long",
        timeStyle: "short"
      })
    };
  });

  // Sort by datetime
  parsedSessions.sort((a, b) => a.dateTime - b.dateTime);

  const first = parsedSessions[0];
  const last = parsedSessions[parsedSessions.length - 1];

  res.render("course", {
    course,
    sessions: parsedSessions,
    startDate: first ? first.dateTime.toLocaleDateString("en-GB", { dateStyle: "long" }) : "N/A",
    endDate: last ? last.dateTime.toLocaleDateString("en-GB", { dateStyle: "long" }) : "N/A",
    user: req.session.user
  });
});
router.post("/courses/:id/book", postBookCourse);
router.post("/sessions/:id/book", postBookSession);
router.get("/booking-confirm/:bookingId", bookingConfirmationPage);

router.get("/bookings", requireLogin, async (req, res) => {
  const raw = await BookingModel.listByUser(req.session.user._id);

  const bookings = await Promise.all(
    raw.map(async (b) => {
      const course = b.courseId
        ? await CourseModel.findById(b.courseId)
        : null;

      const session = b.sessionIds?.length
        ? await SessionModel.findById(b.sessionIds[0])
        : null;

      return {
        _id: b._id,

        course: {
          title: course?.title || "Unknown course",
        },

        session: {
          date: session?.date || "",
          time: session?.time || "",
        },

        status: {
          isConfirmed: b.status === "CONFIRMED",
          isWaitlisted: b.status === "WAITLISTED",
          isCancelled: b.status === "CANCELLED",
        },

        isCancelled: b.status === "CANCELLED",
      };
    })
  );

  res.render("bookings", {
    title: "My Bookings",
    bookings,
  });
});

export default router;

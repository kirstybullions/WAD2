// routes/courses.js
import { Router } from "express";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

const router = Router();

// List courses 
router.get("/", async (req, res) => {
  const courses = await CourseModel.list();

  const enhancedCourses = await Promise.all(
    courses.map(async (course) => {
      const sessions = await SessionModel.listByCourse(course._id);

      // Convert each session into a real JS Date
      const parsedSessions = sessions.map(s => {
        const dateTime = new Date(`${s.date}T${s.time}`);
        return { ...s, dateTime };
      });

      // Sort by actual datetime
      parsedSessions.sort((a, b) => a.dateTime - b.dateTime);

      const first = parsedSessions[0];
      const last = parsedSessions[parsedSessions.length - 1];

      return {
        ...course,
        id: course._id,
        type: "Yoga",
        allowDropIn: true,

        startDate: first ? first.date : "N/A",
        endDate: last ? last.date : "N/A",

        nextSession: first
          ? first.dateTime.toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short"
            })
          : "No upcoming sessions",

        sessionsCount: parsedSessions.length,
      };
    })
  );

  res.json({ courses: enhancedCourses });
});

// Create course
router.post("/", async (req, res) => {
  const course = await CourseModel.create(req.body);
  res.status(201).json({ course });
});

// Get course + sessions
router.get("/:id", async (req, res) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  const sessions = await SessionModel.listByCourse(course._id);
  res.json({ course, sessions });
});

// GET /courses/:id/sessions (user-facing)
router.get("/:id/sessions", async (req, res) => {
  const course = await CourseModel.findById(req.params.id);

  if (!course) {
    return res.status(404).send("Course not found");
  }

  const sessions = await SessionModel.listByCourse(course._id);

  // Sort sessions by date
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.render("course_sessions", {
    title: course.title,
    user: req.session.user,
    course,
    sessions
  });
});
export default router;

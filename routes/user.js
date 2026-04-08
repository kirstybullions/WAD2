import { Router } from "express";
import { BookingModel } from "../models/bookingModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { CourseModel } from "../models/courseModel.js";

const router = Router();

router.get("/courses", async (req, res) => {
    const courses = await coursesDb.find({});

    const enhancedCourses = await Promise.all(
        courses.map(async course => {
            const sessions = await sessionsDb.find({ courseId: course._id });

            return {
                ...course,
                id: course._id,
                type: "Yoga", // or whatever you want
                allowDropIn: true, // or false
                startDate: sessions[0]?.date || "N/A",
                endDate: sessions[sessions.length - 1]?.date || "N/A",
                nextSession: sessions[0]?.date || "No upcoming sessions",
                sessionsCount: sessions.length
            };
        })
    );

    res.render("courses_list", {
        title: "Available Courses",
        user: req.session.user,
        courses: enhancedCourses,
    });
});

router.get("/courses/:id/sessions", async (req, res) => {
  const course = await CourseModel.findById(req.params.id);

  if (!course) {
    return res.status(404).send("Course not found");
  }

  const sessions = await SessionModel.listByCourse(course._id);
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.render("course_sessions", {
    title: course.title,
    user: req.session.user,
    course,
    sessions
  });
});


router.get("/my-bookings", async (req, res) => {
  const bookings = await BookingModel.listByUser(req.session.user._id);

  const detailed = await Promise.all(
    bookings.map(async (b) => {
      const session = await SessionModel.findById(b.sessionIds[0]);
      const course = await CourseModel.findById(b.courseId);

      return { ...b, session, course };
    })
  );

  res.render("my_bookings", {
    user: req.session.user,
    bookings: detailed
  });
});
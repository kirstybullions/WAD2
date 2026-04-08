
// routes/bookings.js
import { Router } from 'express';
import { bookCourse, bookSession, cancelBooking } from '../controllers/bookingController.js';
import { BookingModel } from "../models/bookingModel.js";
const router = Router();


router.post('/course', bookCourse);
router.post('/session', bookSession);
router.delete("/:bookingId", (req, res) => {
  console.log("DELETE HIT!", req.params.bookingId);
  cancelBooking(req, res);
});

export default router;

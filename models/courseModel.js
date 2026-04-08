// models/courseModel.js
import { coursesDb } from "./_db.js";

export const CourseModel = {
  async create(course) {
  return coursesDb.insert({
    title: course.title,
    description: course.description,
    level: course.level,
    duration: course.duration,
    type: course.type,
    allowDropIn: course.allowDropIn,
    startDate: course.startDate,
    endDate: course.endDate,
    location: course.location,
    price: course.price,
    createdAt: course.createdAt
  });
  },
  async findById(id) {
    return coursesDb.findOne({ _id: id });
  },
  async list(filter = {}) {
    return coursesDb.find(filter);
  },
  async update(id, patch) {
  await coursesDb.update({ _id: id }, { $set: patch });
  return this.findById(id);
  },
  async listAll() {
  return coursesDb.find({});
  },
  async delete(id) {
  return coursesDb.remove({ _id: id });
  }
};

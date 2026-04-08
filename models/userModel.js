
// models/userModel.js
import bcrypt from "bcrypt";
import { usersDb } from './_db.js';

export const UserModel = {
  //Creating a new user with a hashed password
  async create({ name, email, password, role = "student"}) {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    return usersDb.insert(user);
  },
  async findByEmail(email) {
    return usersDb.findOne({ email });
  },
  async findById(id) {
    return usersDb.findOne({ _id: id });
  },

  //Creating default organiser for video
  async ensureDefaultOrganiser() {
    const existing = await usersDb.findOne({ role: "organiser" });
    if (existing) return existing;

    return this.create({
      name: "Admin",
      email: "kirsty@yoga.com",
      password: "kirsty123",
      role: "organiser",
    });
  }
};
``

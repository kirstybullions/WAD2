// routes/auth.js 
import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../models/userModel.js";

const router = Router();

router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return res.render("login", { error: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.render("login", { error: "Invalid email or password" });
  }

  req.session.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isOrganiser: user.role === "organiser"
  };

  res.redirect("/");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

router.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await UserModel.create({ name, email, password, role: "student" });

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOrganiser: user.role === "organiser"

    };

    res.redirect("/");
  } catch (err) {
    res.render("register", { error: "Email already in use" });
  }
});

export default router;
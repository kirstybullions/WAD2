// middlewares/requireAuth.js
export function requireLogin(req, res, next){
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}
    
export function requireOrganiser(req, res, next){
    if (!req.session.user || req.session.user.role !== "organiser") {
      return res.status(403).render("error", {
        title: "Forbidden",
        message: "Organiser access only",
      });
    }
    next();
};
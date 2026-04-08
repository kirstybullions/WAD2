// middleware/authUser.js
export function attachCurrentUser(req, res, next){
    if(req.session && req.session.user) {
        req.user = req.session.user;
        res.locals.currentUser = req.session.user;
    } else {
        req.user = null;
        res.locals.currentUser = null;
    }
    next();
}
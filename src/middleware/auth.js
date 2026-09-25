export const loadSessionUser = (req, res, next) => {
  req.user = req.session.user || null;
  res.locals.user = req.user;
  next();
};

export const requireApiLogin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  next();
};

export const requirePageLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  next();
};

export const requireApiRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export const requirePageRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  if (req.user.role !== role) {
    return res.redirect("/403");
  }

  next();
};

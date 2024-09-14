exports.allow = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).send({
        status: "fail",
        message: "You are not allowed to acces this route",
      });
    }

    next();
  };
};

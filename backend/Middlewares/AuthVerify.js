import jwt from "jsonwebtoken";

const authVerify = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

export default authVerify;
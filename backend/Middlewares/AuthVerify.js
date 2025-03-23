import jwt from "jsonwebtoken";

const authVerify = (req, res, next) => {
  console.log(req.cookies);
  if (!req.cookies) {
    return res.status(400).json({ success: false, message: "Cookies are not enabled" });
  }
  
  const token = req.cookies.access_token;
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

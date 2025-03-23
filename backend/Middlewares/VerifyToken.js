import jwt from 'jsonwebtoken';

const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden: Invalid token" });
      }
      if (!allowedRoles.includes(decoded.user.user_type)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      req.user = decoded; 
      next();
    });
  };
};
  
export default verifyRole;
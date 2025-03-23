import jwt from 'jsonwebtoken';

const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(' ')[1];

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
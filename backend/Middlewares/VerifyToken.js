import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 

    console.log("Verifying: " + token);

    if (!token) {
        console.log("Unauthorized: No token provided")
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Forbidden: Invalid token")
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        req.user = decoded; 
        next();
    });
};

export default verifyToken;

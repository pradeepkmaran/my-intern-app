import jwt from "jsonwebtoken";
import getStudentUserModel from "../Models/StudentUser.js"; 
import { usersDB } from '../db.js';

const StudentUser = getStudentUserModel(usersDB);
const MyInternshipsController = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided 3" });
    }

    let email;
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
      }
      email = decoded.user.email;
    });

    const user = await StudentUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in the database" });
    }

    return res.status(200).json({ success: true, internships: user.internships });

  } catch (error) {
    console.error("Error fetching internships:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default MyInternshipsController;

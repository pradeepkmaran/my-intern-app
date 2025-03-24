import express from "express";
import jwt from "jsonwebtoken";
import { usersDB } from "../../db.js";
import getStudentUserModel from "../../Models/StudentUser.js";

const router = express.Router();
const StudentUser = getStudentUserModel(usersDB);

const StudentInternshipDetailsController = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.user.email;

    const user = await StudentUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const internshipId = req.params.internshipId;
    const internship = user.internships.find(
      (internship) => internship._id.toString() === internshipId
    );

    if (!internship) {
      return res.status(404).json({ success: false, message: "Internship not found" });
    }

    return res.status(200).json({ success: true, internship });
  } catch (error) {
    console.error("Error fetching internship details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default StudentInternshipDetailsController;
import express from "express";
import jwt from "jsonwebtoken";
import { usersDB } from "../../db.js";
import getStudentUserModel from "../../Models/StudentUser.js";

const router = express.Router();
const StudentUser = getStudentUserModel(usersDB);

const AllInternshipDetailsController = async (req, res) => {
  try {
    const studentDetails = await StudentUser.find().sort({register_number: 1});
    return res.status(200).json({ success: true, studentDetails });
  } catch (error) {
    console.error("Error fetching internship details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default AllInternshipDetailsController;
import express from "express";
import AllInternshipDetails from "../Controllers/FacultyControllers/AllInternshipDetailsController.js";

const FacultyRoute = express.Router();
FacultyRoute.get("/all-internships", AllInternshipDetails);

export default FacultyRoute;

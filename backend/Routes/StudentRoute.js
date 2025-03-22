import express from "express";
import { upload, UploadInternshipDetailsController } from "../Controllers/UploadInternshipDetailsController.js";
import MyInternshipsController from "../Controllers/MyInternshipsController.js"

const StudentRoute = express.Router();

StudentRoute.post("/upload-internship-details", upload.single("internshipFile"), UploadInternshipDetailsController);
StudentRoute.get("/my-internships", MyInternshipsController);

export default StudentRoute;

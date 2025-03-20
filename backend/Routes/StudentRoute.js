import express from "express";
import { upload, UploadInternshipDetailsController } from "../Controllers/UploadInternshipDetailsController.js";

const StudentRoute = express.Router();

StudentRoute.post("/upload-internship-details",
  upload.single("internshipFile"), 
  UploadInternshipDetailsController
);

export default StudentRoute;

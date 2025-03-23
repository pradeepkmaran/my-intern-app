import express from "express";
import { upload, UploadInternshipDetailsController } from "../Controllers/UploadInternshipDetailsController.js";
import MyInternshipsController from "../Controllers/MyInternshipsController.js"
import StudentInternshipDetailsController from "../Controllers/StudentInternshipDetailsController.js"
import StudentInternshipDetailsUpdateController from "../Controllers/StudentInternshipDetailsUpdateController.js"

const StudentRoute = express.Router();

StudentRoute.post("/upload-internship-details", upload.single("internshipFile"), UploadInternshipDetailsController);
StudentRoute.get("/my-internships", MyInternshipsController);
StudentRoute.get("/my-internships/:internshipId", StudentInternshipDetailsController);
StudentRoute.put("/my-internships/update/:internshipId", StudentInternshipDetailsUpdateController);

export default StudentRoute;

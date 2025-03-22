import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema({
  role: String,
  period: String,
  startDate: String,
  endDate: String,
  companyName: String,
  placementType: String,
  stipend: String,
  researchIndustry: String,
  location: String,
  permissionLetter: String,
  completionCertificate: String,
  internshipReport: String,
  studentFeedback: String,
  employerFeedback: String,
  proofLinks: [String]
});

const studentUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  register_number: { type: String, required: true },
  mobile_number: { type: String, required: true },
  section: { type: String, required: true },
  internships: [internshipSchema]
});

export default (connection) => connection.model("StudentUser", studentUserSchema, "student_users");

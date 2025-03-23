import multer from "multer";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import { usersDB } from "../db.js";
import getStudentUserModel from "../Models/StudentUser.js";

dotenv.config();

const FILE_TYPES = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const UPLOADS_DIR = "/tmp/uploads/";
const StudentUser = getStudentUserModel(usersDB);

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (FILE_TYPES.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG, JPEG"));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

async function authorize() {
  const CLIENT_API_KEY = JSON.parse(Buffer.from(process.env.CLIENT_API_KEY_JSON, 'base64').toString('utf-8'));
  const jwtClient = new google.auth.JWT(
    CLIENT_API_KEY.client_email,
    null,
    CLIENT_API_KEY.private_key,
    ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function uploadFile(authClient, filePath, fileName) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const fileMetaData = {
    name: fileName,
    parents: [process.env.DRIVE_FOLDER]
  };

  const response = await drive.files.create({
    resource: fileMetaData,
    media: {
      body: fs.createReadStream(filePath),
      mimeType: 'application/octet-stream'
    },
    fields: 'id'
  });

  return `https://drive.google.com/file/d/${response.data.id}/view?usp=sharing`;
}

async function appendToSheet(req, authClient, internshipData) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    internshipData.email = decoded.user.email; 
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:A`,
  });
  const nextSerialNo = response.data.values.length;

  const user = await StudentUser.findOne({ email: internshipData.email });
  if (!user) {
    throw new Error("User not found in the database.");
  }

  const studentDetails = {
    registerNumber: user.register_number || "N/A",
    studentName: user.name || "N/A",
    mobileNumber: user.mobile_number || "N/A",
    section: user.section || "N/A"
  };

  const internshipFields = [
    "role", "period", "startDate", "endDate", "companyName",
    "placementType", "stipend", "researchIndustry", "location",
    "permissionLetter", "completionCertificate", "internshipReport",
    "studentFeedback", "employerFeedback"
  ];

  const proofLinks = internshipData.proofLinks ? internshipData.proofLinks.join(', ') : "N/A";

  const values = [
    nextSerialNo, 
    studentDetails.registerNumber,
    studentDetails.studentName,
    studentDetails.mobileNumber,
    studentDetails.section,
    ...internshipFields.map(field => internshipData[field] || "N/A"),
    proofLinks
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:K`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  });

  console.log("Internship data added to sheets");
}

async function updateOnDB(req, internshipData) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(' ')[1];
    let email = null;
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new Error("Invalid or expired token.");
      }
      email = decoded.user.email;
    });
    
    const user = await StudentUser.findOne({ email });

    if (!user) {
      throw new Error("User not found in the database.");
    }

    const existingInternshipIndex = user.internships.findIndex(
      (internship) => internship.companyName === internshipData.companyName
    );
    
    if (existingInternshipIndex !== -1) {
      Object.assign(user.internships[existingInternshipIndex], internshipData);
    } else {
      user.internships.push(internshipData);
    }
    
    await user.save();
    
    console.log("Internship data added to DB");
    return { success: true, message: "Internship details updated." };
  } catch (error) {
    console.error("Error updating internship details:", error);
    return { success: false, message: error.message };
  }
}

const UploadInternshipDetailsController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "At least one file must be uploaded." });
    }
  
    const requiredFields = ["role", "period", "startDate", "endDate", "companyName", "placementType", "stipend", "researchIndustry", "location"];
    const allFields = ["role", "period", "startDate", "endDate", "companyName", "placementType", "stipend", "researchIndustry", "location", "permissionLetter", "completionCertificate", "internshipReport", "studentFeedback", "employerFeedback"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const authClient = await authorize();
    const proofLinks = [];  

    const newFileName = `${req.body.companyName}_${req.file.originalname}`;
    const newFilePath = path.join(path.dirname(req.file.path), newFileName);
    fs.renameSync(req.file.path, newFilePath);
    const driveLink = await uploadFile(authClient, newFilePath, newFileName);
    proofLinks.push(driveLink);
    fs.unlinkSync(newFilePath);

    const internshipDetails = {
      ...req.body,
      proofLinks
    };

    await appendToSheet(req, authClient, internshipDetails);
    await updateOnDB(req, internshipDetails);

    res.status(200).json({
      message: "Internship details uploaded successfully!",
      data: internshipDetails,
    });
  } catch (error) {
    console.error("Error uploading internship details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { upload, UploadInternshipDetailsController };
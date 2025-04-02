import multer from "multer";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';
import { usersDB } from "../../db.js";
import getStudentUserModel from "../../Models/StudentUser.js";

dotenv.config();

const FILE_TYPES = ['.pdf', '.doc', '.docx'];
const UPLOADS_DIR = "/tmp/uploads/";
const StudentUser = getStudentUserModel(usersDB);

// List of document types we support
const DOCUMENT_TYPES = [
  "permissionLetter",
  "offerLetter",
  "completionCertificate", 
  "internshipReport",
  "studentFeedback",
  "employerFeedback"
];

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
    cb(new Error("Invalid file type. Allowed: PDF, DOC, DOCX"));
  }
};

// Changed to handle multiple files (up to 6)
const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 100 * 1024 * 1024 }
}).array('documents', 6); // Allow up to 6 files

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

async function getOrCreateStudentFolder(authClient, studentRegNumber) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  
  // Check if folder already exists
  const response = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${studentRegNumber}' and '${process.env.DRIVE_FOLDER}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  
  if (response.data.files.length > 0) {
    // Folder exists, return the ID
    return response.data.files[0].id;
  } else {
    // Create new folder for the student
    const fileMetaData = {
      name: studentRegNumber,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.DRIVE_FOLDER]
    };
    
    const folder = await drive.files.create({
      resource: fileMetaData,
      fields: 'id'
    });
    
    return folder.data.id;
  }
}

async function uploadFile(authClient, filePath, fileName, folderID) {
  const drive = google.drive({ version: 'v3', auth: authClient });
  const fileMetaData = {
    name: fileName,
    parents: [folderID]
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

async function updateSpreadsheet(authClient, internshipData, studentRegNumber) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  // First, find the row with the matching register number
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:AQ`,
  });
  
  const rows = response.data.values || [];
  let rowIndex = -1;
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][1] == studentRegNumber) { // Index 1 contains register number
      rowIndex = i;
      break;
    }
  }

  console.log(rowIndex);
  
  if (rowIndex === -1) {
    // If no row found, create a new row for this student
    const user = await StudentUser.findOne({ register_number: studentRegNumber });
    if (!user) {
      throw new Error("User not found in the database.");
    }

    const studentDetails = {
      registerNumber: studentRegNumber,
      studentName: user.name || "N/A",
      mobileNumber: user.mobile_number || "N/A",
      section: user.section || "N/A"
    };

    const values = [
      rows.length, // Next serial number
      studentDetails.registerNumber,
      studentDetails.studentName,
      studentDetails.mobileNumber,
      studentDetails.section,
      // Fill other cells with the internship data
      internshipData.role || "N/A",
      internshipData.period || "N/A",
      internshipData.startDate || "N/A",
      internshipData.endDate || "N/A",
      internshipData.companyName || "N/A",
      internshipData.placementType || "N/A",
      internshipData.stipend || "N/A",
      internshipData.researchIndustry || "N/A",
      internshipData.location || "N/A"
    ];
    
    // Add document links and verification status - each doc type has its own column
    for (const docType of DOCUMENT_TYPES) {
      const docData = internshipData.documents;
      values.push(docData ? docData.link : "N/A");
      values.push(docData ? docData.verified : "No");
    }
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `${process.env.SHEET_NAME}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });
  } else {
    // Update existing row - determine column positions first
    // We're assuming the basic student and internship details occupy columns A-N
    const baseColumns = 14; // A through N for student details and basic internship info
    
    let updates = {};
    
    // Update the basic internship details
    updates[`${process.env.SHEET_NAME}!F${rowIndex+1}:N${rowIndex+1}`] = [[
      internshipData.role || rows[rowIndex][5] || "N/A",
      internshipData.period || rows[rowIndex][6] || "N/A",
      internshipData.startDate || rows[rowIndex][7] || "N/A",
      internshipData.endDate || rows[rowIndex][8] || "N/A",
      internshipData.companyName || rows[rowIndex][9] || "N/A",
      internshipData.placementType || rows[rowIndex][10] || "N/A",
      internshipData.stipend || rows[rowIndex][11] || "N/A",
      internshipData.researchIndustry || rows[rowIndex][12] || "N/A",
      internshipData.location || rows[rowIndex][13] || "N/A"
    ]];
    
    // Update the document links and verification status
    // Each document type takes 2 columns (link + verification status)
    DOCUMENT_TYPES.forEach((docType, index) => {
      const colIndex = baseColumns + (index * 2); // Link column
      const verifyColIndex = colIndex + 1; // Verification status column
      
      if (internshipData.documents && internshipData.documents[docType]) {
        // Update link column
        updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + colIndex)}${rowIndex+1}`] = 
          [[internshipData.documents[docType].link]];
        
        // Update verification status column
        updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + verifyColIndex)}${rowIndex+1}`] = 
          [[internshipData.documents[docType].verified]];
      }
    });
    
    // Perform batch update for all changes
    const requests = Object.keys(updates).map(range => {
      return {
        range,
        values: updates[range]
      };
    });
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.SHEET_ID,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: requests
      }
    });
  }
  
  console.log("Spreadsheet updated successfully");
}

async function updateOnDB(req, internshipData) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: "Unauthorized: No token provided" };
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
    
    // Format the data according to the schema
    const formattedInternshipData = {
      role: internshipData.role,
      period: internshipData.period,
      startDate: internshipData.startDate,
      endDate: internshipData.endDate,
      companyName: internshipData.companyName,
      placementType: internshipData.placementType,
      stipend: internshipData.stipend,
      researchIndustry: internshipData.researchIndustry,
      location: internshipData.location
    };
    
    // Add document links and status from the 'documents' object
    if (internshipData.documents) {
      // Map each document type to the correct schema fields
      if (internshipData.documents.offerLetter) {
        formattedInternshipData.offerLetter = internshipData.documents.offerLetter.link;
        formattedInternshipData.offerLetterStatus = internshipData.documents.offerLetter.verified;
      }
      
      if (internshipData.documents.permissionLetter) {
        formattedInternshipData.permissionLetter = internshipData.documents.permissionLetter.link;
        formattedInternshipData.permissionLetterStatus = internshipData.documents.permissionLetter.verified;
      }
      
      if (internshipData.documents.completionCertificate) {
        formattedInternshipData.completionCertificate = internshipData.documents.completionCertificate.link;
        formattedInternshipData.completionCertificateStatus = internshipData.documents.completionCertificate.verified;
      }
      
      if (internshipData.documents.internshipReport) {
        formattedInternshipData.internshipReport = internshipData.documents.internshipReport.link;
        formattedInternshipData.internshipReportStatus = internshipData.documents.internshipReport.verified;
      }
      
      if (internshipData.documents.studentFeedback) {
        formattedInternshipData.studentFeedback = internshipData.documents.studentFeedback.link;
        formattedInternshipData.studentFeedbackStatus = internshipData.documents.studentFeedback.verified;
      }
      
      if (internshipData.documents.employerFeedback) {
        formattedInternshipData.employerFeedback = internshipData.documents.employerFeedback.link;
        formattedInternshipData.employerFeedbackStatus = internshipData.documents.employerFeedback.verified;
      }
    }
    
    if (existingInternshipIndex !== -1) {
      // Update existing internship
      Object.assign(user.internships[existingInternshipIndex], formattedInternshipData);
    } else {
      // Add new internship
      user.internships.push(formattedInternshipData);
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
    // Implement the upload middleware with error handling
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one file must be uploaded." });
      }
      
      // Validate required fields
      const requiredFields = ["role", "period", "startDate", "endDate", "companyName", "placementType", "stipend", "researchIndustry", "location"];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }
      
      try {
        // Get token and extract user information
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }
        
        const token = authHeader.split(' ')[1];
        let userData = null;
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            throw new Error("Invalid or expired token.");
          }
          userData = decoded.user;
        });
        
        // Get user from database
        const user = await StudentUser.findOne({ email: userData.email });
        if (!user) {
          throw new Error("User not found in the database.");
        }
        
        const studentRegNumber = user.register_number;
        if (!studentRegNumber) {
          throw new Error("Register number not found for this user.");
        }
        
        // Get the last 4 digits of register number for file naming
        const last3Digits = studentRegNumber.slice(-3);
        
        // Authorize with Google
        const authClient = await authorize();
        
        // Get or create student folder in Drive
        const folderID = await getOrCreateStudentFolder(authClient, studentRegNumber);
        
        // Process each uploaded file
        const documentInfo = {};
        
        for (const file of req.files) {
          // Get document type from the field name in the form
          const docTypeField = req.body[`documentType_${file.originalname}`];
          
          // Create new filename with register number
          const newFileName = `${last3Digits}-${docTypeField ? docTypeField.replace(/[^a-zA-Z0-9]/g, '_') : file.originalname}${path.extname(file.originalname)}`;
          const newFilePath = path.join(path.dirname(file.path), newFileName);
          
          // Rename file
          fs.rename(file.path, newFilePath, (err) => {
            if (err) console.log(err);
          });
          
          // Create a proper FormData instance
          const formData = new FormData();
          formData.append('pdf', fs.createReadStream(newFilePath));
          
          const response = await axios.post(`${process.env.BACKEND_DJANGO_URL}/upload/`, formData, {
            headers: {
              ...formData.getHeaders() // This is important for setting correct content-type with boundaries
            }
          });
          
          // Debug the raw response
          console.log("Response status:", response.status);
          
          // Parse the JSON response
          const data = response.data;
          console.log("Response data:", data);

          const documentType = data.document_type;
          const extractedText = data.extracted_text;
          const message = data.message;

          // debug
          console.log("Orig: " + file.path);
          console.log("New: " + newFilePath);
          console.log("DocT: " + docTypeField);
          console.log({ documentType, extractedText, message });
          
          // Upload to Drive
          const driveLink = await uploadFile(authClient, newFilePath, newFileName, folderID);
          
          // Verify if the document type from API matches the expected document type
          const isVerified = documentType === docTypeField;
          
          // Store document info
          if (docTypeField) {
            documentInfo[docTypeField] = {
              link: driveLink,
              verified: isVerified ? "Yes" : "No",
              extractedText: extractedText
            };
          }
          
          // Clean up local file
          fs.unlinkSync(newFilePath);
        }
        
        // Prepare internship details
        const internshipDetails = {
          ...req.body,
          documents: documentInfo
        };
        
        // Update spreadsheet for this specific student's row
        await updateSpreadsheet(authClient, internshipDetails, studentRegNumber);
        
        // Update database
        await updateOnDB(req, internshipDetails);
        
        // Send successful response
        res.status(200).json({
          message: "Internship details uploaded successfully!",
          data: internshipDetails,
        });
        
      } catch (error) {
        console.error("Error processing internship details:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
      }
    });
  } catch (error) {
    console.error("Error in upload controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { upload, UploadInternshipDetailsController };
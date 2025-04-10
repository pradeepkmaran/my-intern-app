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
  "Signed Permission Letter",
  "Offer Letter",
  "Completion Certificate", 
  "Internship Report",
  "Student Feedback (About Internship)",
  "Employer Feedback (About student)"
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

async function updateSpreadsheet(authClient, internshipData, studentRegNumber, internshipIndex) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:AQ`,
  });
  
  const rows = response.data.values || [];
  let rowIndex = -1;
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][1] == studentRegNumber) { 
        rowIndex = i;
        break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error("Internship record not found in spreadsheet.");
  } else {
    const baseColumns = 14;
    
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
    
    if (internshipData.documents) {
      DOCUMENT_TYPES.forEach((docType, index) => {
        const colIndex = baseColumns + (index * 2); 
        const verifyColIndex = colIndex + 1; 
        
        if (internshipData.documents[docType]) {
          updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + colIndex)}${rowIndex+1}`] = 
            [[internshipData.documents[docType].link]];
          
          updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + verifyColIndex)}${rowIndex+1}`] = 
            [[internshipData.documents[docType].verified]];
        }
      });
    }
    
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

const StudentInternshipDetailsUpdateController = async (req, res) => {
  try {
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      try {
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
        
        const user = await StudentUser.findOne({ email: userData.email });
        if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const studentRegNumber = user.register_number;
        if (!studentRegNumber) {
          throw new Error("Register number not found for this user.");
        }
        
        const internshipId = req.params.internshipId;
        
        const internshipIndex = user.internships.findIndex(
          (internship) => internship._id.toString() === internshipId
        );
        
        if (internshipIndex === -1) {
          return res.status(404).json({ success: false, message: "Internship not found" });
        }
        
        const existingInternship = user.internships[internshipIndex];
        
        let updatedInternship = {
          ...existingInternship.toObject(),
          role: req.body.role || existingInternship.role,
          period: req.body.period || existingInternship.period,
          startDate: req.body.startDate || existingInternship.startDate,
          endDate: req.body.endDate || existingInternship.endDate,
          companyName: req.body.companyName || existingInternship.companyName,
          placementType: req.body.placementType || existingInternship.placementType,
          stipend: req.body.stipend || existingInternship.stipend,
          researchIndustry: req.body.researchIndustry || existingInternship.researchIndustry,
          location: req.body.location || existingInternship.location,
        };
        
        if (!updatedInternship.documents) {
          updatedInternship.documents = {};
        }
        // Authorize with Google
        let authClient = await authorize();
        
        // Process uploaded files if any
        if (req.files && req.files.length > 0) {
          // Get the last 3 digits of register number for file naming
          const last3Digits = studentRegNumber.slice(-3);
          
          // Get or create student folder in Drive
          const folderID = await getOrCreateStudentFolder(authClient, studentRegNumber);
          
          for (const file of req.files) {
            // Get document type from the field name or file field
            const docTypeField = req.body[`documentType_${file.originalname}`]
            
            if (!docTypeField) {
              console.warn(`Document type not specified for file: ${file.originalname}. Skipping.`);
              continue;
            }
            
            const newFileName = `${last3Digits}-${docTypeField.replace(/[^a-zA-Z0-9]/g, '_')}-${file.originalname}`;
            const newFilePath = path.join(path.dirname(file.path), newFileName);
            
            fs.renameSync(file.path, newFilePath);
            
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(newFilePath));
            
            let documentVerification = { verified: "No", extractedText: "" };
            
            try {
              const response = await axios.post(`${process.env.BACKEND_DJANGO_URL}/upload/`, formData, {
                headers: {
                  ...formData.getHeaders()
                }
              });
              
              const data = response.data;
              
              const message = data.message;
              const dates = data.dates
              
              const startDate = req.body["startDate"];
              const endDate = req.body["endDate"];

              console.log(dates);
              console.log(startDate.toString());
              console.log(endDate);

              console.log(dates.includes(startDate.toString()));
              console.log(dates.includes(endDate.toString()));
              console.log(startDate < endDate);
              
              const isVerified = (
                docTypeField !== "offerLetter" ||
                (dates.includes(startDate.toString()) &&
                dates.includes(endDate.toString()) &&
                startDate < endDate)
              );;
              
              documentVerification = {
                verified: isVerified ? "Yes" : "No"
              };
            } catch (apiError) {
              console.error("Error with document verification API:", apiError);
            }
            
            const driveLink = await uploadFile(authClient, newFilePath, newFileName, folderID);
            
            updatedInternship[`${docTypeField}`] = driveLink;
            updatedInternship[`${docTypeField}Status`] = documentVerification.verified;
            
            fs.unlinkSync(newFilePath);
          }
        }
        
        await updateSpreadsheet(authClient, updatedInternship, studentRegNumber);
        user.internships[internshipIndex] = updatedInternship;
        await user.save();

        res.status(200).json({
          success: true,
          message: "Internship details updated successfully!",
          internship: updatedInternship
        });
        
      } catch (error) {
        console.error("Error processing internship update:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
      }
    });
  } catch (error) {
    console.error("Error in update controller:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default StudentInternshipDetailsUpdateController;
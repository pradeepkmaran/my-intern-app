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
  
  // First, find the row with the matching register number
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:AQ`,
  });
  
  const rows = response.data.values || [];
  let rowIndex = -1;
  
  for (let i = 0; i < rows.length; i++) {
    console.log(studentRegNumber);
    if (rows[i][1] == studentRegNumber) { 
        rowIndex = i;
        break;
    }
  }
  
  if (rowIndex === -1) {
    // If no row found, log an error - updates should only be for existing records
    throw new Error("Internship record not found in spreadsheet.");
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
    if (internshipData.documents) {
      DOCUMENT_TYPES.forEach((docType, index) => {
        const colIndex = baseColumns + (index * 2); // Link column
        const verifyColIndex = colIndex + 1; // Verification status column
        
        if (internshipData.documents[docType]) {
          // Update link column
          updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + colIndex)}${rowIndex+1}`] = 
            [[internshipData.documents[docType].link]];
          
          // Update verification status column
          updates[`${process.env.SHEET_NAME}!${String.fromCharCode(65 + verifyColIndex)}${rowIndex+1}`] = 
            [[internshipData.documents[docType].verified]];
        }
      });
    }
    
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

const StudentInternshipDetailsUpdateController = async (req, res) => {
  try {
    // Implement the upload middleware with error handling
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
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
          return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const studentRegNumber = user.register_number;
        if (!studentRegNumber) {
          throw new Error("Register number not found for this user.");
        }
        
        // Find the internship to update
        const internshipId = req.params.internshipId;
        
        const internshipIndex = user.internships.findIndex(
          (internship) => internship._id.toString() === internshipId
        );
        
        if (internshipIndex === -1) {
          return res.status(404).json({ success: false, message: "Internship not found" });
        }
        
        // Extract existing internship data
        const existingInternship = user.internships[internshipIndex];
        
        // Prepare updated internship data with form fields
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
        
        // If documents exist in the internship, make sure we preserve them
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
            
            // Create new filename with register number
            const newFileName = `${last3Digits}-${docTypeField.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}${path.extname(file.originalname)}`;
            const newFilePath = path.join(path.dirname(file.path), newFileName);
            
            // Rename file
            fs.renameSync(file.path, newFilePath);
            
            // Create a proper FormData instance for verification API
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(newFilePath));
            
            let documentVerification = { verified: "No", extractedText: "" };
            
            try {
              const response = await axios.post(`${process.env.BACKEND_DJANGO_URL}/upload/`, formData, {
                headers: {
                  ...formData.getHeaders()
                }
              });
              
              // Parse the JSON response
              const data = response.data;
              
              const documentType = data.document_type;
              const extractedText = data.extracted_text;
              
              // Verify if the document type from API matches the expected document type
              const isVerified = documentType === docTypeField;
              
              documentVerification = {
                verified: isVerified ? "Yes" : "No",
                extractedText: extractedText
              };
            } catch (apiError) {
              console.error("Error with document verification API:", apiError);
              // Continue processing even if verification fails
            }
            
            // Upload to Drive
            const driveLink = await uploadFile(authClient, newFilePath, newFileName, folderID);
            
            // Store document info in the updated internship
            updatedInternship.documents[docTypeField] = {
              link: driveLink,
              ...documentVerification
            };
            
            // Clean up local file
            fs.unlinkSync(newFilePath);
          }
        }
        
        // Update spreadsheet data
        await updateSpreadsheet(authClient, updatedInternship, studentRegNumber);
        
        // Update user's internship data in database
        user.internships[internshipIndex] = updatedInternship;
        await user.save();
        
        // Send successful response
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
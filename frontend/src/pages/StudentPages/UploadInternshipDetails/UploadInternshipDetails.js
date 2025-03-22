import React, { useState, useContext } from "react";
import "./UploadInternshipDetails.css";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const UploadInternshipDetails = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    role: "",
    period: "",
    startDate: "",
    endDate: "",
    companyName: "",
    placementType: "",
    stipend: "",
    researchIndustry: "",
    location: "",
    permissionLetter: false,
    completionCertificate: false,
    internshipReport: false,
    studentFeedback: false,
    employerFeedback: false,
  });

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formDataToSend = new FormData();
  
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
  
    if (file) {
      formDataToSend.append("internshipFile", file);
    }
  
    try {
      const response = await fetch(
        "https://my-intern-app-backend.vercel.app/api/user/student/upload-internship-details",
        {
          method: "POST",
          body: formDataToSend,
          headers: {
            "Authorization": `Bearer ${user?.token}`, 
          },
        }
      );
  
      const data = await response.json();
      if (response.ok) {
        navigate('/student/view-internship-details');
        setUploadStatus("Internship details uploaded successfully!");
      } else {
        setUploadStatus(data.error || "Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setUploadStatus("Error uploading details.");
    }

  };

  return (
    <div className="upload-container">
      <h2>Internship Details Form</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label>Role:</label>
          <input type="text" name="role" value={formData.role} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Company Name:</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Stipend (per month):</label>
          <input type="text" name="stipend" value={formData.stipend} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Period (in weeks):</label>
          <input type="text" name="period" value={formData.period} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Start Date:</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Placement Type:</label>
          <select name="placementType" value={formData.placementType} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="CDC">Through CDC</option>
            <option value="Department">Through CSE Department</option>
            <option value="Outside">Outside</option>
          </select>
        </div>

        <div className="form-group">
          <label>Research/Industry:</label>
          <select name="researchIndustry" value={formData.researchIndustry} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Research">Research</option>
            <option value="Industry">Industry</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location:</label>
          <select name="location" value={formData.location} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="India">India</option>
            <option value="Abroad">Abroad</option>
          </select>
        </div>

        <div className="form-group">
          <label>Upload Offer/Completion Letter:</label>
          <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" required />
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" name="permissionLetter" checked={formData.permissionLetter} onChange={handleChange} />
          <label>Signed Permission Letter, Offer Letter Submitted</label>
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" name="completionCertificate" checked={formData.completionCertificate} onChange={handleChange} />
          <label>Completion Certificate Submitted</label>
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" name="internshipReport" checked={formData.internshipReport} onChange={handleChange} />
          <label>Internship Report Submitted</label>
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" name="studentFeedback" checked={formData.studentFeedback} onChange={handleChange} />
          <label>Student Feedback Submitted</label>
        </div>

        <div className="form-group checkbox-group">
          <input type="checkbox" name="employerFeedback" checked={formData.employerFeedback} onChange={handleChange} />
          <label>Employer Feedback Submitted</label>
        </div>

        <button type="submit">Submit</button>
      </form>

      {uploadStatus && <p className="status-message">{uploadStatus}</p>}
    </div>
  );
};

export default UploadInternshipDetails;

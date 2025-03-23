import React, { useState } from "react";
import { Upload } from 'lucide-react';
import "./UploadInternshipDetails.css";
import { useNavigate } from "react-router-dom";

const UploadInternshipDetails = () => {
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formDataToSend = new FormData();
  
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString());
    });
  
    if (file) {
      formDataToSend.append("internshipFile", file);
    }
  
    try {
      const response = await fetch(
        "https://my-intern-app-backend.vercel.app/api/user/student/upload-internship-details",
        {
          method: "POST",
          credentials: "include",
          body: formDataToSend,
        }
      );
  
      const data = await response.json();
      if (response.ok) {
        setUploadStatus("Internship details uploaded successfully!");
        navigate('/student/view-internship-details')
      } else {
        setUploadStatus(data.error || "Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setUploadStatus("Error uploading details.");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <Upload size={32} />
        <h1>Internship Details Form</h1>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="card basic-info">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Role</label>
              <input type="text" name="role" value={formData.role} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Stipend (per month)</label>
              <input type="text" name="stipend" value={formData.stipend} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Period (in weeks)</label>
              <input type="text" name="period" value={formData.period} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="card dates">
          <h2>Duration</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="card details">
          <h2>Additional Details</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Placement Type</label>
              <select name="placementType" value={formData.placementType} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="CDC">Through CDC</option>
                <option value="Department">Through CSE Department</option>
                <option value="Outside">Outside</option>
              </select>
            </div>

            <div className="input-group">
              <label>Research/Industry</label>
              <select name="researchIndustry" value={formData.researchIndustry} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Research">Research</option>
                <option value="Industry">Industry</option>
              </select>
            </div>

            <div className="input-group">
              <label>Location</label>
              <select name="location" value={formData.location} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="India">India</option>
                <option value="Abroad">Abroad</option>
              </select>
            </div>

            <div className="input-group">
              <label>Upload Offer/Completion Letter</label>
              <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" required className="file-input" />
            </div>
          </div>
        </div>

        <div className="card documents">
          <h2>Document Checklist</h2>
          <div className="checkbox-grid">
            <label className="checkbox-wrapper">
              <input type="checkbox" name="permissionLetter" checked={formData.permissionLetter} onChange={handleChange} />
              <span>Signed Permission Letter, Offer Letter Submitted</span>
            </label>

            <label className="checkbox-wrapper">
              <input type="checkbox" name="completionCertificate" checked={formData.completionCertificate} onChange={handleChange} />
              <span>Completion Certificate Submitted</span>
            </label>

            <label className="checkbox-wrapper">
              <input type="checkbox" name="internshipReport" checked={formData.internshipReport} onChange={handleChange} />
              <span>Internship Report Submitted</span>
            </label>

            <label className="checkbox-wrapper">
              <input type="checkbox" name="studentFeedback" checked={formData.studentFeedback} onChange={handleChange} />
              <span>Student Feedback Submitted</span>
            </label>

            <label className="checkbox-wrapper">
              <input type="checkbox" name="employerFeedback" checked={formData.employerFeedback} onChange={handleChange} />
              <span>Employer Feedback Submitted</span>
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn">Submit Internship Details</button>
      </form>

      {uploadStatus && <div className={`status-message ${uploadStatus.includes('success') ? 'success' : 'error'}`}>
        {uploadStatus}
      </div>}
    </div>
  );
};

export default UploadInternshipDetails;
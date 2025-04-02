import React, { useState, useContext } from "react";
import { Upload } from 'lucide-react';
import "./UploadInternshipDetails.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

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
  });

  const [files, setFiles] = useState({
    offerLetter: null,
    permissionLetter: null,
    completionCertificate: null,
    internshipReport: null,
    studentFeedback: null,
    employerFeedback: null,
  });
  
  const [uploadStatus, setUploadStatus] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFiles(prevFiles => ({
        ...prevFiles,
        [name]: files[0]
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formDataToSend = new FormData();
  
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formDataToSend.append("documents", file);
        formDataToSend.append(`documentType_${file.name}`, key);
      }
    });
  
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/student/upload-internship-details`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${user?.access_token}`
          },
          body: formDataToSend,
        }
      );
  
      const data = await response.json();
      if (response.ok) {
        setUploadStatus("Internship details uploaded successfully!");
        navigate('/student/view-internship-details');
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
        <h1><Upload size={28} /> Internship Details Form</h1>
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
          </div>
        </div>

        <div className="card documents">
          <h2>Document Uploads</h2>
          <div className="input-group">
              <label>Offer Letter</label>
              <input type="file" name="offerLetter" onChange={handleFileChange} accept=".pdf" className="file-input" />
          </div>
          <div className="input-group">
              <label>Signed Permission Letter</label>
              <input type="file" name="permissionLetter" onChange={handleFileChange} accept=".pdf" className="file-input" />
          </div>
          <div className="input-group">
              <label>Completion Certificate</label>
              <input type="file" name="completionCertificate" onChange={handleFileChange} accept=".pdf" className="file-input" />
          </div>
          <div className="input-group">
              <label>Internship Report</label>
              <input type="file" name="internshipReport" onChange={handleFileChange} accept=".pdf" className="file-input" />
          </div>
          <div className="input-group">
              <label>Student Feedback (About the internship)</label>
              <input type="file" name="studentFeedback" onChange={handleFileChange} accept=".pdf" className="file-input" />
          </div>
          <div className="input-group">
              <label>Employer Feedback (About the student)</label>
              <input type="file" name="employerFeedback" onChange={handleFileChange} accept=".pdf" className="file-input" />
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
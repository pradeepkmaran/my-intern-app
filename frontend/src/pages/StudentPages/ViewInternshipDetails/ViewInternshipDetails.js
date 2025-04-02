import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { ExternalLink } from 'lucide-react';
import "./ViewInternshipDetails.css";

const ViewInternshipDetails = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/student/my-internships`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${user?.access_token}`,
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setInternships(data.internships);
        } else {
          console.error("Failed to fetch internships:", data.message);
        }
      } catch (error) {
        console.error("Error fetching internships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [user?.access_token]);

  const handleCardClick = (internship) => {
    setSelectedInternship(internship);
  };

  const handleEditClick = (internshipId) => {
    navigate(`/student/view-internship-details/edit/${internshipId}`);
  };

  const closeModal = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      setSelectedInternship(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if a document is verified (returns true, false, or null if not available)
  const isDocumentVerified = (internship, docType) => {
    if (!internship || !docType) return null;
    return internship[`${docType}Status`] === "Yes";
  };

  // Get document link safely
  const getDocumentLink = (internship, docType) => {
    if (!internship || !docType || !internship[docType]) return null;
    return internship[docType] || null;
  };

  return (
    <div className="internship-container">
      <div className="header-section">
        <h1>My Internships</h1>
        <p className="subtitle">View and manage your internship details</p>
        <div className="student-info">
          <p><strong>Name:</strong> {user?.name || "Loading..."}</p>
          {/* <p><strong>Register Number:</strong> {user?.register_number || "Loading..."}</p>
          <p><strong>Section:</strong> {user?.section || "Loading..."}</p> */}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your internships...</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="no-data-container">
          <div className="no-data-icon">📋</div>
          <p>No internships found. When you add internships, they'll appear here.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {internships.map((internship, index) => (
            <div
              key={index}
              className="internship-card"
              onClick={() => handleCardClick(internship)}
            >
              <div className="card-content">
                <h2 className="role-title">{internship.role || "Role Not Specified"}</h2>
                <h3 className="company-name">{internship.companyName || "Company Not Specified"}</h3>
                
                <div className="card-metadata">
                  <div className="metadata-item">
                    <span className="metadata-icon">🏢</span>
                    <span>{internship.researchIndustry || "Internship"}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-icon">📍</span>
                    <span>{internship.location || "Location Not Specified"}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-icon">📅</span>
                    <span>{internship.period || "Period Not Specified"} weeks</span>
                  </div>
                  {internship.stipend && (
                    <div className="metadata-item">
                      <span className="metadata-icon">💰</span>
                      <span>₹{internship.stipend}</span>
                    </div>
                  )}
                </div>
                
                <div className="document-status-indicator">
                  <div className={`status-dot ${
                    internship.permissionLetter === "true" && 
                    internship.completionCertificate === "true" && 
                    internship.internshipReport === "true" && 
                    internship.studentFeedback === "true" && 
                    internship.employerFeedback === "true" 
                      ? "complete" 
                      : "incomplete"}`
                  }></div>
                  <span>
                    {internship.permissionLetter === "true" && 
                     internship.completionCertificate === "true" && 
                     internship.internshipReport === "true" && 
                     internship.studentFeedback === "true" && 
                     internship.employerFeedback === "true" 
                      ? "All documents submitted" 
                      : "Documentation incomplete"}
                  </span>
                </div>
                
                <div className="card-action">
                  <span>View Details</span>
                  <span className="action-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedInternship && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedInternship(null)}>
              ×
            </button>
            
            <div className="modal-header">
              <h2>{selectedInternship.role || "Role Not Specified"}</h2>
              <h3>{selectedInternship.companyName || "Company Not Specified"}</h3>
              <button
                className="edit-button"
                onClick={() => handleEditClick(selectedInternship._id)}
              > Edit
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-section">
                <h4 className="section-title">Internship Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Period</span>
                    <span className="detail-value">{selectedInternship.period || "N/A"} weeks</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Start Date</span>
                    <span className="detail-value">{formatDate(selectedInternship.startDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Date</span>
                    <span className="detail-value">{formatDate(selectedInternship.endDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Placement Type</span>
                    <span className="detail-value">{selectedInternship.placementType || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stipend</span>
                    <span className="detail-value">
                      {selectedInternship.stipend ? `₹${selectedInternship.stipend}` : "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{selectedInternship.researchIndustry || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedInternship.location || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4 className="section-title">Documentation Status</h4>
                <div className="documentation-status">
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'permissionLetter') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'permissionLetter') ? "✓" : "○"}</span></div>
                    <span className="status-label">Permission & Offer Letters </span> 
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'permissionLetter') ? <a href={getDocumentLink(selectedInternship, 'permissionLetter')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'offerLetter') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'offerLetter') ? "✓" : "○"}</span></div>
                    <span className="status-label">Permission & Offer Letters</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'offerLetter') ? <a href={getDocumentLink(selectedInternship, 'offerLetter')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'completionCertificate')? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'completionCertificate')? "✓" : "○"}</span></div>
                    <span className="status-label">Completion Certificate</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'completionCertificate') ? <a href={getDocumentLink(selectedInternship, 'completionCertificate')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'internshipReport') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'internshipReport') ? "✓" : "○"}</span></div>
                    <span className="status-label">Internship Report</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'internshipReport') ? <a href={getDocumentLink(selectedInternship, 'internshipReport')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'studentFeedback') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'studentFeedback') ? "✓" : "○"}</span></div>
                    <span className="status-label">Student Feedback</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'studentFeedback') ? <a href={getDocumentLink(selectedInternship, 'studentFeedback')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'employerFeedback')? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'employerFeedback')? "✓" : "○"}</span></div>
                    <span className="status-label">Employer Feedback</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'employerFeedback') ? <a href={getDocumentLink(selectedInternship, 'employerFeedback')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4 className="section-title">Verification Summary</h4>
                <div className="verification-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ 
                      width: `${[
                        isDocumentVerified(selectedInternship, 'permissionLetter'),
                        isDocumentVerified(selectedInternship, 'offerLetter'),
                        isDocumentVerified(selectedInternship, 'completionCertificate'),
                        isDocumentVerified(selectedInternship, 'internshipReport'),
                        isDocumentVerified(selectedInternship, 'studentFeedback'),
                        isDocumentVerified(selectedInternship, 'employerFeedback')
                      ].filter(Boolean).length / 6 * 100}%` 
                    }}></div>
                  </div>
                  <div className="verification-status-text">
                    {[
                      isDocumentVerified(selectedInternship, 'permissionLetter'),
                      isDocumentVerified(selectedInternship, 'offerLetter'),
                      isDocumentVerified(selectedInternship, 'completionCertificate'),
                      isDocumentVerified(selectedInternship, 'internshipReport'),
                      isDocumentVerified(selectedInternship, 'studentFeedback'),
                      isDocumentVerified(selectedInternship, 'employerFeedback')
                    ].filter(Boolean).length} of 6 documents verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInternshipDetails;
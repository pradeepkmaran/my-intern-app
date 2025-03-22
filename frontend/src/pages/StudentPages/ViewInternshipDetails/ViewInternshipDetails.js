import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import "./ViewInternshipDetails.css";

const BACKEND_HOST = process.env.BACKEND_HOST;

const ViewInternshipDetails = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await fetch(
          `${BACKEND_HOST}/api/user/student/my-internships/api/user/student/my-internships`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "application/json",
            },
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
  }, [user?.token]);

  const handleCardClick = (internship) => {
    setSelectedInternship(internship);
  };

  const closeModal = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      setSelectedInternship(null);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="internship-container">
      <div className="header-section">
        <h1>My Internships</h1>
        <p className="subtitle">View and manage your internship details</p>
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
              <div className="card-badge">
                {internship.researchIndustry || "Internship"}
              </div>
              <div className="card-content">
                <h2 className="role-title">{internship.role || "Role Not Specified"}</h2>
                <h3 className="company-name">{internship.companyName || "Company Not Specified"}</h3>
                
                <div className="card-metadata">
                  <div className="metadata-item">
                    <span className="metadata-icon">📍</span>
                    <span>{internship.location || "Location Not Specified"}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-icon">📅</span>
                    <span>{internship.period || "Period Not Specified"}</span>
                  </div>
                  {internship.stipend && (
                    <div className="metadata-item">
                      <span className="metadata-icon">💰</span>
                      <span>₹{internship.stipend}</span>
                    </div>
                  )}
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

      {/* Detailed View Modal */}
      {selectedInternship && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedInternship(null)}>
              ×
            </button>
            
            <div className="modal-header">
              <h2>{selectedInternship.role || "Role Not Specified"}</h2>
              <h3>{selectedInternship.companyName || "Company Not Specified"}</h3>
            </div>
            
            <div className="modal-body">
              <div className="details-section">
                <h4 className="section-title">Internship Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Period</span>
                    <span className="detail-value">{selectedInternship.period || "N/A"}</span>
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
                  <div className="detail-item">
                    <span className="detail-label">Internship Order</span>
                    <span className="detail-value">{selectedInternship.internshipOrder || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4 className="section-title">Documentation Status</h4>
                <div className="documentation-status">
                  <div className={`status-item ${selectedInternship.permissionLetter === "true" ? "completed" : "pending"}`}>
                    <span className="status-icon">{selectedInternship.permissionLetter === "true" ? "✓" : "○"}</span>
                    <span className="status-label">Permission & Offer Letters</span>
                  </div>
                  <div className={`status-item ${selectedInternship.completionCertificate === "true" ? "completed" : "pending"}`}>
                    <span className="status-icon">{selectedInternship.completionCertificate === "true" ? "✓" : "○"}</span>
                    <span className="status-label">Completion Certificate</span>
                  </div>
                  <div className={`status-item ${selectedInternship.internshipReport === "true" ? "completed" : "pending"}`}>
                    <span className="status-icon">{selectedInternship.internshipReport === "true" ? "✓" : "○"}</span>
                    <span className="status-label">Internship Report</span>
                  </div>
                  <div className={`status-item ${selectedInternship.studentFeedback === "true" ? "completed" : "pending"}`}>
                    <span className="status-icon">{selectedInternship.studentFeedback === "true" ? "✓" : "○"}</span>
                    <span className="status-label">Student Feedback</span>
                  </div>
                  <div className={`status-item ${selectedInternship.employerFeedback === "true" ? "completed" : "pending"}`}>
                    <span className="status-icon">{selectedInternship.employerFeedback === "true" ? "✓" : "○"}</span>
                    <span className="status-label">Employer Feedback</span>
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
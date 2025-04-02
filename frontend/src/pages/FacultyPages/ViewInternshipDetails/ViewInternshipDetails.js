import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { ExternalLink } from 'lucide-react';
import "./ViewInternshipDetails.css";

const ViewInternshipDetails = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/faculty/all-internships`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${user?.access_token}`,
            }
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch internship data");
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.studentDetails)) {
          // Adding a verification status field if it doesn't exist
          const enhancedData = data.studentDetails.map(student => ({
            ...student,
            internships: student.internships.map(internship => ({
              ...internship,
              verificationStatus: internship.verificationStatus || "pending" // Use existing or default to pending
            }))
          }));
          setStudentsData(enhancedData);
          setFilteredData(enhancedData);
        } else {
          setError("Invalid data format");
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [user?.access_token]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(studentsData);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    const filtered = studentsData.filter(student => {   
      if (
        student.name.toLowerCase().includes(searchTermLower) ||
        student.register_number.toLowerCase().includes(searchTermLower) || 
        student.section.toLowerCase().includes(searchTermLower) || 
        student.mobile_number.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }
      
      const hasMatchingInternship = student.internships.some(internship => 
        (internship.companyName || "").toLowerCase().includes(searchTermLower) ||
        (internship.role || "").toLowerCase().includes(searchTermLower) || 
        (internship.placementType || "").toLowerCase().includes(searchTermLower) ||
        (internship.researchIndustry || "").toLowerCase().includes(searchTermLower) ||
        (internship.location || "").toLowerCase().includes(searchTermLower)
      );

      return hasMatchingInternship;
    });

    setFilteredData(filtered);
  }, [searchTerm, studentsData]);

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship);
  };

  const closeModal = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      setSelectedInternship(null);
    }
  };

  // Dummy handler function for verify button
  const handleVerifyInternship = (internshipId, studentId) => {
    console.log(`Verifying internship ${internshipId} for student ${studentId}`);
    
    // Update local state to reflect the change immediately
    setStudentsData(prevData => 
      prevData.map(student => {
        if (student._id === studentId) {
          return {
            ...student,
            internships: student.internships.map(internship => {
              if (internship._id === internshipId) {
                return { ...internship, verificationStatus: "verified" };
              }
              return internship;
            })
          };
        }
        return student;
      })
    );
    
    // In a real implementation, you would make an API call here
    // Example:
    // fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/faculty/verify-internship/${internshipId}`, {
    //   method: "PUT",
    //   headers: {
    //     "Authorization": `Bearer ${user?.access_token}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({ status: "verified" })
    // })
    // .then(response => response.json())
    // .then(data => {
    //   if (data.success) {
    //     // Handle success
    //   } else {
    //     // Handle error, revert UI change
    //   }
    // });
  };

  // Dummy handler function for unverify button
  const handleUnverifyInternship = (internshipId, studentId) => {
    console.log(`Unverifying internship ${internshipId} for student ${studentId}`);
    
    // Update local state to reflect the change immediately
    setStudentsData(prevData => 
      prevData.map(student => {
        if (student._id === studentId) {
          return {
            ...student,
            internships: student.internships.map(internship => {
              if (internship._id === internshipId) {
                return { ...internship, verificationStatus: "pending" };
              }
              return internship;
            })
          };
        }
        return student;
      })
    );
    
    // In a real implementation, you would make an API call here
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
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
    <div className="internship-container faculty-view">
      <div className="header-section">
        <h1>Student Internships</h1>
        <p className="subtitle">View and manage student internship records</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, class (CSE-A/B/C), company, or role..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading internship data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="no-data-container">
          {searchTerm ? (
            <>
              <div className="no-data-icon">🔍</div>
              <p>No results found for "{searchTerm}".</p>
              <button className="reset-search-button" onClick={clearSearch}>Clear Search</button>
            </>
          ) : (
            <>
              <div className="no-data-icon">📋</div>
              <p>No student internships found.</p>
            </>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="internship-table">
            <thead>
              <tr>
                <th>Register Number</th>
                <th>Student Name</th>
                <th>Company</th>
                <th>Role</th>
                <th>Period</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(student => (
                student.internships.map((internship, index) => (
                  <tr key={`${student._id}-${internship._id}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={student.internships.length} className="register-number">
                          {student.register_number}
                        </td>
                        <td rowSpan={student.internships.length} className="student-name">
                          {student.name}
                        </td>
                      </>
                    )}
                    <td>{internship.companyName || "N/A"}</td>
                    <td>{internship.role || "N/A"}</td>
                    <td>{internship.period || "N/A"} weeks</td>
                    <td>
                      <span className={`status-badge ${getCompletionStatus(internship)}`}>
                        {getCompletionStatus(internship) === "complete" ? "Complete" : 
                         getCompletionStatus(internship) === "partial" ? "Partial" : "Incomplete"}
                      </span>
                    </td>
                    <td>
                      <span className={`verification-badge ${internship.verificationStatus}`}>
                        {internship.verificationStatus === "verified" ? "Verified" : 
                         internship.verificationStatus === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="view-button" 
                        onClick={() => handleViewDetails({...internship, studentName: student.name, studentId: student._id})}
                      >
                        View
                      </button>
                      
                      {internship.verificationStatus !== "verified" ? (
                        <button 
                          className="verify-button" 
                          onClick={() => handleVerifyInternship(internship._id, student._id)}
                        >
                          Verify
                        </button>
                      ) : (
                        <button 
                          className="unverify-button" 
                          onClick={() => handleUnverifyInternship(internship._id, student._id)}
                        >
                          Unverify
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
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
              {selectedInternship.studentName && 
                <p className="student-info">Student: {selectedInternship.studentName}</p>
              }
              
              <div className="modal-actions">
                {selectedInternship.verificationStatus !== "verified" ? (
                  <button 
                    className="verify-button" 
                    onClick={() => {
                      handleVerifyInternship(selectedInternship._id, selectedInternship.studentId);
                      setSelectedInternship({...selectedInternship, verificationStatus: "verified"});
                    }}
                  >
                    Verify Internship
                  </button>
                ) : (
                  <button 
                    className="unverify-button" 
                    onClick={() => {
                      handleUnverifyInternship(selectedInternship._id, selectedInternship.studentId);
                      setSelectedInternship({...selectedInternship, verificationStatus: "pending"});
                    }}
                  >
                    Unverify Internship
                  </button>
                )}
              </div>
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
                    <span className="status-label">Permission & Offer Letters</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'permissionLetter') ? <a href={getDocumentLink(selectedInternship, 'permissionLetter')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'offerLetter') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'offerLetter') ? "✓" : "○"}</span></div>
                    <span className="status-label">Permission & Offer Letters</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'offerLetter') ? <a href={getDocumentLink(selectedInternship, 'offerLetter')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'completionCertificate') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'completionCertificate') ? "✓" : "○"}</span></div>
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
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'employerFeedback') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'employerFeedback') ? "✓" : "○"}</span></div>
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

// Helper function to determine completion status
const getCompletionStatus = (internship) => {
  const requiredDocs = [
    internship.permissionLetter === "true",
    internship.completionCertificate === "true", 
    internship.internshipReport === "true",
    internship.studentFeedback === "true",
    internship.employerFeedback === "true"
  ];
  
  const completedCount = requiredDocs.filter(Boolean).length;
  
  if (completedCount === requiredDocs.length) return "complete";
  if (completedCount > 0) return "partial";
  return "incomplete";
};

export default ViewInternshipDetails;
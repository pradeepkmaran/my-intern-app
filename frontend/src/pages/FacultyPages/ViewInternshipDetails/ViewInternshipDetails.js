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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    internshipObtained: "",
    duration: "",
    startDate: "",
    endDate: "",
    companyName: "",
    placementSource: "",
    stipend: "",
    internshipType: "",
    location: "",
    offerVerified: "",
    permissionVerified: "",
    completionVerified: "",
    internshipVerified: "",
    studentVerified: "",
    companyVerified: "",
  });

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
            internships: student.internships?.length ? student.internships.map(internship => ({
              ...internship,
              verificationStatus: internship.verificationStatus || "pending" // Use existing or default to pending
            })) : [] // Ensure internships is an array even if it's empty
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
      // Apply filters but not search term
      applyAllFilters(studentsData);
      return;
    }

    // Apply both search and filters
    const searchFiltered = applySearch(studentsData, searchTerm);
    applyAllFilters(searchFiltered);
  }, [searchTerm, studentsData]);

  const applySearch = (data, term) => {
    const searchTermLower = term.toLowerCase();
    
    return data.filter(student => {   
      if (
        student.name.toLowerCase().includes(searchTermLower) ||
        student.register_number.toLowerCase().includes(searchTermLower) || 
        student.section?.toLowerCase().includes(searchTermLower) || 
        student.mobile_number?.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }
      
      // Only check internships if they exist
      if (student.internships && student.internships.length > 0) {
        const hasMatchingInternship = student.internships.some(internship => 
          (internship.companyName || "").toLowerCase().includes(searchTermLower) ||
          (internship.role || "").toLowerCase().includes(searchTermLower) || 
          (internship.placementType || "").toLowerCase().includes(searchTermLower) ||
          (internship.researchIndustry || "").toLowerCase().includes(searchTermLower) ||
          (internship.location || "").toLowerCase().includes(searchTermLower)
        );
        return hasMatchingInternship;
      }

      return false;
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyAllFilters = (data) => {
    // If no filters are applied, return data as is (just with search if applicable)
    if (!Object.values(filters).some(val => val)) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(student => {
      // Keep students with no internships if not filtering by internship fields
      // if (!student.internships || student.internships.length === 0) {
      //   return !filters.internshipObtained || filters.internshipObtained === "no";
      // }

      // If filtering by internships, check if any internship matches
      const hasMatchingInternship = student.internships.some(internship => {
        // Filter by each criterion
        if (filters.internshipObtained === "no") return false;
        
        if (filters.duration && parseInt(internship.period) !== parseInt(filters.duration)) return false;
        
        if (filters.startDate && new Date(internship.startDate) < new Date(filters.startDate)) return false;
        
        if (filters.endDate && new Date(internship.endDate) > new Date(filters.endDate)) return false;
        
        if (filters.companyName && 
            internship.companyName.toLowerCase() !== filters.companyName.toLowerCase()) return false;

        if (filters.placementSource && 
            internship.placementType !== filters.placementSource) return false;
        
        if (filters.internshipType && 
            internship.researchIndustry?.toLowerCase() !== filters.internshipType.toLowerCase()) return false;
        
        if (filters.location && 
            !internship.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
        
        if (filters.offerVerified && 
            (internship.offerLetterStatus === "Yes") !== (filters.offerVerified === "yes")) return false;

        if (filters.permissionVerified && 
            (internship.permissionLetterStatus === "Yes") !== (filters.permissionVerified === "yes")) return false;
        
        if (filters.completionVerified && 
            (internship.completionCertificateStatus === "Yes") !== (filters.completionVerified === "yes")) return false;
        
        if (filters.internshipVerified && 
            (internship.internshipReportStatus === "Yes") !== (filters.internshipVerified === "yes")) return false;
        
        if (filters.studentVerified && 
            (internship.studentFeedbackStatus === "Yes") !== (filters.studentVerified === "yes")) return false;
        
        if (filters.companyVerified && 
            (internship.employerFeedbackStatus === "Yes") !== (filters.companyVerified === "yes")) return false;
        
        // If it passed all filters, it's a match
        return true;
      });

      return hasMatchingInternship || 
        (filters.internshipObtained === "no" && (!student.internships || student.internships.length === 0));
    });

    setFilteredData(filtered);
  };

  const applyFilters = () => {
    applyAllFilters(searchTerm ? applySearch(studentsData, searchTerm) : studentsData);
  };

  const resetFilters = () => {
    setFilters({
      internshipObtained: "",
      duration: "",
      startDate: "",
      endDate: "",
      companyName: "",
      placementSource: "",
      stipend: "",
      internshipType: "",
      location: "",
      permissionVerified: "",
      completionVerified: "",
      internshipVerified: "",
      studentVerified: "",
      companyVerified: "",
    });
    
    // Reset to just search results or all data
    if (searchTerm) {
      setFilteredData(applySearch(studentsData, searchTerm));
    } else {
      setFilteredData(studentsData);
    }
  };

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

      {/* Filters Toggle Button */}
      <div className="dashboard-header">
        <button
          className={`toggle-filters-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
          <span className="toggle-icon">{showFilters ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            {/* Basic Info */}
            <div className="filter-section">
              <h3 className="section-title">Basic Info</h3>
              <div className="filter-group">
                <label>Internship Obtained</label>
                <select
                  value={filters.internshipObtained}
                  onChange={(e) => handleFilterChange("internshipObtained", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Duration (weeks)</label>
                <input
                  type="number"
                  min="1"
                  value={filters.duration}
                  onChange={(e) => handleFilterChange("duration", e.target.value)}
                />
              </div>

              <div className="date-group">
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="filter-section">
              <h3 className="section-title">Company Info</h3>
              <div className="filter-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange("companyName", e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Placement Source</label>
                <select
                  value={filters.placementSource}
                  onChange={(e) => handleFilterChange("placementSource", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Through College">Through College</option>
                  <option value="Outside">Outside</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Stipend (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.stipend}
                  onChange={(e) => handleFilterChange("stipend", e.target.value)}
                />
              </div>
            </div>

            {/* Internship Details */}
            <div className="filter-section">
              <h3 className="section-title">Internship Details</h3>
              <div className="filter-group">
                <label>Internship Type</label>
                <select
                  value={filters.internshipType}
                  onChange={(e) => handleFilterChange("internshipType", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="academic">Academic</option>
                  <option value="industry">Industry</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="India">India</option>
                  <option value="Abroad">Abroad</option>
                </select>
              </div>
            </div>

            {/* Documents */}
            <div className="filter-section">
              <h3 className="section-title">Documents</h3>
              <div className="filter-group">
                <label>Offer Letter Verification</label>
                <select
                  value={filters.offerVerified}
                  onChange={(e) => handleFilterChange("offerVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Permission Letter Verification</label>
                <select
                  value={filters.permissionVerified}
                  onChange={(e) => handleFilterChange("permissionVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Completion Certificate Verification</label>
                <select
                  value={filters.completionVerified}
                  onChange={(e) => handleFilterChange("completionVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Internship Report Verification</label>
                <select
                  value={filters.internshipVerified}
                  onChange={(e) => handleFilterChange("internshipVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Feedback */}
            <div className="filter-section">
              <h3 className="section-title">Feedback</h3>
              <div className="filter-group">
                <label>Student Feedback Verification</label>
                <select
                  value={filters.studentVerified}
                  onChange={(e) => handleFilterChange("studentVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Company Feedback Verification</label>
                <select
                  value={filters.companyVerified}
                  onChange={(e) => handleFilterChange("companyVerified", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={resetFilters}>
              Reset
            </button>
            <button className="apply-btn" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

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
          {searchTerm || Object.values(filters).some(val => val) ? (
            <>
              <div className="no-data-icon">🔍</div>
              <p>No results found for your search or filter criteria.</p>
              <button className="reset-search-button" onClick={() => {
                clearSearch();
                resetFilters();
              }}>Clear All Filters</button>
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
              {filteredData.map(student => {
                // If student has no internships, render a single row with student info
                if (!student.internships || student.internships.length === 0) {
                  return (
                    <tr key={student._id}>
                      <td className="register-number">{student.register_number}</td>
                      <td className="student-name">{student.name}</td>
                      <td colSpan="6" className="no-internships-cell">No internships recorded</td>
                    </tr>
                  );
                }
                
                // If student has internships, render them as before
                return student.internships.map((internship, index) => (
                  <tr key={`${student._id}-${internship._id || index}`}>
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
                ));
              })}
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
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'offerLetter') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'offerLetter') ? "✓" : "○"}</span></div>
                    <span className="status-label">Offer Letter</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'offerLetter') ? <a href={getDocumentLink(selectedInternship, 'offerLetter')}><ExternalLink size={20} /></a> : <></> }</div>
                  </div>
                  <div className={`status-item ${isDocumentVerified(selectedInternship, 'permissionLetter') ? "completed" : "pending"}`}>
                    <div className='statuc-icon-box'><span className="status-icon">{isDocumentVerified(selectedInternship, 'permissionLetter') ? "✓" : "○"}</span></div>
                    <span className="status-label">Signed Permission Letter</span>
                    <div className="document-link">{ getDocumentLink(selectedInternship, 'permissionLetter') ? <a href={getDocumentLink(selectedInternship, 'permissionLetter')}><ExternalLink size={20} /></a> : <></> }</div>
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
  if (!internship) return "incomplete";
  
  const requiredDocs = [
    internship.permissionLetterStatus === "Yes",
    internship.completionCertificateStatus === "Yes", 
    internship.internshipReportStatus === "Yes",
    internship.studentFeedbackStatus === "Yes",
    internship.employerFeedbackStatus === "Yes"
  ];
  
  const completedCount = requiredDocs.filter(Boolean).length;
  
  if (completedCount === requiredDocs.length) return "complete";
  if (completedCount > 0) return "partial";
  return "incomplete";
};

export default ViewInternshipDetails;
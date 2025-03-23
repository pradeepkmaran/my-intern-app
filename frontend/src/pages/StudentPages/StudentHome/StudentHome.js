import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import "./StudentHome.css"; 

const StudentHome = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate("/student/upload-internship-details");
  };

  const handleViewClick = () => {
    navigate("/student/view-internship-details");
  };

  return (
    <div className="student-home-container">
      <h1>Student Home</h1>
      <h2>Welcome, {user ? user.email : "Guest"}!</h2>
      <div className="button-container">
        <button onClick={handleUploadClick}>
          Upload Internship Details
        </button>
        <button onClick={handleViewClick}>
          View Internship Details
        </button>
        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default StudentHome;
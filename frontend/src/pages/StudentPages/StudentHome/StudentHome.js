import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

const StudentHome = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate("/student/upload-internship-details");
  };
  
  const handleViewClick = () => {
    navigate("/student/view-internship-details");
  };

  const handleEditClick = () => {
    navigate("/student/edit-internship-details");
  };

  return (
    <div>
      <h1>Student Home</h1>
      <h2>Welcome, {user ? user.email : "Guest"}!</h2>
      <button onClick={handleUploadClick}>
        Upload Internship Details
      </button> <br /> <br />
      <button onClick={handleViewClick}>
        View Internship Details
      </button> <br /> <br />
      <button onClick={handleEditClick}>
        Edit Internship Details
      </button> <br /> <br />
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default StudentHome;

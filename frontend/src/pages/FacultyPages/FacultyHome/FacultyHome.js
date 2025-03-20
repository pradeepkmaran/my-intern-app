import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

const FacultyHome = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
  
    const handleViewClick = () => {
      navigate("/faculty/view-internship-details");
    };
    
    return (
        <div>
          <h1>Faculty Home</h1>
          <h2>Welcome, {user ? user.email : "Guest"}!</h2>

          <button onClick={handleViewClick}>
            View Internship Details
          </button> <br /> <br />

          <button onClick={logout}>Logout</button>
        </div>
    );
}

export default FacultyHome;
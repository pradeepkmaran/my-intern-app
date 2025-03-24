import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import './FacultyHome.css';

const FacultyHome = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleViewClick = () => {
        navigate("/faculty/view-internship-details");
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="faculty-home-container">
            <h1>Faculty Home</h1>
            
            <h2>Welcome, {user ? user.email : "Guest"}!</h2>
            
            <div className="button-container">
                <button onClick={handleViewClick}>
                    View Internship Details
                </button>
                
                <button 
                    className="logout" 
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default FacultyHome;
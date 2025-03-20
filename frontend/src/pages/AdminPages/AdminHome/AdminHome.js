import React, { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

const AdminHome = () => {
    const { user, logout } = useContext(AuthContext);
    return (
        <div>
          <h1>Admin Home</h1>
          <h2>Welcome, {user ? user.email : "Guest"}!</h2>
          <button onClick={logout}>Logout</button>
        </div>
    );
}

export default AdminHome;
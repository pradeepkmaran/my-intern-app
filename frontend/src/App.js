// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import LoginPage from "./pages/Login/LoginPage";
import AdminHome from "./pages/AdminPages/AdminHome/AdminHome";
import StudentHome from "./pages/StudentPages/StudentHome/StudentHome";
import FacultyHome from "./pages/FacultyPages/FacultyHome/FacultyHome";
import ProtectedRoute from "./components/ProtectedRoute";
import UploadInternshipDetailsPage from "./pages/StudentPages/UploadInternshipDetails/UploadInternshipDetails";
import EditInternshipDetailsPage from "./pages/StudentPages/EditInternshipDetails/EditInternshipDetails";
import StudentViewInternshipDetailsPage from "./pages/StudentPages/ViewInternshipDetails/ViewInternshipDetails";
import VerifyInternshipDetailsPage from "./pages/FacultyPages/VerifyInternshipDetails/VerifyInternshipDetails";
import FacultyViewInternshipDetailsPage from "./pages/FacultyPages/ViewInternshipDetails/ViewInternshipDetails";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute user={user} allowedRoles={["admin"]} />}>
            <Route path="/admin/home" element={<AdminHome />} />
          </Route>

          <Route element={<ProtectedRoute user={user} allowedRoles={["student"]} />}>
            <Route path="/student/home" element={<StudentHome />} />
            <Route path="/student/upload-internship-details" element={<UploadInternshipDetailsPage />} />
            <Route path="/student/edit-internship-details" element={<EditInternshipDetailsPage />} />
            <Route path="/student/view-internship-details" element={<StudentViewInternshipDetailsPage />} />
            <Route path="/student/view-internship-details/edit/*" element={<EditInternshipDetailsPage />} />
          </Route>

          <Route element={<ProtectedRoute user={user} allowedRoles={["faculty"]} />}>
            <Route path="/faculty/home" element={<FacultyHome />} />
            <Route path="/faculty/view-internship-details" element={<FacultyViewInternshipDetailsPage />} />
            <Route path="/faculty/verify-internship-details" element={<VerifyInternshipDetailsPage />} />
          </Route>
          
          <Route path="/unauthorized" element={<h1>Whoops! You are not authorized :\</h1>} />
          <Route path="*" element={<h1>404! Page not found :\</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

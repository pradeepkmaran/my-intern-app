import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import "./EditInternshipDetails.css"; 

const EditInternshipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [internship, setInternship] = useState({
    role: "",
    companyName: "",
    location: "",
    period: "",
    stipend: "",
    researchIndustry: "",
    startDate: "",
    endDate: "",
    placementType: "",
    internshipOrder: "",
    proofLinks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/student/my-internships/${id}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${user?.access_token}`,
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setInternship(data.internship);
        } else {
          console.error("Failed to fetch internship:", data.message);
        }
      } catch (error) {
        console.error("Error fetching internship:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [id, user?.access_token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInternship((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/student/my-internships/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.access_token}`,
          },
          body: JSON.stringify(internship),
        }
      );
      const data = await response.json();
      if (data.success) {
        navigate("/student/view-internship-details"); 
      } else {
        console.error("Failed to update internship:", data.message);
      }
    } catch (error) {
      console.error("Error updating internship:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-internship-container">
      <h1>Edit Internship</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Role</label>
          <input
            type="text"
            name="role"
            value={internship.role}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={internship.companyName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={internship.location}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Period (weeks)</label>
          <input
            type="number"
            name="period"
            value={internship.period}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Stipend</label>
          <input
            type="number"
            name="stipend"
            value={internship.stipend}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Type (Industry/Research)</label>
          <input
            type="text"
            name="researchIndustry"
            value={internship.researchIndustry}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={internship.startDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={internship.endDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Placement Type</label>
          <input
            type="text"
            name="placementType"
            value={internship.placementType}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Internship Order Link</label>
          <input
            type="text"
            name="internshipOrder"
            value={internship.internshipOrder}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="submit-button">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditInternshipDetails;
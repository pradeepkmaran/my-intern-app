// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import LoginRoute from "./Routes/LoginRoute.js";
import StudentRoute from "./Routes/StudentRoute.js";
import { loginDB, usersDB } from "./db.js"; // Import the connections

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

loginDB.once("open", () => {
  loginDB.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error("Error listing collections in login DB:", err);
    } else {
      console.log("Collections in login DB:");
      collections.forEach((col) => console.log(col.name));
    }
  });
});

app.use("/api/user/login", LoginRoute);
app.use("/api/user/student", StudentRoute);
// app.use("/api/user/admin", AdminRoute);
// app.use("/api/user/faculty", FacultyRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

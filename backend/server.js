import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import LoginRoute from "./Routes/LoginRoute.js";
import StudentRoute from "./Routes/StudentRoute.js";
import verifyToken from "./Middlewares/VerifyToken.js";
import { loginDB, usersDB } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

loginDB.once("open", () => {
  console.log("Connected to 'login' database");
  loginDB.db.listCollections().toArray((err, collections) => {
    if (err) console.error("Error listing collections:", err);
    else collections.forEach((col) => console.log("Collection:", col.name));
  });
});

usersDB.once("open", () => {
  console.log("Connected to 'users' database");
  usersDB.db.listCollections().toArray((err, collections) => {
    if (err) console.error("Error listing collections:", err);
    else collections.forEach((col) => console.log("Collection:", col.name));
  });
});

app.use("/api/user/login", LoginRoute);
app.use("/api/user/student", verifyToken(['student']), StudentRoute);
// app.use("/api/user/faculty", verifyToken(['faculty']), FacultyRoute);
// app.use("/api/user/admin", verifyToken(['admin']), AdminRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import getLoginUserModel from "../../Models/LoginUser.js";
import getStudentUserModel from "../../Models/StudentUser.js";
import { loginDB, usersDB } from "../../db.js"; 

const LoginController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const LoginUser = getLoginUserModel(loginDB);
    const user = await LoginUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid Email" });
    }
    
    const isMatch = password === user.pw;
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    let new_user;

    if(user.user_type === 'student') {
      const StudentUser = getStudentUserModel(usersDB);
      new_user = await StudentUser.findOne({ email });
    } else if(user.user_type === 'faculty') {
      // const FacultyUser = getFacultyUserModel(usersDB);
      // new_user = await FacultyUser.findOne({ email });
      new_user = {name: "test name"};
    } else if(user.user_type === 'admin') {
      // const AdminUser = getAdminUserModel(usersDB);
      // new_user = await AdminUser.findOne({ email });
      new_user = {name: "test name"};
    }
    
    const payload = { user: { _id: user._id, name: new_user.name, email: user.email, user_type: user.user_type } };
    const access_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ access_token,  name: new_user.name, email: user.email, user_type: user.user_type });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export default LoginController;

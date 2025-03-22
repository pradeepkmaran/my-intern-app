import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import getLoginUserModel from "../Models/LoginUser.js";
import { loginDB } from "../db.js"; 

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

    const payload = { user: { _id: user._id, email: user.email, user_type: user.user_type } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, user_type: user.user_type });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export default LoginController;

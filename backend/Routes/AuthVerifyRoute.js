import express from "express";
import authVerify from "../Middlewares/AuthVerify.js";
const AuthVerifyRoute = express.Router();

AuthVerifyRoute.get("/", (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

export default AuthVerifyRoute;

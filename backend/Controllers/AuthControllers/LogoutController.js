const logoutController = (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
    });
    res.json({ message: "Logged out successfully" });
};

export default logoutController;
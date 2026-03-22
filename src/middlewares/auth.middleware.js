import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[ 1 ] || req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "Authentication failed: Token not found"
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        const user = await userModel.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Authentication failed: User not found"
            });
        }

        if (!user.verified) {
            return res.status(401).json({
                message: "Authentication failed: Email not verified"
            });
        }

        req.user = user;
        req.sessionId = decoded.sessionId;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Authentication failed: Invalid token",
            error: err.message
        });
    }
};

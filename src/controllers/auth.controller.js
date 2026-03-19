import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import { OAuth2Client } from "google-auth-library";
import appleSigninAuth from "apple-signin-auth";

const googleClient = new OAuth2Client();


export async function register(req, res) {

    const { name, username, email, password } = req.body;

    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyRegistered) {
        res.status(409).json({
            message: "Username or email already exists"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        name,
        username,
        email,
        password: hashedPassword
    })

    const otp = generateOtp();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user: user._id,
        otpHash
    })

    // Remove await so the API responds instantly while the email sends in the background!
    sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            name: user.name,
            username: user.username,
            email: user.email,
            verified: user.verified
        },
    })


}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    if (!user.verified) {
        return res.status(401).json({
            message: "Email not verified"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const isPasswordValid = hashedPassword === user.password;

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers[ "user-agent" ]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    )

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message: "Logged in successfully",
        user: {
            name: user.name,
            username: user.username,
            email: user.email,
        },
        accessToken,
        refreshToken // Added for mobile apps
    })
}

export async function getMe(req, res) {

    const token = req.headers.authorization?.split(" ")[ 1 ];

    if (!token) {
        return res.status(401).json({
            message: "token not found"
        })
    }

    const decoded = jwt.verify(token, config.JWT_SECRET)

    const user = await userModel.findById(decoded.id)

    res.status(200).json({
        message: "user fetched successfully",
        user: {
            name: user.name,
            username: user.username,
            email: user.email,
        }
    })

}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }


    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    )

    const newRefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken,
        refreshToken: newRefreshToken
    })
}

export async function logout(req, res) {

    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out successfully"
    })

}

export async function logoutAll(req, res) {

    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        revoked: true
    })

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out from all devices successfully"
    })

}


export async function verifyEmail(req, res) {
    const { otp, email } = req.body

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
        verified: true
    })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            name: user.name,
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    })
}

export async function googleAuth(req, res) {
    const { idToken } = req.body;
    
    if (!idToken) {
        return res.status(400).json({ message: "Google ID token required" });
    }
    
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: [config.GOOGLE_CLIENT_ID_ANDROID, config.GOOGLE_CLIENT_ID_IOS],
        });
        
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;
        
        // Find or create user
        let user = await userModel.findOne({ email });
        
        if (!user) {
            // Generate a secure random username if it doesn't exist
            const baseUsername = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
            const randomSuffix = crypto.randomBytes(3).toString('hex');
            const username = `${baseUsername}_${randomSuffix}`;
            
            user = await userModel.create({
                name: name || baseUsername,
                username,
                email,
                verified: true,
                authProvider: 'google',
                authProviderId: googleId,
                avatar: picture,
            });
        } else if (user.authProvider === 'local') {
            // Optional: link account if previously local
            user.authProvider = 'google';
            user.authProviderId = googleId;
            user.verified = true;
            if (picture && !user.avatar) user.avatar = picture;
            await user.save();
        }
        
        // Generate tokens
        const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "7d" });
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        
        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "MobileApp/GoogleAuth"
        });
        
        const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: "15m" });
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        return res.status(200).json({
            message: "Google login successful",
            user: {
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            },
            accessToken,
            refreshToken
        });
        
    } catch (error) {
        console.error("Google auth error:", error);
        return res.status(401).json({ message: "Invalid Google token" });
    }
}

export async function appleAuth(req, res) {
    const { identityToken } = req.body;
    
    if (!identityToken) {
        return res.status(400).json({ message: "Apple identity token required" });
    }
    
    try {
        const payload = await appleSigninAuth.verifyIdToken(identityToken, {
            // audience: config.APPLE_CLIENT_ID, // Use if needed
            ignoreExpiration: false
        });
        
        const { sub: appleId, email } = payload;
        
        if (!email) {
            return res.status(400).json({ message: "Email not provided by Apple token" });
        }
        
        // Find or create user
        let user = await userModel.findOne({ email });
        
        if (!user) {
            // Generate a secure random username
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const username = `appleuser_${randomSuffix}`;
            
            user = await userModel.create({
                name: "Apple User",
                username,
                email,
                verified: true,
                authProvider: 'apple',
                authProviderId: appleId,
            });
        } else if (user.authProvider === 'local') {
            user.authProvider = 'apple';
            user.authProviderId = appleId;
            user.verified = true;
            await user.save();
        }
        
        // Generate tokens
        const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "7d" });
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        
        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "MobileApp/AppleAuth"
        });
        
        const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: "15m" });
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        return res.status(200).json({
            message: "Apple login successful",
            user: {
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            },
            accessToken,
            refreshToken
        });
        
    } catch (error) {
        console.error("Apple auth error:", error);
        return res.status(401).json({ message: "Invalid Apple token" });
    }
}

export async function forgotPassword(req, res) {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        // Return 200 even if user not found for security reasons (prevents email enumeration),
        // but since this is a simple app, 404 is also fine. We'll use 404.
        return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    const html = getOtpHtml(otp);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove any existing OTP for this user to prevent spam
    await otpModel.deleteMany({ email });

    await otpModel.create({
        email,
        user: user._id,
        otpHash
    });

    // Send asynchronously in background
    sendEmail(email, "Password Reset OTP", `Your password reset code is ${otp}`, html);

    return res.status(200).json({
        message: "OTP sent to your email"
    });
}

export async function resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP, and newPassword are required" });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    });

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid or expired OTP"
        });
    }

    const hashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");

    await userModel.findByIdAndUpdate(otpDoc.user, {
        password: hashedPassword
    });

    await otpModel.deleteMany({
        user: otpDoc.user
    });

    return res.status(200).json({
        message: "Password reset successfully. You can now login with your new password."
    });
}

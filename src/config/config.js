import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!process.env.GOOGLE_CLIENT_ID_ANDROID) {
    throw new Error("GOOGLE_CLIENT_ID_ANDROID is not defined in environment variables");
}

if (!process.env.GOOGLE_CLIENT_ID_IOS) {
    throw new Error("GOOGLE_CLIENT_ID_IOS is not defined in environment variables");
}

// The following variables are ONLY needed if you want to use nodemailer to send OTP emails. 
// They are optional and not required for Flutter Google/Apple Sign-In.
// if (!process.env.GOOGLE_CLIENT_SECRET) {
//     console.warn("GOOGLE_CLIENT_SECRET is not defined in environment variables (Email sending disabled)");
// }
// if (!process.env.GOOGLE_REFRESH_TOKEN) {
//     console.warn("GOOGLE_REFRESH_TOKEN is not defined in environment variables (Email sending disabled)");
// }
// if (!process.env.GOOGLE_USER) {
//     console.warn("GOOGLE_USER is not defined in environment variables (Email sending disabled)");
// }

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID_ANDROID: process.env.GOOGLE_CLIENT_ID_ANDROID,
    GOOGLE_CLIENT_ID_IOS: process.env.GOOGLE_CLIENT_ID_IOS,
    GOOGLE_USER: process.env.GOOGLE_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
}

export default config;
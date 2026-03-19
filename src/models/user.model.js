import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [ true, "Name is required" ],
    },
    username: {
        type: String,
        required: [ true, "Username is required" ],
    },
    email: {
        type: String,
        required: [ true, "Email is required" ],
        unique: [ true, "Email must be unique" ]
    },
    password: {
        type: String,
        required: false // Optional for OAuth users
    },
    verified: {
        type: Boolean,
        default: false
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'apple'],
        default: 'local'
    },
    authProviderId: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    }
})

const userModel = mongoose.model("users", userSchema)

export default userModel;
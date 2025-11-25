import mongoose from "mongoose";

const  userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true,"password is required please enter your password"]

    }
},{timestamps:true})

export const User = new mongoose.model("User",userSchema)
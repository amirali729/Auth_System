
import { User } from "../models/user.model.js";


export const signupUser = async (req, res) => {
    try {
        const { username, password,email } = req.body

        if (!username || !password) {
            return res.status(401).json({
                message: "please provide both username and password"
            })
        }

        if([email,username, password].some((fields) => fields?.trim() === "")){
            return res.status(401).json({
                message: "username , password and message can not be empty can not be empty"
            })
        }

        const existingUser = await User.findOne({
            $or : [
                {username},
                {email}
            ]
        })

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(401).json({
                    message: "email already exists"
                })
            }
            if (existingUser.username === username) {
                return res.status(401).json({
                    message: "username already exists"
                })
            }
        }
        
        const user = await User.create({ username, password,email})

        const createdUser = await User.findById(user._id)
            .select("-password")
            .lean()

        if (!createdUser) {
            return res.status(500).json({
                message:"there some error in creating your account"
            })
        }

        return res.status(201).json({
            message: "you are account has been created",
            createdUser
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}
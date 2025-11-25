
import { User } from "../models/user.model.js";


export const signupUser = async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(401).json({
                message: "please provide both username and password"
            })
        }
 
        const user = await User.create({username,password})

        const createdUser = await User.findById(user._id)
        .select("-password")
        .lean()

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
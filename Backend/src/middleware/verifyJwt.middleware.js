export const verifyjwt = async (req, res, next) => {
    try {
        let token;

        // 1. Read token from cookies
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken.replace("Bearer ", "");
        }

        // 2. Read token from Authorization header
        else if (req.headers.authorization) {
            token = req.headers.authorization.replace("Bearer ", "");
        }

        // No token found
        if (!token) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find user
        const user = await User.findById(decoded._id)
            .select("-password -refreshToken")
            .lean();

        if (!user) {
            return res.status(401).json({ message: "Invalid access token" });
        }

        // Attach user to req
        req.user = user;

        next();

    } catch (error) {
        return res.status(500).json({
            message: error?.message || "There was an issue verifying the token"
        });
    }
};

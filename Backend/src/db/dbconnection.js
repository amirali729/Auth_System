import mongoose from "mongoose";

const dbConnection = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI)

        console.log(`database connected on ${connect.connection.host}`)
    } catch (error) {
        console.error( `there some error will connecting to database ${error}`)
        process.exit(1)
    }
}
export default dbConnection
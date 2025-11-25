import {app} from "./app.js";
import dotenv from 'dotenv'
import dbConnection from './db/dbconnection.js'



dotenv.config({
    path : './.env'
})
dbConnection()
.then(() => {
    app.listen(process.env.PORT,() => {
        console.log(`server is runing on ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log(`there some error connecting to database`)
})
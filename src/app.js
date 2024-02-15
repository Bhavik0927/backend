import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//routes decleration

app.use("/api/v1/users",userRouter);
// https://localhost:8000/api/v1/users/register


// app.use("/users",userRouter)
//https://localhost:8000/users --> (give permission to userRouter and it goes to userRouter where we define routes so we get)
// https://localhost:8000/users/register or
// https:localhost:8000/users/login

export { app }
import express from "express";
import cors from "cors"; // Need to be configured
import cookieParser from "cookie-parser"; // Need to be configured

const app = express();

// app.use() - use() used for configuration
app.use(cors({ origin: process.env.CORS_ORIGIN })); // cors configured

// Express security configurations for receiving data
app.use(express.json({limit:"16kb"})) // Put a limit on json data we receive through forms
app.use(express.urlencoded({extended:true,limit:"16kb"})) // Encoding the url to get the data, bcz often urls will be written in different style. 'Extended' used for nested objects (optional). Also put a limit.
app.use(express.static("public")) // For static files like media files. We make it public assets. 'public' is the folder name.

app.use(cookieParser()) // cookieParser configured for cookies



// Routes import
import userRouter from './routes/user.router.js'

// Routes declaration
app.use("/api/v1/users", userRouter) // http://localhost:8000/api/v1/users/register







export { app };

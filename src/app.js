import express from "express";
import cors from "cors"; // Need to be configured
import cookieParser from "cookie-parser"; // Need to be configured

const app = express();

// app.use() - use() used for configuration
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true })); // cors configured

// Express security configurations for receiving data
app.use(express.json({ limit: "16kb" })); // Put a limit on json data we receive through forms
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Encoding the url to get the data, bcz often urls will be written in different style. 'Extended' used for nested objects (optional). Also put a limit.
app.use(express.static("public")); // For static files like media files. We make it public assets. 'public' is the folder name.

app.use(cookieParser()); // cookieParser configured for cookies

// Routes import

import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter); // http://localhost:8000/api/v1/users/register
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };

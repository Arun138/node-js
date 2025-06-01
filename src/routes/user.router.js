import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // for register post api
  upload.fields([
    // 'upload' is the custom middleware. 'fields' is the middleware that processes multiple fields that contains files associated with the given form fields. '.array' can only handle one field that may contain multiple files.
    {
      name: "avatar", // field name
      maxCount: 1, // no. of files the field will take
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser); // here 'verifyJWT' is a middleware. We can use multiple of middlewares in a single route. like '...(verifyJWT,MidWare2,MidWare3,MidWare4,...,logoutUser)'. Just we have to use 'next()' in every middlewares in order to send the request to next middleware or function. So these will execute sequentially.
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar); // ''upload.single' - its bcz we are checking only single file
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;

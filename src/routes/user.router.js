import { Router } from "express";
import { logoutUser, registerUser } from "../controllers/user.controller.js";
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

// secured routes
router.route('/logout').post(verifyJWT,logoutUser) // here 'verifyJWT' is a middleware. We can use multiple of middlewares in a single route. like '...(verifyJWT,MidWare2,MidWare3,MidWare4,...,logoutUser)'. Just we have to use 'next()' in every middlewares in order to send the request to next middleware or function. So these will execute sequentially.


export default router;

import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;

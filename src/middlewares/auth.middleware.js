// This middleware will check if the user logged in or not

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _ , next) => {
  // since its a middleware, we will do the work and use 'next' to pass on the request
  // In case 'res' from "(req, res, next)"is not getting used, we can replace it with '_'.
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // taking the access token either from req.cookies or from the header
    /*
      'req.cookies?' - we check if the user have send the cookies or not, bcs he may have sent it in header. If cookies have it, we can access them directly.
      req.header("Authorization")?.replace("Bearer ","") - client sends the access token in header as key and value, like ' Authorization : Bearer <token> '. We check the 'Authorization' header, and just take out the access token.
    */

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // verify access token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    ); // we can access user's '_id'  from the decoded token bcz we included '_id' in the token generation process.

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user; // adding a new object in the 'req'
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

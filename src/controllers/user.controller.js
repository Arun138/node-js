import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  // asyncHandler is a higer order function. We are sending a function as a parameter.
  /*
    step by step thinking:
    get user details from frontend
    validation - should be not empty
    check if the user already exists: username, email
    check for images, check for avatar
    upload them to cloudinary, avatar
    create user object - create entry in db
    remove password and refresh token field from response
    check for user creation
    return response
  */
  // get user details from frontend
  const { fullName, email, username, password } = req.body;

  // validation - should be not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    // '.some' : Determines whether the specified callback function returns true for any element of an array. It runs a test on each element of the array. If at least one field meets the condition, .some() returns true.

    // '.trim' removes any leading or trailing spaces(spaces at the beginning and end, but the extra spaces between any letters or words remain untouched). If username = "  ", meaning it only contains spaces, it gets trimmed to "", triggering the error. - If password = null, field?.trim prevents an error, but since null?.trim evaluates to undefined, the check doesn’t work as intended. A better approach would be: field?.trim() === ""
    throw new ApiError(400,"(Custom Error) | All fields are required");
  }

  // check if the user already exists: username, email
  const existedUser = await User.findOne({
    // '.findOne()' searches for a single document that matches the query.

    $or: [{ username }, { email }], // {$or: [{ username }, { email }]} is a MongoDB query operator that checks if a user exists with the given username OR email, the function returns that user.
  });

  if (existedUser) {
    // console.log(existedUser);
    throw new ApiError(409, "(Custom Error) | User with email or username already exists.");
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "(Custom Error) | Avatar file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "(Custom Error) | Avatar file didn't get uploaded. ");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url, // storing only the url
    coverImage: coverImage?.url || '', // coverImage is not necessary in registration. So checking here
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // using '_id' bcz MONGODB will automatically add it to the object after creation. // '.select()' will select the mentioned fields. '-' mwans don't select that field.

  // check for user creation
  if (!createdUser) {
    throw new ApiError(400,"(Custom Error) | Something went wrong during user registration.");
  }

  // return response
  return res.status(201).json(
    new ApiResponse(200,createdUser,'User registered successfully.')
  )
});

export { registerUser };

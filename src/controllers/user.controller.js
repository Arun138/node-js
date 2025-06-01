import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // 'validateBeforeSave: false' - before saving the obj, it validate and ask for 'passowrd' field as well. To bypass that we used 'validateBeforeSave'.

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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
    throw new ApiError(400, "(Custom Error) | All fields are required");
  }

  // check if the user already exists: username, email
  const existedUser = await User.findOne({
    // '.findOne()' searches for a single document that matches the query.

    $or: [{ username }, { email }], // {$or: [{ username }, { email }]} is a MongoDB query operator that checks if a user exists with the given username OR email, the function returns that user.
  });

  if (existedUser) {
    // console.log(existedUser);
    throw new ApiError(
      409,
      "(Custom Error) | User with email or username already exists."
    );
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "(Custom Error) | Avatar file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(
      400,
      "(Custom Error) | Avatar file didn't get uploaded. "
    );
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url, // storing only the url
    coverImage: coverImage?.url || "", // coverImage is not necessary in registration. So checking here
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // using '_id' bcz MONGODB will automatically add it to the object after creation. // '.select()' will select the mentioned fields. '-' means don't select that field.

  // check for user creation
  if (!createdUser) {
    throw new ApiError(
      400,
      "(Custom Error) | Something went wrong during user registration."
    );
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    Step by step thinking:
    - req body -> data
    - username or email
    - find the user
    - password check
    - access and refresh token
    - send cookie
  */

  // req body -> data
  const { email, username, password } = req.body;

  // username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or password is required");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist.");
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password); // here 'user' is the actual object we got from db, whose data we need. 'User' is a the model, so we can't use that.

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials.");
  }

  // access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // send cookie
  // We will send user data for cookie. But above 'user' object haven't updated with the refreshToken. So either we can update  above 'user' object or we can make a db call and bring the object. If calling db is an expensive task, we can update above 'user' object and send for the cookie.

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // here, we made the db call

  const options = {
    // to send cookies we need to design this object. Cookies can be modified by anyone in frontend. When we add below fields as true, it can only be modified by the server, but can be seen in frontend.
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) // we can access these cookies with 'req.cookies.accessToken','req.cookies.refreshToken'
    .json(
      new ApiResponse(
        200, // status code
        {
          // data
          user: loggedInUser,
          accessToken,
          refreshToken,
          // We should send the tokens in the json data as well. Because, frontend coder may want to store the tokens in the frontend.
        },
        "User logged in successfully" // message
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, // find the object
    {
      // mention what to update
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true } // By default, findOneAndUpdate() returns the object as before it was updated. If you set "new: true", findOneAndUpdate() will instead give you the object after it was updated.
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // verify refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword; // it will be encrypted before saving
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await user
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    )
    .select("-password");

  return res
    .status(200)
    .json(200, user, "Account details updated successfully");
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; // '.file' is used instead of '.files' bcz here we are updating only one file

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(
      400,
      "Error wile uploading on avatar | Claudinary URL not found."
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "Avatar updated successfully");
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; // '.file' is used instead of '.files' bcz here we are updating only one file

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(
      400,
      "Error wile uploading on coverImage | Claudinary URL not found."
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "Cover image updated successfully");
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; // getting the channel name from the URL
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  // Agreegate pipelines
  const channel = await User([
    {
      // 1st filter
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // 2nd filter within above filter(s)
      $lookup: {
        from: "subscriptions", // model where we need to search further. 'Subscription' model's name in mongodb is 'subscriptions'
        localField: "_id", // field of User model, which is a foreign field in 'subscriptions'
        foreignField: "channel", // field of 'subscriptions' model. We will get all the subscribers of this user.
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions", // model where we need to search further. 'Subscription' model's name in mongodb is 'subscriptions'
        localField: "_id", // field of User model, which is a foreign field in 'subscriptions'
        foreignField: "subscriber", // field of 'subscriptions' model. We will get the user's subscribed list
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        // these are added fields to the User model
        subscribersCount: {
          // it will count the no. of documents in the mentioned fields
          $size: "$subscribers", // we evaluated 'subscribers' above
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo", // we evaluated 'subscribedTo' above
        },
        isSubscribed: {
          // will tell if logged in user have subscribed to the shown channel
          $cond: {
            // condition
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // checking if 'req.user?._id' is in '$subscribers.subscriber' list
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // will send/project fields in the response that we have chosen
        fullName: 1, // 1 means 'send'
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel does not exist");
  }

  return res.
  status(200)
  .json(
    new ApiResponse(200,channel[0],'User channel fetched successfully.')
  )
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};

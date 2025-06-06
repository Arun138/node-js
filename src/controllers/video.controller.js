import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Playlist } from "../models/playlist.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // Checking if the query is valid or not.
  const trimmedQuery = query?.trim(); // removing trainling spaces
  if (!trimmedQuery) {
    throw new ApiError(400, "(Custom Error) | Please enter keywords to search");
  }
  // if valid, making them suitable for searching in models
  const regexPattern = trimmedQuery.replace(/\s+/g, "|"); // replacing spaces between words with '|', which is the 'OR' operator in regular expressions.

  // Checking if the userId is valid or not
  let userData;
  if (isValidObjectId(userId)) {
    userData = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos",
        },
      },
      {
        $project: {
          // will send/project fields in the response that we have chosen
          _id: 1,
          fullName: 1, // 1 means 'send'
          username: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
          videos: 1,
        },
      },
    ]);
  }

  // Setting sorting parameters
  let sortFilter = {};

  if (sortBy && Array.isArray(sortBy) && sortBy.length > 0) {
    sortBy.forEach((field) => {
      sortFilter[field] = sortType;
    });
  }

  // All videos based on query and sorting
  const allVideos = await Video.find({
    $or: [
      { title: { $regex: regexPattern, $options: "i" } }, // - $options: "i" ensures case-insensitive searching.
      { description: { $regex: regexPattern, $options: "i" } },
    ],
  }).sort(sortFilter);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userData, allVideos },
        "Searched items are fetched successfully"
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  const { videoFile, thumbnail } = req.files;

  if (
    [title, description].some((field) => field?.trim() === "") &&
    [videoFile, thumbnail].some((field) => field?.trim() === undefined)
  ) {
    throw new ApiError(400, "(Custom Error) | All fields are required");
  }

  try {
    const videoFileLocalPath = videoFile[0]?.path;
    const thumbnailLocalPath = thumbnail[0]?.path;

    const videoFileUpload = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFileUpload) {
      throw new ApiError(
        400,
        "(Custom Error) | Video file didn't get uploaded. "
      );
    }

    if (!thumbnailUpload) {
      throw new ApiError(
        400,
        "(Custom Error) | Thumbnail file didn't get uploaded. "
      );
    }

    const video = await Video.create({
      videoFile: videoFileUpload.url,
      thumbnail: thumbnailUpload.url,
      title,
      description,
      duration: videoFileUpload.duration,
      owner: req.user?._id,
    });

    if (!video) {
      throw new ApiError(
        400,
        "(Custom Error) | Something went wrong during creating video object. "
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      "(Custom Error) | Something went wrong during publishing video."
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "(Custom Error) | Video couldn't be found. ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  if (!Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  try {
    const updateFields = {};
    // Only add fields if they exist and are not empty
    if (title?.trim()) updateFields.title = title.trim();
    if (description?.trim()) updateFields.description = description.trim();

    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    ) {
      let thumbnailUrl = await uploadOnCloudinary(req.files.thumbnail[0].path);

      // Only add thumbnail if `thumbnailUrl` is provided
      if (thumbnailUrl) {
        updateFields.thumbnail = thumbnailUrl.url;
      }
    }

    const video = await Video.findOneAndUpdate(
      {
        _id: videoId,
        owner: req.user?._id,
      },
      { $set: updateFields }, // Updates only the specified fields
      { new: true }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video updated successfully."));
  } catch (error) {
    throw new ApiError(
      400,
      "(Custom Error) | Error while updating video ",
      error
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  if (!Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  try {
    await Video.findOneAndDelete({
      _id: videoId,
      owner: req.user?._id,
    });

    //  Remove the video from ALL playlists across ALL users that contain this video
    await Playlist.updateMany(
      { videos: videoId }, // Find ANY playlist containing this video
      { $pull: { videos: videoId } } // Remove video from those playlists
    );

    // Remove all like objects related to this video
    await Like.deleteMany({ video: videoId });

    // Remove all comment objects related to this video
    await Comment.deleteMany({ video: videoId });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully."));
  } catch (error) {
    throw new ApiError(
      400,
      "(Custom Error) | Something went wrong during deleting video.",
      error
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  if (!Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user?._id,
    },
    [ // [] this makes it an aggregation pipeline update. The $not operator is a query operator and cannot be used inside $set which is a update operator without []
      {
        $set: {
          isPublished: { $not: "$isPublished" }, // This ensures true ⇄ false toggling
        },
      },
    ],
    { new: true }
  );

  if (!video) {
    throw new ApiError(400, "(Custom Error) | Video couldn't be toggled. ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video toggled successfully."));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

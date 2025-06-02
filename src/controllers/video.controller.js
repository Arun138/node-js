import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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

  if (videoId === "") {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "(Custom Error) | Video couldn't be found. ");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  if (videoId === "") {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  let video;
  try {
    const updateFields = {
      title,
      description,
    };

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

    video = await Video.findOneAndUpdate(
      {
        _id: videoId,
        owner: req.user?._id,
      },
      { $set: updateFields }, // Updates only the specified fields
      { new: true }
    );
  } catch (error) {
    throw new ApiError(
      400,
      "(Custom Error) | Error while updating video ",
      error
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (videoId === "") {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  const video = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user?._id,
  });

  if (!video) {
    throw new ApiError(400, "(Custom Error) | Video couldn't be deleted. ");
  }

  res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (videoId === "") {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user?._id,
    },
    {
      $set: {
        isPublished: { $not: "$isPublished" }, // This ensures true ⇄ false toggling
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(400, "(Custom Error) | Video couldn't be toggled. ");
  }

  res
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

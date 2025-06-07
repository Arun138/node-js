import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  if (!Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      video: videoId,
    });

    let operation;

    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        video: videoId,
      });
      operation = "Unliked the video";
    } else {
      await Like.create({
        likedBy: req.user?._id,
        video: videoId,
      });
      operation = "Liked the video";
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, operation, "Video-like toggled successfully.")
      );
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong during toggling video-like. ",
      error
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(
      400,
      "(Custom Error) | Please give a valid comment id. "
    );
  }

  if (!Comment.exists({ _id: commentId })) {
    throw new ApiError(400, "Comment does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      comment: commentId,
    });
    let operation;
    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        comment: commentId,
      });
      operation = "Unliked the comment";
    } else {
      await Like.create({
        likedBy: req.user?._id,
        comment: commentId,
      });
      operation = "Liked the comment";
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, operation, "Comment-like toggled successfully.")
      );
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong during toggling comment-like. ",
      error
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(
      400,
      "(Custom Error) | Please give a valid comment id. "
    );
  }

  if (!Tweet.exists({ _id: tweetId })) {
    throw new ApiError(400, "Comment does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      tweet: tweetId,
    });
    let operation;

    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        tweet: tweetId,
      });
      operation = "Unliked the tweet";
    } else {
      await Like.create({
        likedBy: req.user?._id,
        tweet: tweetId,
      });
      operation = "Liked the tweet";
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, operation, "Tweet-like toggled successfully.")
      );
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong during toggling tweet-like. ",
      error
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: {
          $exists: true, // $exists: true - only includes documents that have a video field
          $ne: null, // $ne: null - excludes documents where the video field is null
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $unwind: "$likedVideos", // Flatten the likedVideos array
    },
    {
      $replaceRoot: { newRoot: "$likedVideos" }, // Make video document the root
    },
  ]);

  if (!(likedVideos.length>0)) {
    throw new ApiError(400, "You haven't liked any videos yet");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully.")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

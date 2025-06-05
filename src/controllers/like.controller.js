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

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "(Custom Error) | Please give a valid video id. ");
  }

  if (Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      video: videoId,
    });

    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        video: videoId,
      });
    } else {
      await Like.create({
        likedBy: req.user?._id,
        video: videoId,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video-like toggled successfully."));
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
  if (isValidObjectId(commentId)) {
    throw new ApiError(
      400,
      "(Custom Error) | Please give a valid comment id. "
    );
  }

  if (Comment.exists({ _id: commentId })) {
    throw new ApiError(400, "Comment does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      comment: commentId,
    });

    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        comment: commentId,
      });
    } else {
      await Like.create({
        likedBy: req.user?._id,
        comment: commentId,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment-like toggled successfully."));
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
  if (isValidObjectId(tweetId)) {
    throw new ApiError(
      400,
      "(Custom Error) | Please give a valid comment id. "
    );
  }

  if (Tweet.exists({ _id: tweetId })) {
    throw new ApiError(400, "Comment does not exists");
  }

  try {
    const isLiked = await Like.findOne({
      likedBy: req.user?._id,
      tweet: tweetId,
    });

    if (isLiked) {
      await Like.deleteOne({
        likedBy: req.user?._id,
        tweet: tweetId,
      });
    } else {
      await Like.create({
        likedBy: req.user?._id,
        tweet: tweetId,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet-like toggled successfully."));
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
  ]);

  if (!likedVideos) {
    throw new ApiError(400, "You haven't liked any videos yet");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully.")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

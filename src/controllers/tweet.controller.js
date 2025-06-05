import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const {content} = req.body

  if (!content.trim()) {
    throw new ApiError(
      400,
      "Tweet can't be empty.");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(
      400,
      "Tweet couldn't be created.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.params
  const tweets = await Tweet.find((owner = userId)).sort({
    createdAt: -1,
  });

  if (!tweets) {
    throw new ApiError(
      400,
      "Tweets couldn't be found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (isValidObjectId(tweetId)) {
    throw new ApiError(
      400,
      "Tweet id is invalid.");
  }

  if (Tweet.exists({ _id: tweetId })) {
    throw new ApiError(
      400,
      "Tweet does not exists");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(
      400,
      "Something went wrong during updating the tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (isValidObjectId(tweetId)) {
    throw new ApiError(
      400,
      "Tweet id is invalid.");
  }
  
  if (Tweet.exists({ _id: tweetId })) {
    throw new ApiError(
      400,
      "Tweet does not exists");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(
      400,
      "Something went wrong during deleting the tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

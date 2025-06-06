import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is invalid");
  }

  if (Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exists");
  }

  const videoComments = await Comment.find({ video: videoId });

  if (!videoComments) {
    throw new ApiError(400, "No comments were found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoComments,
        "All comments of the video is fetched."
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // TODO: add a comment to a video

  const { comment } = req.body;

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is invalid");
  }

  if (Video.exists({ _id: videoId })) {
    throw new ApiError(400, "Video does not exist");
  }

  const addedComment = await Comment.create({
    video: videoId,
    content: comment,
  });

  if (!addedComment) {
    throw new ApiError(400, "Comment couldn't be added");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  // TODO: update a comment

  const { comment } = req.body;

  if (isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id is invalid");
  }

  if (Comment.exists({ _id: commentId })) {
    throw new ApiError(400, "Comment does not exist");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: comment,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(400, "Comment couldn't be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  // TODO: delete a comment

  if (isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id is invalid");
  }

  const deletedComment = await Comment.findByIdAndDelete(
    commentId
  );

  if (!deletedComment) {
    throw new ApiError(400, "Comment couldn't be deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };

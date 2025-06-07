import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(400, "All the fields are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist couldn't be created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist successfully crested"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User id is invalid");
  }

  if (!User.exists({ _id: userId })) {
    throw new ApiError(400, "User does not exist");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(400, "Playlists couldn't be found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id id is invalid");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(400, "Playlists couldn't be found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is invalid");
  }
  if (!Video.exists(videoId)) {
    throw new ApiError(400, "Video does not exists");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid");
  }
  if (!Playlist.exists({ _id: playlistId })) {
    throw new ApiError(400, "Playlist does not exists");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId }, // here 'videos' is an array
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(400, "Video couldn't be added to the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video successfully added to the playlist")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  if (!Playlist.exists({ _id: playlistId })) {
    throw new ApiError(400, "Playlist does not exists");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
      videos: videoId, // Only update if video exists in playlist
    },
    {
      $pull: { videos: videoId }, // here 'videos' is an array
      // $pull: { videos: { $in: [videoId1, videoId2, videoId3] } } //Bulk Operations (if removing multiple videos)
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(400, "Video couldn't be removed from the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Video successfully removed from the playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid");
  }
  if (!Playlist.exists({ _id: playlistId })) {
    throw new ApiError(400, "Playlist does not exists");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Playlist deleted successfully.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist id is invalid");
  }
  if (!Playlist.exists({ _id: playlistId })) {
    throw new ApiError(400, "Playlist does not exist");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(400, "Playlist couldn't be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist successfully updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

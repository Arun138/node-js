import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelInfo = await User.aggregate([
    { $match: { 
        _id: new mongoose.Types.ObjectId(req.user?._id),
     } },

    // Total subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "totalSubscribers",
      },
    },

    // Total videos owned by this user
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideos",
      },
    },

    // Total likes on all videos owned by this user
    {
      $lookup: {
        from: "likes",
        let: { videoIds: "$totalVideos._id" }, // 'let' defines variables that can be used in the pipeline. 'videoIds' is a variable we're creating.
        // "$totalVideos._id" extracts all the _id values from the 'totalVideos' array. Example: If totalVideos contains 3 videos, videoIds becomes [ObjectId1, ObjectId2, ObjectId3]
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$video", "$$videoIds"] }, // '$expr' allows us to use aggregation expressions in the match condition
              /* 
                $in: ["$video", "$$videoIds"] :
                - "$video" refers to the video field in each 'likes' document ($ means current document)
                - "$$videoIds" refers to the variable defined in let ($$ means variable)
                - $in checks if the like's video field ($video) value exists in the videoIds array ($$videoIds)
                - all the documents that match will be included in 'totalVideoLikes'  
              */
            },
          },
        ],
        as: "totalVideoLikes",
      },
    },

    // Calculate final statistics
    {
      $addFields: {
        subscribersCount: { $size: "$totalSubscribers" }, // count no. of documents
        videosCount: { $size: "$totalVideos" },
        totalViews: { $sum: "$totalVideos.views" }, // adding up 'views' of all the documents
        totalLikes: { $size: "$totalVideoLikes" },
      },
    },

    // Project only the needed fields
    {
      $project: {
        fullName:1,
        avatar:1,
        coverImage:1,
        subscribersCount: 1,
        videosCount: 1,
        totalViews: 1,
        totalLikes: 1,
      },
    },
  ]);

  if (!channelInfo) {
    throw new ApiError(
      400,
      "No stats found");
  }

  return res.status(200).json(new ApiResponse(200,channelInfo,"Channel stats fetched successfully"))
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  
  const allVideos = await Video.find({ owner: req.user?._id });

  if (!allVideos) {
    throw new ApiError(400, "No video found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allVideos ,
        "All videos of the channel are fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };

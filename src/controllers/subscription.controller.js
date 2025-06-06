import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel Id is invalid");
  }

  if (!User.exists({ _id: channelId })) {
    throw new ApiError(400, "Channel does not exists");
  }

  // check if current user have given channelId in its 'channel' field
  // if yes, remove it. if no, add it.

  try {
    const isSubscribed = await Subscription.findOne({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (isSubscribed) {
      await Subscription.deleteOne({
        subscriber: req.user?._id,
        channel: channelId,
      });
    } else {
      await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subscription toggled successfully."));
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong during toggling subscription. ",
      error
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Channel Id is invalid");
  }

  if (!User.exists({ _id: subscriberId })) {
    throw new ApiError(400, "Channel does not exists");
  }

  const allSubscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberlInfo",
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
  ]);

  // const allSubscribers = await User.aggregate([
  //   {
  //     $match: {
  //       _id: new mongoose.Types.ObjectId(subscriberId),
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "subscriptions",
  //       localField: "_id",
  //       foreignField: "channel",
  //       as: "subscribers",
  //     },
  //   },
  // ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { allSubscribers },
        "All subscribers are fetched successfully."
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Subscriber Id is invalid");
  }

  if (!User.exists({ _id: channelId })) {
    throw new ApiError(400, "Channel does not exists");
  }

  const allSubscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { allSubscribedChannels },
        "All subscribed channels are fetched successfully."
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

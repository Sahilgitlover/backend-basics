import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = await req.body;
    const user = await User.findById(req.user?._id);
    console.log(user);
    if(!user) return new ApiError(400,"User is required. Please login first.");

    const tweet = await Tweet.create({
        content,
        user
    })
    console.log("tweet");
    console.log(tweet);
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // const user = await User.findById(req.user?._id);
    // if(!user) return new ApiError(400,"User is required. Please login first.");
    // console.log("heelo");

    const tweets = await Tweet.find({ owner: req.user?._id })
    // const tweets2  = await User.findById(req.params)
    .exec()
    .then(tweets => {
        // Tweets belonging to the specified owner
        console.log(tweets);
    })
    .catch(error => {
        // Handle error
        console.error("Error finding tweets:", error);
    });

    // Tweet.find({owner});
    if(!tweets) return new ApiError(400,"Tweets not found.");
    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = await req.body;
    const tweet = await Tweet.findById(req.params?._id);
    if(!tweet) return new ApiError(400,"Tweet is required. Please login first.");
    tweet.content = content;
    await tweet.save();
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweet = await Tweet.findById(req.params?._id);
    if(!tweet) return new ApiError(400,"Tweet is required. Please login first.");
    const deletedTweet = await tweet.remove();
    if(!deletedTweet) return new ApiError(400,"Tweet is not deleted");
    return res.status(200).json(
        new ApiResponse(200, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

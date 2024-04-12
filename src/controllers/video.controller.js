import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

// const publishAVideo = asyncHandler(async (req, res) => {

//     try {
//         const user = await User.findById(req.user?._id);
//         if(!user) return res.status(404, "User not found");
//         const owner = user._id;
    
//         const { title, description} = req.body
//         if(!title || !description) return new ApiError(404, "Title and description are required");
//         console.log("title print");
    
//         const videoFilePath  = req.files?.videoFile[0]?.path
//         if(!videoFilePath ) return new ApiError(404, "Video are required");
//         const videoFile = await uploadOnCloudinary(videoFilePath)
//         if(!videoFile) return new ApiError(400, "Video file is required");

//         const thumbnailFilePath = req.files?.thumbnailFile[0]?.path
//         if(!thumbnailFilePath ) return new ApiError(404, "thumbnail is required");
//         const thumbnail = await uploadOnCloudinary(thumbnailFilePath)
//         console.log("title print"); 
//         if(!thumbnail || !videoFile) return new ApiError(404, "thumbnail and video is required");
    
//         const video = Video.create({
//             owner,
//             title,
//             description,
//             videoFile:video.url,
//             thumbnail:thumbnail.url
//         })
    
//         return res.status(201).json(
//             new ApiResponse(200,video,"Video created successfully")
//         )
//     } catch (error) {
//         return new ApiError(500, "Internal server error", error)
//     }
//     // TODO: get video, upload to cloudinary, create video
// })

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    //get video path
    const videoExists = req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0
    
    if(!videoExists){
        throw new ApiError(404, "Video not recieved")
    }
    const videoPath = req.files.videoFile[0].path

    //get thumbnail path
    const thumbnailExists = req.files && Array.isArray(req.files.thumbnailFile) && req.files.thumbnailFile.length > 0
    
    if(!thumbnailExists){
        throw new ApiError(404, "Thumbnail not found")
    }
    const thumbnailPath = req.files.thumbnailFile[0].path

    //upload both on cloudinary
    const videoFile = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!videoFile.url || !thumbnail.url){
        throw new ApiError(500, "Error encountered while uploading the image")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded successfully!")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
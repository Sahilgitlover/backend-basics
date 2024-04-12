import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"// for user exist
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefereshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})// if not vali... then password saved

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500, "something went wrong while generating refreah and access token")
    }
}

const registerUser = asyncHandler( async(req,res) => {
    // res.status(200).json({
    //     message: "hello sahil"
    // })

    //url or form data / json
    const {fullName, email, username, password} = req.body
    // console.log("email : ",req.body);

    //validation
    if(
        [fullName,email,username,password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All field are required")
    }
    if (!email || email.indexOf("@") == -1) throw new ApiError(400, "Email is invalid");

    // already exist user check
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    console.log("existedUser : " + existedUser);

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }
// access by multer  // [0] -> 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.file.coverImage)
    //  && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }


    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    // create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    
//password RefrehToken nhi chahiye isse remove ho jaynge
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user")

    //postman k kiye 201
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})


// const loginUser = asyncHandler(async (req,res) => {
//     // req body -> data

//     const {email,username,password} = req.body

//     if(!username && ! email) throw new ApiError(400,"username or password is required")

//     const user = await User.findOne({
//         $or: [{username},{email}]
//     })

//     if(!user) throw new ApiError(404, "User does not exist")

//     const isPasswordValid = await user.isPasswordCorrect(password)
//     if(!isPasswordValid) throw new ApiError(404, "Invalid User credentials")

//     const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

//     // send in cookie
//     const loggedInUser = User.findById(user._id).
//     select("-password -refreshToken")

//     const options = {
//         httpOnly: true,//modified by server only
//         secure: true,
//     }

//     return res.status(200).
//     cookie("accessToken",accessToken, options).
//     cookie("refreshToken",refreshToken,options).
//     json(
//         new ApiResponse(
//             200,
//             {
//                 user: loggedInUser,accessToken,refreshToken
//             },
//             "User logged in successfully"
//         )
//     )
// })


/* Register user steps

get user detail from frontend 
validation(not empty,correct format)
check if user already exist (email, username)
check for images and check for avatar(complulsory)
upload them to cloudinary, avatar
create user object - create db points
remove password and refresh token field from response
check for user creation 
return response or error

*/


const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email && !password) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    // access by cookies-> refresh Token
    // mobile k liye req.body
    const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshtoken) throw new ApiError(401,"unauthorized request")

    try {
        const decodedToken = jwt.verify(
            incomingRefreshtoken,
            process.env.REFRESH_TOKEN_SECRET
        )
        console.log("decodedToken: " + JSON.stringify(decodedToken));
        // find user
        const user = await User.findById(decodedToken?._id)
    
        if(!user) throw new ApiError(401,"Invalid refresh token")
    
        if(incomingRefreshtoken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired")
        }
    
        const{accessToken,newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400,"Invalid old password")

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrrentUser = asyncHandler(async(req,res) => {
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body

    if(!fullName && !email) {
        throw new ApiError(400, "All field is required")
// by new ->true means update k baad vali info return
       
    }
     const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName: fullName,
                    email,
                }
            },
            {new: true}
        ).select("-password")

        return res.status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400,"avatar file is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400,"error while uploading files")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    // do old image to be deleted

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar uploaded successfully"))
})

const updateUsercoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path // beacuse of single entity we write file instead of files

    if(!coverImageLocalPath) throw new ApiError(400,"cover image file is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) throw new ApiError(400,"error while uploading files")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Cover image uploaded successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params

    if(!username?.trim()) throw new ApiError(400,"Username is missing")

    /*This method allows you to perform aggregation operations on 
    the documents in the MongoDB collection. Aggregation operations
    allow you to process and transform the data in various ways, 
    such as grouping documents, calcula ting aggregated values,
    and more. */

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {//subscribers
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
           //maine kitne subscribe kiye
           $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedto"
            } 
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscriberToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscriberToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) throw new ApiError(404,"channel does not exist")

    return res.status(200)
    .json(new ApiResponse(200,channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipleine: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ] 
            }
        }
    ])
    
    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile,
    getWatchHistory,
}

/* Register user steps

get user detail from frontend 
validation(not empty,correct format)
check if user already exist (email, username)
check for images and check for avatar(complulsory)
upload them to cloudinary, avatar
create user object - create db points
remove password and refresh token field from response
check for user creation 
return response or error

*/


/*login user requirement

req -> body = data
username or email
find the user
password check
access and refresh taken generate
send cookie

*/

/* logout

cookie remove
reset refresh token

*/
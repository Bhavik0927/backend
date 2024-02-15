import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js'; 
import { ApiResponse } from '../utils/ApiResponse.js';
import { response } from 'express';

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation
    // check if the user already exists: username,email
    // check for images,check for avatar 
    // upload them to cloudinary, avatar 
    // create user object - crreate entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return res 
    const {email} = req.body;
    console.log(email);

    // if(fullname === ""){throw new ApiError(400,"fullname is required")}
 
    // 2> validation  (adv code of above)
    if(
        [fullname,email,usename,password].some((field) =>
        field?.trim() === '')
    ){
        throw new ApiError(404,"All fields are required")
    }

    // 3> check if the user already exists: username,email
    const existedUser = User.findOne({
        $or:[{ usename },{ email }]
    })
       
    if(existedUser){ throw new ApiError(409,"User with email or usename already exists") }

    // 4> check for images,check for avatar  
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);

    const coverImgLocalPath = req.files?.coverImage[0]?.path;
    console.log(coverImgLocalPath);

    if(!avatarLocalPath) {throw new ApiError(400,"Avatar file is required")}

    // 5> upload them to cloudinary, avatar 
    const avatar = await uploadOnCloudinary(avatarLocalPath); // it takes some times
    const coverImage = await uploadOnCloudinary(coverImgLocalPath);

    if(!avatar) { throw new ApiError(400,"Avatar file is required") }

    // 6> create user object - crreate entry in db
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    // 7> remove password and refresh token field from response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){ throw new ApiError(500,"Something went wrong while registaring ")}

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registred successfully")
    )
})

export {registerUser}
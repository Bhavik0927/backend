import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId); //find user by id from database
        const accessToken = user.generateAccessToken(); // create accessToken 
        // console.log(accessToken)
        const refreshToken = user.generateRefreshToken(); // create refreshToken
        // console.log(refreshToken)

        user.refreshToken = refreshToken   // save in database
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }   // generate accessToken

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation
    // check if the user already exists: username,email
    // check for images,check for avatar 
    // upload them to cloudinary, avatar 
    // create user object - crreate entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return res 
    const { fullName, email, username, password } = req.body;
    // console.log(email);
    console.log(req.body);


    // 2> validation  (adv code of above)
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === '')
    ) {
        throw new ApiError(404, "All fields are required")
    }

    // 3> check if the user already exists: username,email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) { throw new ApiError(409, "User with email or usename already exists") }

    // 4> check for images,check for avatar  
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log(coverImageLocalPath);
    if (!avatarLocalPath) { throw new ApiError(400, "Avatar file is required") }

    // 5> upload them to cloudinary, avatar 
    const avatar = await uploadOnCloudinary(avatarLocalPath); // it takes some times

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) { throw new ApiError(400, "Avatar file is required") }

    // 6> create user object - crreate entry in db
    const user = await User.create({
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        fullName,
        email,
        password,
        username: username.toLowerCase()
    })

    // 7> remove password and refresh token field from response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) { throw new ApiError(500, "Something went wrong while registaring ") }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registred successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    // req.body -> data
    const { email, username, password } = req.body
    if (!username && !email) { throw new ApiError(404, "username or email is required") }

    // find the user basic on email or either username
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) { throw new ApiError(404, "User does not exist") }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (isPasswordValid) { throw new ApiError(401, "Invalid user credentials") }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // console.log(accessToken);
    // console.log(refreshToken);

    // send cookie
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
                "user logged In Successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) { throw new ApiError(401, "unAuthorized request") }

    try { 
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) { throw new ApiError(401, "Invalid refresh token") }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refresh: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
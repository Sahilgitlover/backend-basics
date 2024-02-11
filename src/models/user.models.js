import mongoose,{Schema} from "mongoose";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,// cloudinary url
        required: true,
    },
    coverImage: {
        type: String,// cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "video"
        }
    ],
    password: {
        type: String,
        required: [true, "PAssword is reuired"]
    },
    refreshToken: {
        type: String
    }

},{timestamps : true})


UserSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10) //10 represent round
    next()
})

UserSchema.methods.isPasswordCorrect = async function(pssword) {
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User",UserSchema)
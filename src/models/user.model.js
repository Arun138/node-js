import mongoose from "mongoose";
import jwt from "jsonwebtoken"; // Install
import bcrypt from "bcrypt"; // Install

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // makes searching easier and optimized
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
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Middleware to encrypt password
/*
userSchema.pre("save",function () {})
The function will be triggered before saving or updating any user data. Here, 'pre' is a middleware, 'save' is an event (but also a previously defined function in mongoose). 
We can't use the arrow function here, because we need to have a context for it. So 'function' will be used.
We need to make it async bcz encryption will take some time.
Middleware will access to 'next' flag, from other flags (err,req,res,next), in order to forward the request. 
*/
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // if passowrd is modified, then only run below code and encrypt it.
  this.password = bcrypt.hash(this.password, 10); // here 10 is the salt to be used in encryption. If specified as a number then a salt will be generated with the specified number of rounds and used.
  next();
});


// We can create custom methods. '.methods' allows to create custom functions.
// Custom function to ask correct password
userSchema.methods.isPasswordCorrect = async function (password) { 
    return await bcrypt.compare(password,this.password)
    // bcrypt.compare(new password in string, current encrypted password) // It will return true or false.
}


// Function to generate access token
userSchema.methods.generateAccessToken = function () {
    jwt.sign( // '.sign' method generates the token
        {
            _id:this._id, // '_id' is already saved in the db and it does have everyone's access. thats why we need to generate one.
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Function to generate refresh token
userSchema.methods.generateRefreshToken = function () {
    jwt.sign( // '.sign' method generates the token
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);

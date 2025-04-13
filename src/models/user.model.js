import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    branch: {
      type: String,
      required: true,
      enum: ["CSE", "IT", "ECE", "EE", "ME", "CE"],
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Token generation methods have been moved to the centralized tokenManager.js utility

const User = mongoose.model("User", userSchema);
export default User;

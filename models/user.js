import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const passwordValidator = [
  {
    validator: (value) => {
      // Password must be at least 8 characters
      return /^(.{8,})$/.test(value);
    },
    message: "Password must be at least 8 characters",
  },
  {
    validator: (value) => {
      // Password must contain at least one special character
      return /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])/.test(value);
    },
    message: "Password must contain at least one special character",
  },
  {
    validator: (value) => {
      // Password must contain at least one lowercase letter
      return /^(?=.*[a-z])/.test(value);
    },
    message: "Password must contain at least one lowercase letter",
  },
  {
    validator: (value) => {
      // Password must contain at least one digit
      return /^(?=.*\d)/.test(value);
    },
    message: "Password must contain at least one digit",
  },
];

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Name"],
  },

  email: {
    type: String,
    required: [true, "Please Enter Email"],
    unique: [true, "Email Already Exists"],
    validate: validator.isEmail,
  },
password: {
  type: String,
  required: [true, "Please Enter Password"],
  validate: passwordValidator,
  select: false,
},

  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  avatar: {
    public_id: String,
    url: String,
  },

  otp: Number,
  otp_expire: Date,
});

schema.pre("save", async function (next) {
  if(!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10);
});

schema.methods.comparePassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

schema.methods.generateToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

export const User = mongoose.model("User", schema);

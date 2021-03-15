const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

// Create user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    images: {
      type: Array,
      default: [
        {
          url: "https://via.placeholder.com/200.png?text=profile",
          public_id: Date.now,
        },
      ],
    },
    about: {
      type: String,
    },
  },
  { timestamps: true }
);

// Export user model
module.exports = mongoose.model("User", userSchema);

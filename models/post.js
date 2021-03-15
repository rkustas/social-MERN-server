const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: "Content is required",
      text: true,
    },
    image: {
      url: {
        type: String,
        default: "https://via.placeholder.com/200.png?text=profile",
      },
      public_id: {
        type: String,
        default: Date.now,
      },
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    comments: {
      type: Array,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

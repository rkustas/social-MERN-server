// All schemas and types in here

const { authCheck } = require("../helpers/auth");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

// Comment subscriptions
// Subscriptions
const COMMENT_ADDED = "COMMENT_ADDED";
const COMMENT_UPDATED = "COMMENT_UPDATED";
const COMMENT_DELETED = "COMMENT_DELETED";

// Query comments by post
const commentsByPost = async (parent, args, { req }) => {
  // Filter by the page number we receive from the client side or by default 1
  // const currentPage = args.page || 1;
  // const perPage = 5;
  // Find post
  const currentPost = await Post.findById({ _id: args.postId }).exec();

  // Find all comments associated with post
  const commentsbyPost = await Comment.find({ post: currentPost })
    // .skip((currentPage - 1) * perPage)
    .populate("postedBy", "_id username email images")
    .populate({
      path: "post",
      model: "Post",
      populate: { path: "postedBy", model: "User" },
    })
    // .limit(perPage)
    .sort({ createdAt: -1 })
    .exec();

  return commentsbyPost;
};

// Total comment count by post
const totalCommentsPerPost = async (parent, args, { req }) => {
  // Find the post first
  const currentPost = await Post.findById({ _id: args.postId }).exec();

  // Find the number of documents in the comments by that post
  return await Comment.countDocuments({ post: currentPost }).exec();
};

// Query for allComments
const allComments = async (parent, args, { req }) => {
  // Query for all comments
  return await Comment.find({})
    .populate("postedBy", "username _id email images")
    .populate({
      path: "post",
      model: "Post",
      populate: { path: "postedBy", model: "User" },
    })
    .sort({ createdAt: -1 })
    .exec();
};

// Mutation create
const commentCreate = async (parent, args, { req, pubsub }) => {
  // Create a new post, make sure user is associated
  const currentUser = await authCheck(req);

  // If we don't get content need to let the user know content is required
  if (args.input.comment.trim() === "") throw new Error("Comment is required!");

  // Find more user information
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  });

  if (!currentUserFromDb) {
    throw new Error("Please login to comment!");
  }

  //   Find current post
  const postToAddComment = await Post.findById({ _id: args.postId })
    .populate("postedBy", "_id username")
    .exec();

  let newComment = await new Comment({
    ...args.input,
    post: postToAddComment._id,
    postedBy: currentUserFromDb._id,
  })
    .populate("postedBy", "_id username email images")
    .save()
    .then((comment) =>
      comment
        //   Nested populate starting from comment running down to post and then user
        .populate({
          path: "post",
          model: "Post",
          populate: { path: "postedBy", model: "User" },
        })
        .execPopulate()
    );

  // subscription to commentAdded subscription typedefs
  pubsub.publish(COMMENT_ADDED, { commentAdded: newComment });

  return newComment;
};

// Update comment mutation
const commentUpdate = async (parent, args, { req, pubsub }) => {
  // Create a new post, make sure user is associated
  const currentUser = await authCheck(req);

  // If we don't get content need to let the user know content is required
  if (args.input.comment.trim() === "") throw new Error("Comment is required!");

  // Find more user information
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  });

  if (!currentUserFromDb) {
    throw new Error("Please login to comment!");
  }

  // _id of comment to update
  const commentToUpdate = await Comment.findById({
    _id: args.input._id,
  }).exec();

  // if currentuser id and id of post postedBy user id is equal then allow update
  if (
    currentUserFromDb._id.toString() !== commentToUpdate.postedBy._id.toString()
  )
    throw new Error("Unauthorized action"); // Incorrect user

  // Update comment
  let updatedComment = await Comment.findByIdAndUpdate(
    { _id: args.input._id },
    {
      ...args.input,
    },
    { new: true }
  )
    .populate("postedBy", "_id username email images")
    .exec()
    .then((comment) =>
      comment
        //   Nested populate starting from comment running down to post and then user
        .populate({
          path: "post",
          model: "Post",
          populate: { path: "postedBy", model: "User" },
        })
        .execPopulate()
    );

  // subscription to commentUpdated subscription typedefs
  pubsub.publish(COMMENT_UPDATED, { commentUpdated: updatedComment });

  return updatedComment;
};

// Delete comment
const commentDelete = async (parent, args, { req, pubsub }) => {
  // Authorized user
  const currentUser = await authCheck(req);
  // find user _id by email in mongodb
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  // _id of comment to update
  const commentToDelete = await Comment.findById({
    _id: args.commentId,
  }).exec();

  // if currentuser id and id of post postedBy user id is equal then allow update
  if (
    currentUserFromDb._id.toString() !== commentToDelete.postedBy._id.toString()
  )
    throw new Error("Unauthorized action"); // Incorrect user

  // Return deleted post
  let deletedComment = await Comment.findByIdAndDelete({ _id: args.commentId })
    .populate("postedBy", "_id username email images")
    .exec()
    .then((comment) =>
      comment
        //   Nested populate starting from comment running down to post and then user
        .populate({
          path: "post",
          model: "Post",
          populate: { path: "postedBy", model: "User" },
        })
        .execPopulate()
    );

  // subscription to commentDeleted subscription typedefs
  pubsub.publish(COMMENT_DELETED, { commentDeleted: deletedComment });

  return deletedComment;
};

module.exports = {
  Query: {
    commentsByPost,
    allComments,
    totalCommentsPerPost,
  },
  Mutation: {
    commentCreate,
    commentUpdate,
    commentDelete,
  },
  Subscription: {
    commentAdded: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([COMMENT_ADDED]),
    },
    commentUpdated: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([COMMENT_UPDATED]),
    },
    commentDeleted: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([COMMENT_DELETED]),
    },
  },
};

// All schemas and types in here

const { gql } = require("apollo-server-express");
const { authCheck } = require("../helpers/auth");
const { DateTimeResolver } = require("graphql-scalars");
const Post = require("../models/post");
const User = require("../models/user");

// import posts array
const { posts } = require("../temp");

// Subscriptions
const POST_ADDED = "POST_ADDED";
const POST_UPDATED = "POST_UPDATED";
const POST_DELETED = "POST_DELETED";

// queries
const allPosts = async (parent, args) => {
  // Filter by the page number we receive from the client side or by default 1
  const currentPage = args.page || 1;
  const perPage = 6;

  // Display all posts
  return await Post.find({})
    // Click on 5, showing posts from 40-50 instead of posts from 50-60
    .skip((currentPage - 1) * perPage)
    .populate("postedBy", "username _id")
    .limit(perPage)
    .sort({ createdAt: -1 })
    .exec();
};

const postsByUser = async (parent, args, { req }) => {
  // Return all posts for logged in user
  const currentUser = await authCheck(req);

  // Query db for users id
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  return await Post.find({ postedBy: currentUserFromDb })
    .populate("postedBy", "_id username")
    .sort({ createdAt: -1 });
};

const singlePost = async (parent, args) => {
  return await Post.findById({ _id: args.postId })
    .populate("postedBy", "_id username")
    .exec();
};

const totalPosts = async (parent, args) => {
  // return total number of posts
  return await Post.find({}).estimatedDocumentCount().exec();
};

const search = async (parent, { query }) => {
  // Query database using text
  return await Post.find({ content: { $regex: query } })
    .populate("postedBy", "username")
    .exec();
};

// mutation function
const postCreate = async (parent, args, { req, pubsub }) => {
  // Create a new post, make sure user is associated
  const currentUser = await authCheck(req);
  // If we don't get content need to let the user know content is required
  if (args.input.content.trim() === "") throw new Error("Content is required!");
  // Find more user information
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  });
  // Create new post
  let newPost = await new Post({
    ...args.input,
    postedBy: currentUserFromDb._id,
  })
    // save in mongo
    .save()
    // Want to fetch more information than just a user's id
    .then((post) => post.populate("postedBy", "_id username").execPopulate());

  // subscription to postAdded subscription typedefs
  pubsub.publish(POST_ADDED, { postAdded: newPost });

  return newPost;
};

const postUpdate = async (parent, args, { req, pubsub }) => {
  // Authorized user
  const currentUser = await authCheck(req);
  // If we don't get content need to let the user know content is required
  if (args.input.content.trim() === "") throw new Error("Content is required!");
  // find user _id by email in mongodb
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();
  // _id of post to update
  const postToUpdate = await Post.findById({ _id: args.input._id }).exec();
  // if currentuser id and id of post postedBy user id is equal then allow update
  if (currentUserFromDb._id.toString() !== postToUpdate.postedBy._id.toString())
    throw new Error("Unauthorized action"); // Incorrect user
  let updatedPost = await Post.findByIdAndUpdate(
    { _id: args.input._id },
    { ...args.input },
    { new: true }
  )
    .exec()
    .then((post) => post.populate("postedBy", "_id username").execPopulate()); //update the post

  pubsub.publish(POST_UPDATED, { postUpdated: updatedPost });
  return updatedPost;
};

const postDelete = async (parent, args, { req, pubsub }) => {
  // Authorized user
  const currentUser = await authCheck(req);
  // find user _id by email in mongodb
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();
  // _id of post to update
  const postToDelete = await Post.findById({ _id: args.postId }).exec();
  // if currentuser id and id of post postedBy user id is equal then allow update
  if (currentUserFromDb._id.toString() !== postToDelete.postedBy._id.toString())
    throw new Error("Unauthorized action"); // Incorrect user
  // Return deleted post
  let deletedPost = await Post.findByIdAndDelete({ _id: args.postId })
    .exec()
    .then((post) => post.populate("postedBy", "_id username").execPopulate());

  pubsub.publish(POST_DELETED, { postDeleted: deletedPost });

  return deletedPost;
};

// Resolvers return data
module.exports = {
  Query: {
    allPosts,
    postsByUser,
    singlePost,
    totalPosts,
    search,
  },
  Mutation: {
    postCreate,
    postUpdate,
    postDelete,
  },
  Subscription: {
    postAdded: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([POST_ADDED]),
    },
    postUpdated: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([POST_UPDATED]),
    },
    postDeleted: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator([POST_DELETED]),
    },
  },
};

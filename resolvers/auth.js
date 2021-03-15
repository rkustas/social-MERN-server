// All schemas and types in here

const { gql } = require("apollo-server-express");
const shortid = require("shortid");
const { authCheck } = require("../helpers/auth");
const User = require("../models/user");
const { DateTimeResolver } = require("graphql-scalars");

const profile = async (parent, args, { req }) => {
  // Middleware applied before return statement, so data will not return if unauthorized, must await the token before auth check
  const currentUser = await authCheck(req);

  // Find user from db
  return await User.findOne({ email: currentUser.email }).exec();
};

const publicProfile = async (parent, args, { req }) => {
  // Gives public profile for a user
  return await User.findOne({ username: args.username }).exec();
};

const allUsers = async (parent, args, { req }) => {
  // Query for all users
  return await User.find({}).exec();
};

const userCreate = async (parent, args, { req }) => {
  // Find user in database based on email
  const currentUser = await authCheck(req);
  const user = await User.findOne({ email: currentUser.email });
  // Return user if they exist, otherwise create a new user
  console.log(user);
  return user
    ? user
    : new User({
        email: currentUser.email,
        username: shortid.generate(),
      }).save();
};

const userUpdate = async (parent, args, { req }) => {
  // Make sure we have the logged in user
  const currentUser = await authCheck(req);

  console.log(args);

  // Update the user
  const updatedUser = await User.findOneAndUpdate(
    { email: currentUser.email },
    { ...args.input },
    { new: true }
  ).exec();

  return updatedUser;
};

// Resolvers return data
module.exports = {
  Query: {
    profile,
    publicProfile,
    allUsers,
  },
  Mutation: {
    userCreate,
    userUpdate,
  },
};

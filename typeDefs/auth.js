// All schemas and types in here

const { gql } = require("apollo-server-express");

// Export query and mutation types
module.exports = gql`
  scalar DateTime
  type Query {
    me: String!
  }
  type UserCreateResponse {
    username: String!
    email: String!
  }
  type Image {
    url: String
    public_id: String
  }
  type User {
    _id: ID!
    username: String
    name: String
    email: String
    images: [Image]
    about: String
    createdAt: DateTime
    updatedAt: DateTime
  }
  input ImageInput {
    url: String
    public_id: String
  }
  input UserUpdateInput {
    username: String
    name: String
    email: String
    images: [ImageInput]
    about: String
  }
  type Query {
    profile: User!
    publicProfile(username: String!): User!
    allUsers: [User!]
  }
  type Mutation {
    userCreate: UserCreateResponse!
    userUpdate(input: UserUpdateInput): User!
  }
`;

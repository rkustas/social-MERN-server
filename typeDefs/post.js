// All schemas and types in here

const { gql } = require("apollo-server-express");

// Export query types
module.exports = gql`
  scalar DateTime
  type Post {
    _id: ID!
    content: String!
    image: Image
    postedBy: User
    createdAt: DateTime
    updatedAt: DateTime
  }

  input PostCreateInput {
    content: String!
    image: ImageInput
  }

  input PostUpdateInput {
    _id: String!
    content: String!
    image: ImageInput
  }

  type Query {
    totalPosts: Int!
    allPosts(page: Int): [Post!]!
    postsByUser: [Post!]!
    singlePost(postId: String!): Post!
    search(query: String!): [Post]
  }

  type Mutation {
    postCreate(input: PostCreateInput!): Post!
    postUpdate(input: PostUpdateInput!): Post!
    postDelete(postId: String!): Post!
  }

  type Subscription {
    postAdded: Post
    postUpdated: Post
    postDeleted: Post
  }
`;

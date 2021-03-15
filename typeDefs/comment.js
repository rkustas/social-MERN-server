const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar DateTime
  type Comment {
    _id: ID!
    comment: String!
    post: Post
    createdAt: DateTime
    updatedAt: DateTime
    postedBy: User
  }
  input CommentCreateInput {
    comment: String!
  }
  input CommentUpdateInput {
    _id: String!
    comment: String!
  }
  type Query {
    totalCommentsPerPost(postId: String!): Int!
    commentsByPost(postId: String!): [Comment!]!
    allComments: [Comment!]!
  }
  type Mutation {
    commentCreate(postId: String!, input: CommentCreateInput!): Comment!
    commentUpdate(input: CommentUpdateInput!): Comment!
    commentDelete(commentId: String!): Comment!
  }
  type Subscription {
    commentAdded: Comment
    commentUpdated: Comment
    commentDeleted: Comment
  }
`;

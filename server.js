// Bring in express
const express = require("express");
// Pub sub is publish and subscribe for real time subscription updates
const { ApolloServer, PubSub } = require("apollo-server-express");

// Gives us avility to create server
const http = require("http");

// Bring in path so we can load a path
const path = require("path");

// Mongoose for easy connection to mongo atlas
const mongoose = require("mongoose");

// Allows us to use environment variables
require("dotenv").config();

// Import auth check middleware
const { authCheckMiddleWare } = require("./helpers/auth");

// Create express server request response handler
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary");

// New instance of pubsub
const pubsub = new PubSub();

// Connect to mongo db atlas
const db = async () => {
  try {
    const success = await mongoose.connect(process.env.DATABASE_CLOUD, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log("DB Connected");
  } catch (error) {
    console.log("DB Connection", error);
  }
};

// execute DB connection
db();

// Cors and bodyparser
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

// imports
const { makeExecutableSchema } = require("graphql-tools");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");

// usage, taking type definitions and resolvers from different folders and using them in app
const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "./typeDefs"))
);
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "./resolvers"))
);

// graphql server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  // Have access to request and response in resolvers
  context: ({ req }) => ({ req, pubsub }),
});

// Apply express app as middleware to apollo server, connects ApolloServer to http framework such as Express
apolloServer.applyMiddleware({
  app,
});

// utilize http server
const httpserver = http.createServer(app);
// Handle subscriptions in real time
apolloServer.installSubscriptionHandlers(httpserver);

// Endpoint with callback function and middleware to yield a response
app.get("/rest", authCheckMiddleWare, function (req, res) {
  res.json({
    data: "hit rest endpoint great!",
  });
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload method
app.post("/uploadimages", authCheckMiddleWare, (req, res) => {
  cloudinary.uploader.upload(
    req.body.image,
    (result) => {
      console.log(result);
      //upload image and send result to client
      res.send({
        url: result.secure_url,
        public_id: result.public_id,
      });
    },
    {
      // public name and resource type
      public_id: `${Date.now()}`, // use as public name
      resource_type: "auto", // jpeg and png
    }
  );
});

// remove image
app.post("/removeimage", authCheckMiddleWare, (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error });
    res.send(ok);
  });
});

// port, both logs will work and now graphql is part of http rest api, once we subscribe change from app.listen to httpserver.listen
httpserver.listen(process.env.PORT, function () {
  console.log(`server is ready at http://localhost:${process.env.PORT}`);
  console.log(
    `graph ql-server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`
  );
  console.log(
    `subscription is ready at http://localhost:${process.env.PORT}${apolloServer.subscriptionsPath}`
  );
});

// FB admin tool used to check for valid token

const admin = require("firebase-admin");

const serviceAccount = require("../config/fbServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Request response and next come from express, for next if no value is passed it will just act like a function
exports.authCheck = async (req) => {
  try {
    // Verify token with fb admin tool
    const currentUser = await admin.auth().verifyIdToken(req.headers.authtoken);
    console.log("CURRENT USER", currentUser);
    // return user to be used in resolver
    return currentUser;
  } catch (error) {
    console.log("AUTH CHECK ERROR", error);
    throw new Error("Invalid or expired token");
  }
  //   // Token coming from request headers
  //   if (!req.headers.authtoken) throw new Error("Unauthorized");

  //   //   If token check for validity of token
  //   const valid = req.headers.authtoken === "secret";

  //   if (!valid) {
  //     throw new Error("Unauthorized");
  //   } else {
  //     next();
  //   }
};

exports.authCheckMiddleWare = (req, res, next) => {
  if (req.headers.authtoken) {
    admin
      .auth()
      .verifyIdToken(req.headers.authtoken)
      .then((result) => {
        next();
      })
      .catch((error) => console.log(error));
  } else {
    res.json({ error: "Unauthorized" });
  }
};

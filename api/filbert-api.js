// ESM - remove after ECMAScript Module support is past Experimental - node v14 ?
require = require("esm")(module /*, options*/);

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const chalk = require("chalk");

const { saneEnvironmentOrExit } = require("./lib/util");

const {
  parseAuthorizationHeader,
  assertLoggedInUser
} = require("./routes/auth");
const { postSignin, postSigninGoogle } = require("./routes/signin");
const { getUser, patchProfile } = require("./routes/user");
const {
  getPosts,
  getPostByCanonical,
  patchPost,
  deletePublishedPost
} = require("./routes/post");
const {
  postDraft,
  getDrafts,
  publishDraft,
  deleteDraftAndContentNodes
} = require("./routes/draft");
const { getImageById, uploadImage, deleteImage } = require("./routes/image");
const { getPostForEdit } = require("./routes/edit");
const { postContentNodes } = require("./routes/content-nodes");

async function main() {
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage, // TODO: store in memory as Buffer - bad idea?
      //dest: './uploads/', // store in filesystem
      limits: {
        // busboy option
        fileSize: 16777216 // 16MB in bytes max size for mysql MEDIUMBLOB
      }
    });

    const app = express();
    app.use(express.json());
    app.use(cors(/* TODO: whitelist *.filbert.xyz in PRODUCTION */));

    /**
     * add logged in user to req object if present
     */
    app.use(parseAuthorizationHeader);

    /**
     * PUBLIC routes - be careful...
     */
    app.post("/signin", postSignin);
    app.post("/signin-google", postSigninGoogle);
    // username is taken - add ?forSignup
    app.get("/user/:username", getUser);
    app.get("/post", getPosts);
    app.get("/post/:canonical", getPostByCanonical);
    app.get("/image/:id", getImageById);

    /**
     * SIGNED-IN routes - all routes defined after this middleware require a logged in user
     */
    app.use(assertLoggedInUser);

    app.patch("/profile", patchProfile);
    app.post("/post", postDraft);
    app.patch("/post/:id", patchPost);
    app.delete("/post/:id", deletePublishedPost);
    app.get("/edit/:id", getPostForEdit);
    app.post("/content", postContentNodes);
    app.post("/image", upload.single("fileData"), uploadImage);
    app.delete("/image/:id", deleteImage);
    app.get("/draft", getDrafts);
    app.post("/publish/:id", publishDraft);
    app.delete("/draft/:id", deleteDraftAndContentNodes);

    // STARTUP
    app.listen(3001);
    console.info(chalk.green("Filbert API Started 👍"));
  } catch (err) {
    console.error("main() error: ", err);
  }
}

saneEnvironmentOrExit([
  "MYSQL_ROOT_PASSWORD",
  "ENCRYPTION_KEY",
  "GOOGLE_API_FILBERT_CLIENT_ID",
  "LINODE_OBJECT_STORAGE_ACCESS_KEY",
  "LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY"
]);

// from figlet
const welcomeMessage = `
   __ _ _ _               _
  / _(_) | |__   ___ _ __| |_
 | |_| | | '_ \\ / _ \\ '__| __|
 |  _| | | |_) |  __/ |  | |_
 |_| |_|_|_.__/ \\___|_|   \\__|\n\n`;
console.info(chalk.cyan(welcomeMessage));
main();

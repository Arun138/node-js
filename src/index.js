/* // require('dotenv').config({path:'./env'}) 
 we r supposed to use 'dotenv' package asap. We can't import it directly, but using 'require' breaks the consistency of the code. We can indirecty import it as a experimental feature. We need to change the 'script' in package.json file. 

  "scripts": {
    "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js" 
  }

 Previously it was :  "dev": "nodemon src/index.js"

 */

import dotenv from "dotenv"; // Need to be configured
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({ path: "./env" }); // dotenv configured

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port : ${port}`);
    });
    app.on("error", (error) => {
      console.log("(Custom error) ERROR: ", error);
      throw error;
    });
  })
  .catch((err) => {
    console.log("(Custom error) MONGODB database connection failed !!!", err);
  });

/*
// Connect to db in index file. But it can be done in separate file for db

import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); // Connects to db
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening in the port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
})();
*/

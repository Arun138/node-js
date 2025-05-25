import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  // asyncHandler is a higer order function. We are sending a function as a parameter.
  res.status(200).json({ message: "ok" });
});

export {registerUser}
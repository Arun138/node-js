// We will be using the db again and again while checking for error and using async again and again. This acts as a wrapper. Instead of that we create a utility function which will do that.

/*

const asyncHandler = (fn) => {} 
It will be a higher order function, means it can take a function as a parameter or can return a function. But we can't execute it in {}, bcz {} is a callback. So we need to do put the higer order.

const asyncHandler = (fn) => () => {} 

Step by step:
const asyncHandler = () => {} 
const asyncHandler = (fn) => {} // Now, if we want to pass another function, see next line.
const asyncHandler = (fn) => {() => {}} 
const asyncHandler = (fn) => () => {} // Just curly braces are removed. 
const asyncHandler = (fn) => async () => {}  
    
*/


// 1st way: With Promise

const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).
    catch((err) => next(err));
  };
};

/*

// 2nd way: With try-catch
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

*/

export { asyncHandler };

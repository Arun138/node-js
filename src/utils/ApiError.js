// Node js has an error class . so if required we can inherit the classes and control the errors.


class ApiError extends Error {
    constructor(
        statusCode, // These are the parameters the constructor is taking
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        // overriding
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors =  errors

        if (stack) {
            this.stack = stack  
        } else {
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}
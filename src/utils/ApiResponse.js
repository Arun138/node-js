// We will send all the responses through this class

class ApiResponse {
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400 // For Informational (100-199) , Successful (200 - 299) responses and Redirection messages (300 - 399) 
    }
}

export {ApiResponse}
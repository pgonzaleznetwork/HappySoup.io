class ErrorHandler extends Error{
    constructor(statusCode,message,detail){
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.detail = detail;
    }
}

function handleError(err,res){
    
    const {statusCode,message,stack} = err;

    //this specific error needs to be handled here
    //because the oauth page does not have a javascript file, it's just a route
    if(message === 'oauth-failed'){
        res.redirect('/?oauthfailed=true');
    }

    res.status(statusCode).json({
        error:true,
        statusCode,
        message,
        stack

    });
}

module.exports = {
    ErrorHandler,handleError
}
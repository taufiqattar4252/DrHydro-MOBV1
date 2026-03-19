export const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    // Mongoose Duplicate Key Error
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        
        // Capitalize the field name for a better message
        const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
        message = `${capitalizedField} already exists`;
    }
    // Mongoose Cast Error (Invalid ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found. Invalid ${err.path}`;
    }
    // JWT TokenExpiredError
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }
    // JWT JsonWebTokenError
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }
    // Other known errors that might pass a status code
    else if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
    } 
    // Fallback: Use the error message if it's available and not a generic error object
    else if (err.message) {
        message = err.message;
    }

    // Log the error for internal debugging
    console.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`);

    res.status(statusCode).json({
        success: false,
        message
    });
};

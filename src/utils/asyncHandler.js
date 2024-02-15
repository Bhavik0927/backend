// for better underStanding get an help of chatGPT
const asyncHandler = (requestHandler) =>{
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export {asyncHandler}



/* const asyncHandler = () => {}
const asyncHandler = (fn) => () =>{}
const asyncHandler = (fn) => { () => {} }  //Higher order function */

//Try catch method 
/* const asyncHandler = (fn) => async (req,res,next) => {
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
} */

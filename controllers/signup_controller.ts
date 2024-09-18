import express ,{Request, Response, NextFunction} from 'express';
import passport from 'passport';
import {body, validationResult} from 'express-validator';
import Author from '../models/author';

const validateSignup = [
    body('username', 'Username must note be empty')
    .trim()
    .isLength({min:1})
    .escape()
    .custom(async (username: string) =>{
        try{
        if(!/^[a-zA-Z0-9-]+$/.test(username)){
            throw new Error(
                'Username must be alphanumeric and can contain hyphen'
            );
        }
        const alreadyExistingUsername = await Author.findOne({
            username:username,
        })

        if(alreadyExistingUsername){
            throw new Error('User name already exists');
        }
    }catch(err){
        throw new Error('Something went wrong when validating username');
    }
}),
    body('password',
        'Password length must be more than 8 and must contain at least one uppercase, one lowercase, one digit and a symbol'
    ).trim()
     .isStrongPassword()
     .escape(),
     body('confirm password', 'Password do not match').custom(
        (value:String, {req}) => value===req.body.password
    ),
];

const handleValidationErrors = ( req:Request, res:Response, next: NextFunction)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array(),
        })
    }
    next();
}

const handleSignup = ( req:Request, res:Response, next:NextFunction) => {
    passport.authenticate('signup', { session: false }, (err, user, info) => {
        if(err){
            return next(err);
        }
        res.json({
            message:'Signed-up successfully , please login to post',
            user:req.user,
        });
    })(req,res,next);
};

const signup = [...validateSignup, handleValidationErrors, handleSignup];

export default signup;
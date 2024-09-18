import {Request, Response, NextFunction , Router} from 'express'
import signup from "../controllers/signup_controller";

export const signupRoute =Router();

signupRoute.post(
    'api/signup',
    (req: Request, res:Response, next: NextFunction) =>{
        if(req.body.signup_secret !== process.env.SIGNUP_SECRET){
            return res.status(401).json({message:'Invalid signup request'});
        }
        next();
    },
    signup
);
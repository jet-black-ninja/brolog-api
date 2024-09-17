import passport from 'passport';
import {Strategy as localStrategy } from "passport-local";
import {Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import Author from "../models/author";

export const initializePassport =() => {
    //use the JWT strategy to authenticate users based on a JWT
    passport.use(
        new JWTstrategy(
            {
                //Verify the JWT using the TOKEN_SECRET_KEY env variable
                secretOrKey:process.env.TOKEN_SECRET_KEY,
                //Extract the JWT from the request's authorization header as bearer token
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            },
            async(token, done)=> {
                try{
                    // If the JWT is valid , return the user
                    return done(null, token.user);
                }catch(error){
                    console.log(error);
                    return done(error);
                }
            }
        )
    );
    //User the login strategy to authenticate users based on username and password
    passport.use(
        'login',
        new localStrategy(async(username, password, done)=> {
            try{
                //Find the user with the provided username
                const user = await Author.findOne({username});
                if(!user){
                    //if user not found , return message
                    return done(null, false, {message:"User not found"});
                }
                //compare provided password with user's stored password 
                const passwordMatches=await bcrypt.compare(password, user.password);
                if(!passwordMatches){
                    //if password doesn't match  return a  message
                    return done(null, false,{message:"Password does not match"});
                }
                //return user and a message
                return done(null, user, {message:"Logged in successfully!"});
            }catch(error){
                console.log(error);
                return done(error);
            }
        })
    );

    passport.use(
        'signup',
        new localStrategy(async (username, password, done)=> {
            try{
                const salt = 10;
                bcrypt.hash(password,salt, async (err, hashedPassword) => {
                    if(err){
                        return done(null, false, {message:"Error processing password"});
                    }
                    //store the hashed password;
                    password =hashedPassword;
                    //create user
                    const user = await Author.create({username, password});
                    //return the user
                    return done(null, user)
                });
            }catch(error){
                console.log(error);
                return done(error);
            }
        })
    );

}
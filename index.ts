import express, {Express, Request, Response, NextFunction} from "express";// the main backend
import * as dotenv from 'dotenv'; // our env variables
import createError from 'http-errors'; // helps create http errors with appropriate status codes
import * as bodyParser from "body-parser"; // middleware helps to handle data sent by client 
import logger from "morgan"; //middleware to log http requests 
import cookieParser from "cookie-parser"; // middleware for parsing http cookies
import path from "path";    
import cors from "cors"; // set api access
import helmet from "helmet" //set of middleware that helps express applications 
import compression from "compression"; //middleware for compressing HTTP responses
import {routes} from "./routes"
import errorMiddleware from "./middleware/error.middleware";
import passport from "passport"; //authentication middleware for node.js
import {initializePassport} from "./configs/passport-config";
import {initializeMongoDB} from "./configs/mongodb";
import { body } from "express-validator"; // check and verify the data coming from the client 


const app = express();
dotenv.config();

initializeMongoDB();
initializePassport();

const corsOptions ={
    origin: function (origin: any, callback:any){
        if(process.env.CORS_ACCESS?.indexOf(origin)!==-1){
            callback(null, true);
        }else {
            callback(new Error("Not Allowed by Cors"))
        }
        
    }
}

// app.use(cors(corsOptions));
app.use(cors());//TODO revert this 
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(compression());

app.use("/",routes);

app.use(function(req:Request, res:Response, next:NextFunction){
    next(createError(404));
})

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
    console.log(`now listening on port ${process.env.PORT}`);
})
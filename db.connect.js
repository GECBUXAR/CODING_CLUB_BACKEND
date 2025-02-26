import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
  });

const connectDB = async()=>{
    try {
        const connectstring = process.env.MONGODB_URI;
        const connectionInstance = await mongoose.connect(connectstring)                
        console.log("MongoDB connect");
    }catch(err){
        console.log("mongodb connection error : ",err);
    }
}
export default connectDB
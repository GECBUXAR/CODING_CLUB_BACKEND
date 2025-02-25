import mongoose from "mongoose";


const connectDB = async()=>{
    try {
        const connectstring = `mongodb+srv://coding:codingClub321@cluster0.24ddk.mongodb.net/coding_club`;
        const connectionInstance = await mongoose.connect(connectstring)                
        console.log("MongoDB connect");
    }catch(err){
        console.log("mongodb connection error : ",err);
    }
}
export default connectDB
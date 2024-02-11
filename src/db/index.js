import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    // mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    // .then(() => console.log("DB ka Connection is Successful"))
    // .catch( (error) => {
    //     console.log("Issue in DB Connection");
    //     console.error("Abc" + error.message);
    //     //iska matlab kya h ?
    //     process.exit(1);
    // } );
    try{
        const connectionInstance = await mongoose.connect
        (`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST:
        ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("MONGODB connection error", error);
        process.exit(1)
    }
}

/*const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser:true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("DB ka Connection is Successful"))
    .catch( (error) => {
        console.log("Issue in DB Connection");
        console.error("Abc" + error.message);
        //iska matlab kya h ?
        process.exit(1);
    } );
}*/ 

export default connectDB
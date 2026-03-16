import mongoose from "mongoose";

const connectDB = async () => {

    try {

        mongoose.set("strictQuery", true);

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });


    } catch (error) {

        console.error(error);
        process.exit(1);

    }

};

export default connectDB;
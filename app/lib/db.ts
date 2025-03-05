import mongoose, { ConnectOptions } from "mongoose";

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable.");
}

// Create a global variable to store the MongoDB connection
declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

// Ensure a single MongoDB connection instance
const connectToDatabase = async () => {
  if (global.mongooseConnection) {
    return global.mongooseConnection;
  }

  global.mongooseConnection = mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions);

  return global.mongooseConnection;
};

export default connectToDatabase;

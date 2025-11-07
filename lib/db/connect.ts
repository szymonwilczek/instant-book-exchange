import mongoose from "mongoose";

import "@/lib/models/User";
import "@/lib/models/Book";
import "@/lib/models/Transaction";
import "@/lib/models/Review";

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = globalThis.mongoose || { conn: null, promise: null };
let cachedConn: typeof mongoose | null = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  if (cachedConn) {
    return cachedConn;
  }

  if (!cachedPromise) {
    const opts = {
      bufferCommands: false,
    };

    cachedPromise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cachedConn = await cachedPromise;
  } catch (e) {
    cachedPromise = null;
    throw e;
  }

  return cachedConn;
}

export default connectToDB;

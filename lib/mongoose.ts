import mongoose from 'mongoose'

let isConnected = false 

export const connectToDB = async () => {
  // Set strict query mode for Mongoose to prevent unknown field queries.
  mongoose.set('strictQuery', true)

  if (!process.env.MONGODB_URI) return console.log('Missing MongoDB URL')

  // If the connection is already established, return without creating a new connection.
  if (isConnected) {
    console.log('MongoDB connection already established')
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)

    isConnected = true
    console.log('MongoDB connected')
  } catch (error) {
    console.log(error)
  }
}
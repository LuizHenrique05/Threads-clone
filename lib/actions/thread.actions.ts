'use server'

import { revalidatePath } from 'next/cache'

import { connectToDB } from '../mongoose'

import User from '../models/user.model'
import Thread from '../models/thread.model'

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string
}

export async function createThread({ text, author, communityId, path }: Params) {
  try {
    connectToDB()

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    })

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    })

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`)
  }
}

export async function fetchThreads(pageNumber = 1, pageSize = 20) {
  connectToDB()

  const skipAmount = (pageNumber - 1) * pageSize

  // Create a query to fetch the threads that have no parent (top-level threads) (a thread that is not a comment/reply).
  const threadsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: 'author', model: User })
    .populate({ path: 'children', populate: {
        path: 'author',
        model: User,
        select: '_id name parentId image'
      }
    });

  // Count the total number of top-level threads (threads) i.e., threads that are not comments.
  const totalthreadsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of threads

  const threads = await threadsQuery.exec()

  const isNext = totalthreadsCount > skipAmount + threads.length

  return { threads, isNext }
}
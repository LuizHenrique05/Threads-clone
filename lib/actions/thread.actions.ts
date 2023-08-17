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
  } catch (err) {
    console.log('Failed to create thread', err)
    throw new Error('Failed to create thread')
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
    })

  // Count the total number of top-level threads (threads) i.e., threads that are not comments.
  const totalthreadsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  })

  const threads = await threadsQuery.exec()

  const isNext = totalthreadsCount > skipAmount + threads.length

  return { threads, isNext }
}

export async function fetchThreadById(threadId: string) {
  connectToDB()

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: 'author',
        model: User,
        select: '_id id name image',
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: '_id id name parentId image', 
          },
          {
            path: 'children',
            model: Thread, 
            populate: {
              path: 'author', 
              model: User,
              select: '_id id name parentId image', 
            },
          },
        ],
      })
      .exec()

    return thread
  } catch (err) {
    console.error('Error while fetching thread:', err)
    throw new Error('Unable to fetch thread')
  }
}

export async function addCommentToThread(threadId: string, commentText: string, userId: string, path: string ) {
  connectToDB()

  try {
    const originalThread = await Thread.findById(threadId)

    if (!originalThread) throw new Error('Thread not found')

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    })

    const savedCommentThread = await commentThread.save()

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id)

    await originalThread.save()

    revalidatePath(path)
  } catch (err) {
    console.error('Error while adding comment:', err)
    throw new Error('Unable to add comment')
  }
}
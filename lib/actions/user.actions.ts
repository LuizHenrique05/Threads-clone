'use server'

import { revalidatePath } from 'next/cache'
import User from '../models/user.model'
import { connectToDB } from '../mongoose'
import Thread from '../models/thread.model'
import { FilterQuery, SortOrder } from 'mongoose'

export async function fetchUser(userId: string) {
    try {
      connectToDB()
  
      return await User.findOne({ id: userId })
    } catch (error: any) {
      throw new Error(`Failed to fetch user: ${error.message}`)
    }
  }

interface Params {
    userId: string,
    name: string,
    username: string,
    bio: string,
    image: string,
    path: string
}

export async function updateUser({userId, name, username, bio, image, path}: Params): Promise<void> {
    connectToDB()

    try {
        await User.findOneAndUpdate({ id: userId }, {
            username: username.toLocaleLowerCase(),
            name,
            bio,
            image,
            onboarded: true
        }, { upsert: true })
    
        if (path === '/profile/edit') revalidatePath(path)
    } catch (err) {
        console.log('Error to update user', err)
        throw new Error('Failed to create/update user')
    }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB()

    const threads = await User.findOne({ id: userId }).populate({
      path: 'threads',
      model: Thread,
      populate: [
        {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: 'name image id',
          },
        },
      ],
    })
    return threads
  } catch (error) {
    console.error('Error fetching user threads:', error)
    throw new Error('Error fetching user threads')
  }
}

export async function fetchUsers({ userId, searchString = '', pageNumber = 1, pageSize = 20, sortBy = 'desc' }: {
  userId: string
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDB()

    const skipAmount = (pageNumber - 1) * pageSize
    const regex = new RegExp(searchString, 'i')

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    }

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== '') {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ]
    }

    const sortOptions = { createdAt: sortBy }

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)

    const users = await usersQuery.exec()

    const isNext = totalUsersCount > skipAmount + users.length

    return { users, isNext }
  } catch (err) {
    console.error('Error fetching users:', err)
    throw new Error('Error fetching users')
  }
}
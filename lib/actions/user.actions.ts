'use server'

import { revalidatePath } from 'next/cache'
import User from '../models/user.model'
import { connectToDB } from '../mongoose'
import Thread from '../models/thread.model';

export async function fetchUser(userId: string) {
    try {
      connectToDB();
  
      return await User.findOne({ id: userId })
    } catch (error: any) {
      throw new Error(`Failed to fetch user: ${error.message}`);
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
    });
    return threads;
  } catch (error) {
    console.error('Error fetching user threads:', error)
    throw new Error('Error fetching user threads')
  }
}
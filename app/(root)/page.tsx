import ThreadCard from "@/components/cards/ThreadCard"
import { fetchThreads } from "@/lib/actions/thread.actions"
import { currentUser } from "@clerk/nextjs"

export default async function Home() {
  const result = await fetchThreads(1, 30)
  const user = await currentUser()

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <div className="mt-9 flex flex-col gap-10">
        {result.threads.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {result.threads.map((thread) => (
              <ThreadCard
                key={thread._id} 
                id={thread._id} 
                userId={user?.id || ''} 
                parentId={thread.parentId} 
                content={thread.text} 
                author={thread.author} 
                community={thread.community} 
                createdAt={thread.createdAt}  
                comments={thread.children}  
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}
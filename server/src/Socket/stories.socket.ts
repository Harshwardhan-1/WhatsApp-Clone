import { Server, Socket } from 'socket.io';
import {
  createStory,
  deleteStory,
  toggleLike,
  viewedBy,
  markAsViewed,
  addReply,
  deleteReply,
  toggleLikeOnReply,
  showAllReplies,
  allStoriesOfParticularUser,
  showAllStories,
  checkMark,
} from '../controllers/stories.controller';

export const stories = (socket: Socket, users: { [key: string]: string }, io: Server) => {
  try {

    socket.on("all_stories", async () => {
      try {
        const data = await showAllStories();
        socket.emit("all_stories_data", data || []);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("create_story", async (data) => {
      try {
        const newStory = await createStory(data);
        io.emit("story_created", newStory);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("delete_story", async (data) => {
      try {
        await deleteStory(data);
        io.emit("story_deleted", { _id: data._id });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("view_story", async (data) => {
      try {
        const updated = await markAsViewed(data);
        socket.emit("story_view_ack", { _id: data._id, senderId: data.senderId });
        const ownerSocketId = users[updated.senderId];
        if (ownerSocketId) {
          io.to(ownerSocketId).emit("story_viewed_update", { _id: data._id, viewerId: data.senderId });
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("get_viewed_by", async (data) => {
      try {
        const viewers = await viewedBy(data);
        socket.emit("viewed_by_data", { _id: data._id, viewers });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    // like / unlike a story
    socket.on("toggle_like_story", async (data) => {
      try {
        const result = await toggleLike(data);
        io.emit("story_like_updated", {
          _id: data._id,
          likes: result.findStory.likes,
          totalLikes: result.totalLikes,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("add_story_reply", async (data) => {
      try {
        const replyBy = await addReply(data);
        io.emit("story_reply_added", { _id: data._id, replyBy });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("delete_story_reply", async (data) => {
      try {
        const replyBy = await deleteReply(data);
        io.emit("story_reply_deleted", { _id: data._id, replyBy });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("toggle_like_reply", async (data) => {
      try {
        const result = await toggleLikeOnReply(data);
        io.emit("story_reply_like_updated", {
          _id: data._id,
          replyId: data.replyId,
          replyBy: result.replyBy,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("get_story_replies", async (data) => {
      try {
        const replyBy = await showAllReplies(data);
        socket.emit("story_replies_data", { _id: data._id, replyBy });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("check_story_mark", async (data) => {
      try {
        const result = await checkMark(data);
        socket.emit("story_mark_data", result);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

    socket.on("get_user_stories", async (data) => {
      try {
        const userStories = await allStoriesOfParticularUser(data);
        socket.emit("user_stories_data", { receiverId: data.receiverId, stories: userStories || [] });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown Error";
        socket.emit("error_msg", error);
      }
    });

  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown Error";
    socket.emit("error_msg", error);
  }
}
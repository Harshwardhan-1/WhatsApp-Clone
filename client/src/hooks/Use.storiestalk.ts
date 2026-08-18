
import { useCallback, useEffect, useState } from "react";
import { socket } from "../utils/socket";

export interface StoryUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface StoryReply {
  _id: string;
  userId: StoryUser | string;
  message: string;
  replyTo: string | null;
  likes: string[];
  createdAt?: string;
}

export interface Story {
  _id: string;
  senderId: string;
  storyLink: string;
  message?: string;
  storyType: "image" | "video";
  createdBy: StoryUser | string;
  likes: string[];
  viewedBy: string[];
  replyBy: StoryReply[];
  createdAt: string;
  expiresAt: string;
}

export const useStoriesTalk = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewedByList, setViewedByList] = useState<StoryUser[]>([]);
  const [replies, setReplies] = useState<StoryReply[]>([]);

  useEffect(() => {
    socket.emit("all_stories");

    socket.on("all_stories_data", (data: Story[]) => {
      setStories(data || []);
    });

    socket.on("story_created", (story: Story) => {
      setStories((prev) => [story, ...prev]);
    });

    socket.on("story_deleted", ({ _id }: { _id: string }) => {
      setStories((prev) => prev.filter((s) => s._id !== _id));
    });

    socket.on(
      "story_like_updated",
      ({ _id, likes }: { _id: string; likes: string[]; totalLikes: number }) => {
        setStories((prev) => prev.map((s) => (s._id === _id ? { ...s, likes } : s)));
      }
    );

    socket.on("viewed_by_data", ({ viewers }: { _id: string; viewers: StoryUser[] }) => {
      setViewedByList(viewers || []);
    });

    socket.on(
      "story_viewed_update",
      ({ _id, viewerId }: { _id: string; viewerId: string }) => {
        setStories((prev) =>
          prev.map((s) =>
            s._id === _id && !s.viewedBy.includes(viewerId)
              ? { ...s, viewedBy: [...s.viewedBy, viewerId] }
              : s
          )
        );
      }
    );

    socket.on(
      "story_reply_added",
      ({ _id, replyBy }: { _id: string; replyBy: StoryReply[] }) => {
        setReplies(replyBy || []);
        setStories((prev) => prev.map((s) => (s._id === _id ? { ...s, replyBy: replyBy || [] } : s)));
      }
    );

    socket.on(
      "story_reply_deleted",
      ({ _id, replyBy }: { _id: string; replyBy: StoryReply[] }) => {
        setReplies(replyBy || []);
        setStories((prev) => prev.map((s) => (s._id === _id ? { ...s, replyBy: replyBy || [] } : s)));
      }
    );

    socket.on(
      "story_reply_like_updated",
      ({ _id, replyBy }: { _id: string; replyBy: StoryReply[] }) => {
        setReplies(replyBy || []);
        setStories((prev) => prev.map((s) => (s._id === _id ? { ...s, replyBy: replyBy || [] } : s)));
      }
    );

    socket.on(
      "story_replies_data",
      ({ replyBy }: { _id: string; replyBy: StoryReply[] }) => {
        setReplies(replyBy || []);
      }
    );

    return () => {
      socket.off("all_stories_data");
      socket.off("story_created");
      socket.off("story_deleted");
      socket.off("story_like_updated");
      socket.off("viewed_by_data");
      socket.off("story_viewed_update");
      socket.off("story_reply_added");
      socket.off("story_reply_deleted");
      socket.off("story_reply_like_updated");
      socket.off("story_replies_data");
    };
  }, []);

  const createStory = useCallback(
    (data: { senderId: string; link: string; message: string; storyType: "image" | "video" }) => {
      socket.emit("create_story", data);
    },
    []
  );

  const deleteStory = useCallback((data: { _id: string; senderId: string }) => {
    socket.emit("delete_story", data);
  }, []);

  const viewStory = useCallback((data: { _id: string; senderId: string }) => {
    socket.emit("view_story", data);
  }, []);

  const fetchViewedBy = useCallback((data: { _id: string; senderId: string }) => {
    socket.emit("get_viewed_by", data);
  }, []);

  const toggleLikeStory = useCallback((data: { _id: string; senderId: string }) => {
    socket.emit("toggle_like_story", data);
  }, []);

  const addReply = useCallback(
    (data: { _id: string; senderId: string; message: string; parentId?: string | null }) => {
      socket.emit("add_story_reply", data);
    },
    []
  );

  const deleteReply = useCallback((data: { _id: string; replyId: string; senderId: string }) => {
    socket.emit("delete_story_reply", data);
  }, []);

  const toggleLikeReply = useCallback(
    (data: { _id: string; replyId: string; senderId: string }) => {
      socket.emit("toggle_like_reply", data);
    },
    []
  );

  const fetchReplies = useCallback((data: { _id: string; senderId: string }) => {
    socket.emit("get_story_replies", data);
  }, []);

  return {
    stories,
    viewedByList,
    replies,
    createStory,
    deleteStory,
    viewStory,
    fetchViewedBy,
    toggleLikeStory,
    addReply,
    deleteReply,
    toggleLikeReply,
    fetchReplies,
  };
};
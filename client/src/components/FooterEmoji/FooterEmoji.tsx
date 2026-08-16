import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { FiSmile } from "react-icons/fi";
import "./FooterEmoji.css";

interface FooterEmojiProps {
  setMsg: React.Dispatch<React.SetStateAction<string>>;
}

export function FooterEmoji({ setMsg }: FooterEmojiProps) {
  const [showEmoji, setShowEmoji] = useState(false);

  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="footerEmoji" ref={emojiRef}>

      <button
        type="button"
        onClick={() => setShowEmoji(prev => !prev)}
      >
        <FiSmile className="footerIcon" />
      </button>

      {showEmoji && (
        <div className="footerEmojiPicker">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMsg(prev => prev + emojiData.emoji);
            }}
          />
        </div>
      )}

    </div>
  );
}
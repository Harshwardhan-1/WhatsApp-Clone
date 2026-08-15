// jo bhi text me URL jaisa dikhta ha (chahe http ho ya na ho), use match karta ha
// example matches: "google.com", "www.google.com", "https://google.com/path", "youtube.com/watch?v=123"
import "./linkify.css";
const urlRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

// check ke liya ki match asli link jaisa ha ya nahi (taki "file.pdf" jaisa text galti se link na ban jaye)
const isProbablyUrl = (str: string) => {
    if (/^https?:\/\//i.test(str)) return true; // already http/https ha toh pakka link ha
    // baaki domain jaisa dikhna chahiye: kam se kam ek dot, aur end me common extension jaisa
    return /\.[a-zA-Z]{2,}(\/|$)/.test(str) && !/\.(pdf|docx?|pptx?|xlsx?|zip|rar|jpg|jpeg|png|gif|mp4|mp3)$/i.test(str);
};

export const renderMessageWithLinks = (text: string) => {
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part && isProbablyUrl(part)) {
            const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
            return (
                <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="chatLink"
                >
                    {part}
                </a>
            );
        }
        return <span key={index}>{part}</span>;
    });
};
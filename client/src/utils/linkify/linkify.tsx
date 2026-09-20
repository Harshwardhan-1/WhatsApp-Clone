import "./linkify.css";
const urlRegex = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

const isProbablyUrl = (str: string) => {
    if (/^https?:\/\//i.test(str)) return true; // already http/https ha toh pakka link ha
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
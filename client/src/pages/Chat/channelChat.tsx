import { useLocation } from "react-router-dom";
import { socket } from "../../utils/socket";
import { useEffect, useState } from "react";
import { CreateChannel } from "../../components/CreateChannel/CreateChannel";
import { env } from "../../configs/env.config";
import "./ChannelChat.css";

interface ChannelListItem {
    _id: string;
    name: string;
    description?: string;
    profilePic?: string;
    category: string;
    followers: string[];
    followersCount?: number; // present on category_data results, absent elsewhere
}

const CATEGORIES = ["sports", "entertainment", "technology", "news", "education", "business", "other"];

function resolveChannelPic(profilePic?: string) {
    return profilePic ? `${env.backendUrl}${profilePic}` : "/default.webp";
}

function getFollowerCount(ch: ChannelListItem): number {
    return typeof ch.followersCount === "number" ? ch.followersCount : (ch.followers?.length ?? 0);
}

function formatFollowers(count: number): string {
    if (count >= 1_000_000) {
        const v = count / 1_000_000;
        return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M followers`;
    }
    if (count >= 1_000) {
        const v = count / 1_000;
        return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k followers`;
    }
    return `${count} follower${count === 1 ? "" : "s"}`;
}

const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
);

export function ChannelChat() {
    
    const location = useLocation();
    const senderId = location.state?.senderId;
    const [activeOption, setActiveOption] = useState<string | null>(null);

    const [myChannels, setMyChannels] = useState<ChannelListItem[]>([]);
    const [randomChannels, setRandomChannels] = useState<ChannelListItem[]>([]);

    const [exploreChannels, setExploreChannels] = useState<ChannelListItem[]>([]);
    // page 1 is always fetched on mount / on category switch, so the *next* page to
    // request starts at 2 — this was the source of the "load more repeats itself" bug.
    const [explorePage, setExplorePage] = useState(2);
    const [selectedCategory, setSelectedCategory] = useState("other");
    const [hasMoreExplore, setHasMoreExplore] = useState(true);

    // find-channels panel state
    const [showFindPanel, setShowFindPanel] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // right-side chat window state
    const [selectedChannel, setSelectedChannel] = useState<ChannelListItem | null>(null);
    const [messageText, setMessageText] = useState("");

    const handleCreated = () => {
        setActiveOption(null);
        socket.emit("all_user_channel", senderId);
    };

    const handleChannel = (data: ChannelListItem[]) => setMyChannels(data);
    const allrandomchannels = (data: ChannelListItem[]) => setRandomChannels(data);

    const handleExploreData = (data: ChannelListItem[]) => {
        if (data.length === 0) {
            setHasMoreExplore(false);
            return;
        }
        setExploreChannels(prev => [...prev, ...data]);
    };

    const handleToggleFollow = (payload: { _id: string; count: number; message: string }) => {
        setRandomChannels(prev => prev.filter(c => c._id !== payload._id));
        setExploreChannels(prev => prev.filter(c => c._id !== payload._id));
        socket.emit("all_user_channel", senderId);
    };

  const [canSend,setCanSend]=useState<boolean>(false);

   const handleCanSend=(msg:string)=>{
    console.log(msg);
    if(msg==="canSend"){
        setCanSend(true);
    }else{
        setCanSend(false);
    }
};


    useEffect(() => {
        socket.emit("random_channels", senderId);
        socket.emit("all_user_channel", senderId);
        socket.emit("category_data", { category: selectedCategory, page: 1, limit: 10, senderId });

        socket.on("channel_created", handleCreated);
        socket.on("all_user_channel", handleChannel);
        socket.on("got_all_random_channels", allrandomchannels);
        socket.on("category_data", handleExploreData);
        socket.on("toggle_follow", handleToggleFollow);
        socket.on("canSendMessage",handleCanSend);

        return () => {
            socket.off("channel_created", handleCreated);
            socket.off("all_user_channel", handleChannel);
            socket.off("got_all_random_channels", allrandomchannels);
            socket.off("category_data", handleExploreData);
            socket.off("toggle_follow", handleToggleFollow);
            socket.off("canSendMessage",handleCanSend);
        };
    }, []);


    
    const handleCreate = () => setActiveOption("create channel");

    const loadMoreExplore = () => {
        socket.emit("category_data", { category: selectedCategory, page: explorePage, limit: 10, senderId });
        setExplorePage(prev => prev + 1);
    };

    const handleCategoryClick = (cat: string) => {
        if (cat === selectedCategory) return;
        setSelectedCategory(cat);
        setExploreChannels([]);
        setHasMoreExplore(true);
        socket.emit("category_data", { category: cat, page: 1, limit: 10, senderId });
        setExplorePage(2); // page 1 just went out above, so next load-more asks for page 2
    };

    const handleFollow = (channelId: string) => {
        socket.emit("toggle_channel_follow", { _id: channelId, senderId });
    };

    const handleHide = (channelId: string) => {
        socket.emit("hide_channel", { _id: channelId, senderId });
        setRandomChannels(prev => prev.filter(c => c._id !== channelId));
        setExploreChannels(prev => prev.filter(c => c._id !== channelId));
    };

    const openFindPanel = () => {
        setShowFindPanel(true);
        setSearchQuery("");
    };
    const closeFindPanel = () => {
        setShowFindPanel(false);
        setSearchQuery("");
    };

    const handleOpenChannel = (ch: ChannelListItem) => {
        setSelectedChannel(ch);
        setMessageText("");
        setCanSend(false); 
        socket.emit("can_send_message", {channelId: ch._id,senderId
    });
    };

    // search only filters what's already loaded for the selected category
    const panelChannels = searchQuery.trim()
        ? exploreChannels.filter(c => c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : exploreChannels;

    const renderMyChannelRow = (ch: ChannelListItem) => (
        <div
            key={ch._id}
            className={`channel-row ${selectedChannel?._id === ch._id ? "channel-row--active" : ""}`}
            onClick={() => handleOpenChannel(ch)}
        >
            <div className="channel-row-avatar">
                <img src={resolveChannelPic(ch.profilePic)} alt={ch.name} />
            </div>
            <div className="channel-row-info">
                <span className="channel-row-name">{ch.name}</span>
            </div>
        </div>
    );

    const renderRow = (ch: ChannelListItem, withActions: boolean) => (
    <div
        key={ch._id}
        className={`channel-row ${selectedChannel?._id === ch._id ? "channel-row--active" : ""}`}
        onClick={() => handleOpenChannel(ch)}
    >
        <div className="channel-row-avatar">
            <img src={resolveChannelPic(ch.profilePic)} alt={ch.name} />
        </div>
        <div className="channel-row-info">
            <span className="channel-row-name">{ch.name}</span>
        </div>
        {withActions && (
            <div className="channel-row-actions">
                <button
                    className="channel-follow-btn"
                    onClick={(e) => { e.stopPropagation(); handleFollow(ch._id); }}
                    type="button"
                >
                    Follow
                </button>
                <button
                    className="channel-hide-btn"
                    onClick={(e) => { e.stopPropagation(); handleHide(ch._id); }}
                    type="button"
                    aria-label="Not interested"
                >
                    ✕
                </button>
            </div>
        )}
    </div>
);

const renderFindRow = (ch: ChannelListItem) => (
    <div
        key={ch._id}
        className={`find-row ${selectedChannel?._id === ch._id ? "find-row--active" : ""}`}
        onClick={() => handleOpenChannel(ch)}
    >
        <div className="find-row-avatar">
            <img src={resolveChannelPic(ch.profilePic)} alt={ch.name} />
        </div>
        <div className="find-row-info">
            <span className="find-row-name">{ch.name}</span>
            <span className="find-row-count">{formatFollowers(getFollowerCount(ch))}</span>
        </div>
        <button
            className="find-follow-btn"
            onClick={(e) => { e.stopPropagation(); handleFollow(ch._id); }}
            type="button"
        >
            Follow
        </button>
    </div>
);

    return (
        <div className="channel-chat-page">
            <div className="channel-list-column">
                {showFindPanel ? (
                    <div className="find-panel">
                        <div className="find-panel-header">
                            <button className="find-icon-btn" onClick={closeFindPanel} type="button" aria-label="Back">
                                <BackIcon />
                            </button>
                            <h2 className="find-panel-title">Find channels</h2>
                            <span className="find-panel-spacer" />
                        </div>

                        <div className="find-search-wrap">
                            <SearchIcon />
                            <input
                                className="find-search-input"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="find-category-scroll">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`channel-category-chip ${selectedCategory === cat ? "channel-category-chip--active" : ""}`}
                                    onClick={() => handleCategoryClick(cat)}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="find-list">
                            {panelChannels.length === 0 && (
                                <p className="channel-empty">
                                    {searchQuery ? "No channels match your search" : "No channels in this category yet"}
                                </p>
                            )}
                            {panelChannels.map(renderFindRow)}
                            {hasMoreExplore && !searchQuery && (
                                <button className="find-load-more" onClick={loadMoreExplore} type="button">
                                    Load more
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="channel-list-header">
                            <h1>Channels</h1>
                            <div className="channel-header-actions">
                                <button className="channel-icon-btn" onClick={openFindPanel} aria-label="Find channels" type="button">
                                    <SearchIcon />
                                </button>
                                <button className="channel-new-btn" onClick={handleCreate} aria-label="New channel" type="button">✎</button>
                            </div>
                        </div>

                        {myChannels.length > 0 && (
                            <div className="channel-section">
                                <p className="channel-section-title">Your channels</p>
                                {myChannels.map(renderMyChannelRow)}
                            </div>
                        )}

                        <div className="channel-section">
                            <p className="channel-section-title">Discover</p>
                            {randomChannels.length === 0 && (
                                <p className="channel-empty">no channels to show right now</p>
                            )}
                            {randomChannels.map((ch) => renderRow(ch, true))}
                        </div>

                        <div className="channel-section">
                            <button className="channel-find-more-btn" onClick={openFindPanel} type="button">
                                Find more channels
                            </button>
                        </div>

                        {activeOption === "create channel" && (
                            <CreateChannel onBack={() => setActiveOption(null)} senderId={senderId} />
                        )}
                    </>
                )}
            </div>



            <div className="channel-window-column">
                {selectedChannel ? (
                    
                    <div className="channel-window">
                        <div className="channel-window-header">
                            <div className="channel-window-avatar">
                                <img src={resolveChannelPic(selectedChannel.profilePic)} alt={selectedChannel.name} />
                            </div>
                            <div className="channel-window-info">
                                <span className="channel-window-name">{selectedChannel.name}</span>
                                <span className="channel-window-followers">
                                    {/* {formatFollowers(getFollowerCount(selectedChannel))} */}
                                </span>
                            </div>
                            <button>Follow</button>
                        </div>

                        <div className="channel-window-messages">
                            {/* messages will render here */}
                        </div>

                <div className="channel-window-input-wrap">

                    <form >
                        <input  disabled={!canSend} type="text" placeholder="Type an Update" 
                        value={messageText} onChange={(e)=>setMessageText(e.target.value)} />
                        <button disabled={!canSend}>Send</button>
                    </form>
                        </div>    
                    </div>
                ) :(
                    <div className="channel-window-empty">
                        <p>Select a channel to view it here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
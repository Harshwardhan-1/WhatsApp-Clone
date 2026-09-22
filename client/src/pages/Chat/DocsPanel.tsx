import { useMemo, useState } from "react";
import { ArrowLeft, Lock, Search } from "lucide-react";
import type { DocsUser } from "../../hooks/use.docs.hooks";

type Perm = "edit" | "view";

interface Props {
    users: DocsUser[];
    creating: boolean;
    onClose: () => void;
    onCreate: (
        docsName: string,
        editIds: string[],
        viewIds: string[]
    ) => void;
}

export function CreateDocsPanel({
    users,
    creating,
    onClose,
    onCreate
}: Props) {
    const [docsName, setDocsName] = useState("");
    const [search, setSearch] = useState("");
    // userId -> "edit" | "view". Jo id yaha nahi hai, us user ko access nahi milega
    const [perm, setPerm] = useState<Record<string, Perm>>({});

    const grouped = useMemo(() => {
        const list = users
            .filter((u) =>
                u.name.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        const map: Record<string, DocsUser[]> = {};

        list.forEach((u) => {
            const letter = u.name[0]?.toUpperCase() || "#";

            if (!map[letter]) {
                map[letter] = [];
            }

            map[letter].push(u);
        });

        return map;
    }, [users, search]);

    // ek user ek hi permission: same button dobara dabao to hat jayega
    const choose = (id: string, p: Perm) => {
        setPerm((prev) => {
            const next = { ...prev };

            if (next[id] === p) {
                delete next[id];
            } else {
                next[id] = p;
            }

            return next;
        });
    };

    const editIds = Object.keys(perm).filter(
        (id) => perm[id] === "edit"
    );

    const viewIds = Object.keys(perm).filter(
        (id) => perm[id] === "view"
    );

    const handleCreate = () => {
        if (creating) return;

        if (!docsName.trim()) {
            alert("Docs name is mandatory");
            return;
        }

        onCreate(
            docsName.trim(),
            editIds,
            viewIds
        );
    };

    return (
        <div className="cd-panel">
            <div className="cd-header">
                <button
                    className="cd-back"
                    onClick={onClose}
                    aria-label="Back"
                >
                    <ArrowLeft size={22} />
                </button>

                <h2>New document</h2>
            </div>

            <div className="cd-name-wrap">
                <input
                    className="cd-name"
                    type="text"
                    placeholder="Document name"
                    value={docsName}
                    onChange={(e) => setDocsName(e.target.value)}
                    maxLength={100}
                    autoFocus
                />
            </div>

            <div className="cd-search-wrap">
                <Search
                    size={16}
                    className="cd-search-icon"
                />

                <input
                    className="cd-search"
                    type="text"
                    placeholder="Search by name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="cd-summary">
                {editIds.length} can edit · {viewIds.length} view only
            </div>

            <div className="cd-list">

                {/* creator: hamesha full access, isliye disabled */}
                <div className="cd-user cd-user--disabled">
                    <div className="cd-avatar cd-avatar--me">
                        You
                    </div>

                    <div className="cd-info">
                        <span className="cd-name-text">
                            You
                        </span>

                        <span className="cd-status">
                            Owner · full access
                        </span>
                    </div>

                    <Lock
                        size={16}
                        className="cd-lock"
                    />
                </div>

                {Object.keys(grouped)
                    .sort()
                    .map((letter) => (
                        <div key={letter}>
                            <div className="cd-letter">
                                {letter}
                            </div>

                            {grouped[letter].map((user) => (
                                <div
                                    key={user._id}
                                    className="cd-user"
                                >
                                    {user.avatar ? (
                                        <img
                                            className="cd-avatar"
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                    ) : (
                                        <div className="cd-avatar">
                                            {user.name[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    <div className="cd-info">
                                        <span className="cd-name-text">
                                            {user.name}
                                        </span>

                                        {user.status && (
                                            <span className="cd-status">
                                                {user.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="cd-perm">
                                        <button
                                            type="button"
                                            className={`cd-pill ${
                                                perm[user._id] === "edit"
                                                    ? "cd-pill--edit"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                choose(
                                                    user._id,
                                                    "edit"
                                                )
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className={`cd-pill ${
                                                perm[user._id] === "view"
                                                    ? "cd-pill--view"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                choose(
                                                    user._id,
                                                    "view"
                                                )
                                            }
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                {users.length > 0 &&
                    Object.keys(grouped).length === 0 && (
                        <div className="cd-empty">
                            No contacts found
                        </div>
                    )}
            </div>

            <div className="cd-footer">
                <button
                    className="cd-create-btn"
                    onClick={handleCreate}
                    disabled={
                        creating ||
                        !docsName.trim()
                    }
                >
                    {creating
                        ? "Creating..."
                        : "Create document"}
                </button>
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { DocsHook } from "../../hooks/use.docs.hooks";
import type { DocsItem } from "../../hooks/use.docs.hooks";
import { CreateDocsPanel } from "./DocsPanel";
import { DocsEditor } from "./DocsEditor";
import { socket } from "../../utils/socket";
import "./Docs.css";

export function Docs() {
    const location = useLocation();
    const navigate = useNavigate();
    const senderId: string = location.state?.senderId;
    const [selectedId, setSelectedId] = useState<string | null>(location.state?.openDocsId ?? null);
    const [showCreate, setShowCreate] = useState(false);
    const [openDocMenuId, setOpenDocMenuId] = useState<string | null>(null);

    const {
        allDocs, docsLoaded, users, creating, createdDocsId,
        clearCreated, createDocs, deleteDocument, renameDocument,
    } = DocsHook(senderId);

    useEffect(() => {
        if (!createdDocsId) return;
        setShowCreate(false);
        setSelectedId(createdDocsId);
        clearCreated();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createdDocsId]);

    useEffect(() => {
        const onDocDeleted = (d: { docsId: string; msg: string }) => {
            if (d.docsId === selectedId) {
                alert(d.msg);
                setSelectedId(null);
            }
        };
        socket.on("docs_deleted", onDocDeleted);
        return () => { socket.off("docs_deleted", onDocDeleted); };
    }, [selectedId]);

    if (!senderId) {
        return <div className="docs-placeholder">User not found. Please go back and open Docs again.</div>;
    }

    const selectedDoc = allDocs.find((d) => d._id === selectedId);

    const roleOf = (d: DocsItem) => {
        if (String(d.creatorId) === String(senderId)) return "Created by you";
        return d.editPermission.map(String).includes(String(senderId)) ? "Can edit" : "View only";
    };

    const handleRename = (d: DocsItem) => {
        setOpenDocMenuId(null);
        const name = window.prompt("Rename document", d.docsName);
        if (name && name.trim() && name.trim() !== d.docsName) {
            renameDocument(d._id, name.trim());
        }
    };

    const handleDelete = (d: DocsItem) => {
        setOpenDocMenuId(null);
        if (window.confirm(`Delete "${d.docsName}"? This can't be undone.`)) {
            deleteDocument(d._id);
        }
    };

    return (
        <div className="docs-page">
            <aside className="docs-sidebar">
                <div className="docs-sidebar-header">
                    <button className="docs-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <h2>Docs</h2>
                    <button className="docs-icon-btn" onClick={() => setShowCreate(true)} aria-label="New document">
                        <Plus size={22} />
                    </button>
                </div>

                <div className="docs-list">
                    {docsLoaded && allDocs.length === 0 && (
                        <div className="docs-empty">No documents yet. Tap + to create one.</div>
                    )}
                    {allDocs.map((d) => {
                        const isCreator = String(d.creatorId) === String(senderId);
                        return (
                            <div
                                key={d._id}
                                className={`docs-item ${d._id === selectedId ? "active" : ""}`}
                                onClick={() => setSelectedId(d._id)}
                            >
                                <div className="docs-item-icon"><FileText size={20} /></div>
                                <div className="docs-item-text">
                                    <div className="docs-item-name">{d.docsName}</div>
                                    <div className="docs-item-meta">{roleOf(d)}</div>
                                </div>

                                {isCreator && (
                                    <div className="docs-item-menu">
                                        <button
                                            className="docs-item-menu-btn"
                                            onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(openDocMenuId === d._id ? null : d._id); }}
                                        >
                                            ⋮
                                        </button>
                                        {openDocMenuId === d._id && (
                                            <div className="docs-item-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                                <div className="docs-item-menu-option" onClick={() => handleRename(d)}>Rename</div>
                                                <div className="docs-item-menu-option docs-item-menu-option--danger" onClick={() => handleDelete(d)}>Delete</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {showCreate && (
                    <CreateDocsPanel
                        users={users}
                        creating={creating}
                        onClose={() => setShowCreate(false)}
                        onCreate={createDocs}
                    />
                )}
            </aside>

            <main className="docs-main">
                {selectedDoc ? (
                    <DocsEditor key={selectedDoc._id} senderId={senderId} doc={selectedDoc} users={users} />
                ) : (
                    <div className="docs-placeholder">
                        {selectedId && !docsLoaded && "Opening document..."}
                        {selectedId && docsLoaded && "Document not found or you don't have access."}
                        {!selectedId && "Select a document or create a new one."}
                    </div>
                )}
            </main>
        </div>
    );
}
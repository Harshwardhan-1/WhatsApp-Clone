import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { Download, FileText, Users } from "lucide-react";
import { DocsRoomHook, LOCAL_ORIGIN, REMOTE_ORIGIN } from "../../hooks/use.docs.hooks";
import type { DocsItem, DocsUser } from "../../hooks/use.docs.hooks";
import { DocsChatPanel } from "../../components/DocsChatPanel/DocsChatPanel";

interface Props {
    senderId: string;
    doc: DocsItem;
    users: DocsUser[];
}

type DeltaOp = { insert?: unknown; delete?: number; retain?: number };

// Dusre ka change aane par mera cursor apni jagah rahe, isliye position shift karte hain
const shiftPos = (pos: number, delta: DeltaOp[]) => {
    let index = 0;
    for (const op of delta) {
        if (op.retain !== undefined) {
            index += op.retain;
        } else if (op.insert !== undefined) {
            const len = typeof op.insert === "string" ? op.insert.length : 1;
            if (index <= pos) pos += len;
            index += len;
        } else if (op.delete !== undefined) {
            if (pos > index) pos = Math.max(index, pos - op.delete);
        }
    }
    return pos;
};

const isHigh = (c: number) => c >= 0xd800 && c <= 0xdbff;
const isLow = (c: number) => c >= 0xdc00 && c <= 0xdfff;

export function DocsEditor({ senderId, doc, users }: Props) {
    const {
        ydoc, ready, canEdit, online, downloads, requested,
        editRequests, isCreator, requestEdit, approveEdit, notifyDownload,
    } = DocsRoomHook(senderId, doc);

    const taRef = useRef<HTMLTextAreaElement>(null);
    const [showRequests, setShowRequests] = useState(false);
    const ytext = ydoc.getText("content");

    // NAYA — docs chat panel me message-sender ka naam dikhane ke liye
    const getMemberName = (id: string) => users.find((u) => u._id === id)?.name || "Unknown";

    // Y.Text  ->  textarea (sirf dusre ke changes)
    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.value = ytext.toString();

        const observer = (event: Y.YTextEvent, tr: Y.Transaction) => {
            if (tr.origin !== REMOTE_ORIGIN) return; // apna type kiya hua dobara set nahi karna
            const start = shiftPos(ta.selectionStart, event.delta as DeltaOp[]);
            const end = shiftPos(ta.selectionEnd, event.delta as DeltaOp[]);
            ta.value = ytext.toString();
            if (document.activeElement === ta) ta.setSelectionRange(start, end);
        };

        ytext.observe(observer);
        return () => ytext.unobserve(observer);
    }, [ytext]);

    // textarea  ->  Y.Text (sirf jitna badla utna hi bhejte hain)
    const handleChange = () => {
        const ta = taRef.current;
        if (!ta || !canEdit) return;

        const prev = ytext.toString();
        const next = ta.value;
        if (prev === next) return;

        let s = 0;
        const min = Math.min(prev.length, next.length);
        while (s < min && prev[s] === next[s]) s++;

        let pe = prev.length;
        let ne = next.length;
        while (pe > s && ne > s && prev[pe - 1] === next[ne - 1]) {
            pe--;
            ne--;
        }

        // emoji (surrogate pair) beech se na toote
        if (s > 0 && isHigh(prev.charCodeAt(s - 1))) s--;
        if (pe < prev.length && isLow(prev.charCodeAt(pe))) {
            pe++;
            ne++;
        }

        ydoc.transact(() => {
            if (pe > s) ytext.delete(s, pe - s);
            if (ne > s) ytext.insert(s, next.slice(s, ne));
        }, LOCAL_ORIGIN);
    };

    const handleDownload = () => {
        const blob = new Blob([ytext.toString()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.docsName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        notifyDownload();
    };

    const roleText = isCreator ? "You own this document" : canEdit ? "You can edit" : "View only";

    return (
        <div className="de">
            <div className="de-header">
                <div className="de-icon"><FileText size={20} /></div>
                <div className="de-title">
                    <h3>{doc.docsName}</h3>
                    <span>{ready ? roleText : "Loading..."}</span>
                </div>

                <div className="de-actions">
                    <span className="de-online" title="People in this document">
                        <Users size={16} /> {online}
                    </span>

                    <button className="de-btn" onClick={handleDownload} disabled={!ready} title="Download as .txt">
                        <Download size={16} /> {downloads}
                    </button>

                    {isCreator && (
                        <button className="de-btn" onClick={() => setShowRequests((v) => !v)}>
                            Edit requests ({editRequests.length})
                        </button>
                    )}

                    {ready && !canEdit && !requested && (
                        <button className="de-btn de-btn--primary" onClick={requestEdit}>
                            Request edit access
                        </button>
                    )}
                    {ready && !canEdit && requested && <span className="de-note">Request sent</span>}
                </div>

                {isCreator && showRequests && (
                    <div className="de-requests">
                        {editRequests.length === 0 && <div className="de-requests-empty">No pending requests</div>}
                        {editRequests.map((u) => (
                            <div key={u._id} className="de-request-row">
                                {u.avatar ? (
                                    <img className="de-request-avatar" src={u.avatar} alt={u.name} />
                                ) : (
                                    <div className="de-request-avatar">{u.name?.[0]?.toUpperCase()}</div>
                                )}
                                <span className="de-request-name">{u.name}</span>
                                <button className="de-btn de-btn--primary" onClick={() => approveEdit(u._id)}>
                                    Allow edit
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="de-body">
                <textarea
                    ref={taRef}
                    className="de-textarea"
                    readOnly={!ready || !canEdit}
                    placeholder={ready ? (canEdit ? "Start typing..." : "This document is empty") : "Loading..."}
                    onChange={handleChange}
                    spellCheck
                />
            </div>

            <DocsChatPanel 
            docsId={doc._id} 
            senderId={senderId} 
            getMemberName={getMemberName} />
        </div>
    );
}
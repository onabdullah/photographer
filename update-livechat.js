#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = '/Users/abdullah/Documents/Shopify Apps/photographer/resources/js/Admin/Pages/LiveChat/Index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const stateInsertPoint = "    const [sending, setSending] = useState(false);";
const newStateVars = `    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);`;
content = content.replace(stateInsertPoint, newStateVars);

const handleSendStart = "    const handleSend = async () => {";
const handleFileUpload = `    const handleFileUpload = async (files) => {
        if (!files?.length || !activeConvId || uploadingFiles) return;
        setUploadingFiles(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                const res = await fetch(\`/admin/live-chat/conversations/\${activeConvId}/upload\`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document?.querySelector('meta[name="csrf-token"]')?.content ?? '',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: formData,
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data?.message ?? \`Error \${res.status}\`);
                }
                const data = await res.json();
                setAttachments((prev) => [...prev, data]);
            }
        } catch (err) {
            toast.error(err.message ?? 'Failed to upload files.');
        } finally {
            setUploadingFiles(false);
        }
    };

    \n    const handleSend = async () => {`;
content = content.replace(handleSendStart, handleFileUpload);

const oldHandleSendBody = "                body: JSON.stringify({ body, is_internal_note: isInternalNote }),";
const newHandleSendBody = "                body: JSON.stringify({ body, is_internal_note: isInternalNote, attachments }),";
content = content.replace(oldHandleSendBody, newHandleSendBody);

const clearDraftAfterSend = "            setDraftBody('');\n            setIsInternalNote(false);";
const clearDraftWithAttachments = "            setDraftBody('');\n            setIsInternalNote(false);\n            setAttachments([]);";
content = content.replace(clearDraftAfterSend, clearDraftWithAttachments);

const handleKeyDownStart = "    const handleKeyDown = (e) => {";
const dropHandlers = `    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileUpload(e.dataTransfer.files);
    };

    \n    const handleKeyDown = (e) => {`;
content = content.replace(handleKeyDownStart, dropHandlers);

const composerDivStart = "                                {canManage && (\\n                                    <div className={`border-t border-gray-200 dark:border-gray-700 px-3 pt-3 pb-3 flex-shrink-0 ${isComposerDisabled ? 'opacity-60 pointer-events-none' : ''}`}>";
content = content.replace(
    /\{\s*canManage\s*&&\s*\(\s*<div\s*className=\{\`border-t border-gray-200[^>]*\}>\s*/m,
    `{canManage && (
                                    <div 
                                        className={\`border-t border-gray-200 dark:border-gray-700 px-3 pt-3 pb-3 flex-shrink-0 \${isComposerDisabled ? 'opacity-60 pointer-events-none' : ''}\`}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        {attachments.length > 0 && (
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                {attachments.map((att, idx) => (
                                                    <div key={idx} className="inline-flex items-center gap-2 border bg-gray-50 border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                                                        <span className="truncate max-w-[100px]">{att.name || att.filename}</span>
                                                        <button
                                                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                                            className="flex-shrink-0 hover:text-red-600 transition-colors"
                                                            type="button"
                                                            aria-label="Remove attachment"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}`
);

content = content.replace(
   /import \{([^}]+?)\}\s+from\s+'lucide-react';/g,
   (match, p1) => {
       if (!p1.includes('X,')) {
           return `import { X, ${p1.trim()} } from 'lucide-react';`;
       }
       return match;
   }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File updated successfully with file upload support!');

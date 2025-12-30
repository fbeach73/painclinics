"use client";

import { useCallback, useEffect } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TiptapToolbar } from "./tiptap-toolbar";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function TiptapEditor({ content, onChange, onImageUpload }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "rounded-lg overflow-hidden",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your blog post...",
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[400px] p-4 prose-img:rounded-lg prose-a:text-primary prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-foreground/90 prose-blockquote:border-primary",
      },
    },
  });

  // Handle image drop
  const handleDrop = useCallback(
    async (event: Event) => {
      if (!editor) return;

      const dragEvent = event as DragEvent;
      const files = dragEvent.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;

      event.preventDefault();

      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error("Failed to upload dropped image:", error);
      }
    },
    [editor, onImageUpload]
  );

  // Handle image paste
  const handlePaste = useCallback(
    async (event: Event) => {
      if (!editor) return;

      const clipboardEvent = event as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const url = await onImageUpload(file);
              editor.chain().focus().setImage({ src: url }).run();
            } catch (error) {
              console.error("Failed to upload pasted image:", error);
            }
          }
          return;
        }

        // Check for YouTube URL paste
        if (item.type === "text/plain") {
          item.getAsString((text) => {
            const youtubeRegex =
              /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = text.match(youtubeRegex);
            if (match) {
              event.preventDefault();
              editor.chain().focus().setYoutubeVideo({ src: text }).run();
            }
          });
        }
      }
    },
    [editor, onImageUpload]
  );

  // Set up event listeners
  useEffect(() => {
    const editorElement = document.querySelector(".ProseMirror");
    if (!editorElement) return;

    editorElement.addEventListener("drop", handleDrop);
    editorElement.addEventListener("paste", handlePaste);

    return () => {
      editorElement.removeEventListener("drop", handleDrop);
      editorElement.removeEventListener("paste", handlePaste);
    };
  }, [handleDrop, handlePaste]);

  // Update content when prop changes (for loading existing posts)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border rounded-md h-[500px] flex items-center justify-center text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-background">
      <TiptapToolbar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}

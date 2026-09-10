"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { useEffect, useRef, useState } from "react";
import "./RichTextEditor.css";

const IMAGE_SIZE_OPTIONS = [
  { value: "", label: "Size" },
  { value: 200, label: "Small (200px)" },
  { value: 400, label: "Medium (400px)" },
  { value: 600, label: "Large (600px)" },
  { value: "full", label: "Full width" },
];

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

// Extend Image to add alignment attribute and ensure it's applied in the resizable node view
const ImageWithAlign = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.() ?? {},
      align: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-align") || null,
        renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
      },
      fullWidth: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-full-width") === "true",
        renderHTML: (attrs) => (attrs.fullWidth ? { "data-full-width": "true" } : {}),
      },
    };
  },

  addNodeView() {
    const parentFn = this.parent?.();
    if (typeof parentFn?.addNodeView !== "function") return null;
    const parentNodeView = parentFn.addNodeView.call(this);
    if (!parentNodeView) return null;

    return (props) => {
      const view = parentNodeView.call(this, props);
      if (!view?.dom) return view;

      const getImg = () => view.dom.querySelector?.("img") ?? (view.dom.tagName === "IMG" ? view.dom : null);

      const applyAlign = (node) => {
        const img = getImg();
        if (img) {
          const a = node?.attrs?.align;
          if (a) img.setAttribute("data-align", a);
          else img.removeAttribute("data-align");
        }
      };

      const applyFullWidth = (node) => {
        const img = getImg();
        if (img) {
          if (node?.attrs?.fullWidth) {
            img.setAttribute("data-full-width", "true");
            img.style.width = "100%";
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.removeAttribute("width");
            img.removeAttribute("height");
          } else {
            img.removeAttribute("data-full-width");
            img.style.width = "";
            img.style.maxWidth = "";
            img.style.height = "";
          }
        }
      };

      applyAlign(props.node);
      applyFullWidth(props.node);

      const img = getImg();
      if (img) {
        img.onerror = () => {
          if (view.dom && view.dom.style) {
            view.dom.style.visibility = "";
            view.dom.style.pointerEvents = "";
          }
        };
      }

      // Helper: get node position (getPos can be undefined after hydration/refresh)
      const getNodePos = () => {
        let pos = typeof props.getPos === "function" ? props.getPos() : undefined;
        if (pos === undefined && props.editor?.view && view.dom) {
          try {
            pos = props.editor.view.posAtDOM(view.dom, 0);
          } catch (_) {}
        }
        return typeof pos === "number" ? pos : null;
      };

      const selectImageNode = () => {
        const pos = getNodePos();
        if (pos !== null && props.editor && !props.editor.isDestroyed) {
          props.editor.chain().setNodeSelection(pos).focus().run();
        }
      };

      // Mousedown (capture): select image when possible; only stop event if we succeeded (so editor-level handler can run for saved content when getPos fails).
      const onMouseDown = (e) => {
        if (e.target.closest?.("[data-resize-handle]")) return;
        const pos = getNodePos();
        if (pos === null || !props.editor || props.editor.isDestroyed) return;
        props.editor.chain().setNodeSelection(pos).focus().run();
        e.preventDefault();
        e.stopPropagation();
      };
      view.dom.addEventListener("mousedown", onMouseDown, true);

      // Click (fallback): defer so it works when content is loaded from saved HTML (getPos may be ready later).
      const selectImageOnClick = (e) => {
        if (e.target.closest?.("[data-resize-handle]")) return;
        setTimeout(() => selectImageNode(), 0);
      };
      view.dom.addEventListener("click", selectImageOnClick);

      const origUpdate = view.update;
      if (typeof origUpdate === "function") {
        view.update = (node, decorations, innerDecorations) => {
          const result = origUpdate(node, decorations, innerDecorations);
          applyAlign(node);
          applyFullWidth(node);
          return result;
        };
      }
      return view;
    };
  },
});

// After inserting an image, select it so the image bubble menu shows.
function selectNewlyInsertedImage(editor) {
  if (!editor) return;
  const { doc } = editor.state;
  let imagePos = null;
  doc.descendants((node, pos) => {
    if (node.type.name === "image") imagePos = pos;
  });
  if (typeof imagePos === "number") {
    editor.chain().setNodeSelection(imagePos).focus().run();
  }
}

// Bubble menu when an image is selected. All changes via editor commands (updateAttributes).
function ImageBubbleMenu({ editor }) {
  const [altFocused, setAltFocused] = useState(false);
  const [localAlt, setLocalAlt] = useState("");
  const attrs = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed?.isActive("image") ? ed.getAttributes("image") : null),
  });
  if (!editor || !attrs) return null;
  const alt = attrs.alt ?? "";
  const width = attrs.width ?? null;
  const align = attrs.align ?? null;
  const fullWidth = attrs.fullWidth ?? false;

  const update = (next) => {
    editor.chain().updateAttributes("image", next).run();
  };

  const altValue = altFocused ? localAlt : alt;
  const onAltFocus = () => {
    setAltFocused(true);
    setLocalAlt(alt);
  };
  const onAltBlur = () => {
    if (localAlt !== alt) update({ alt: localAlt });
    setAltFocused(false);
  };

  return (
    <div className="rich-text-image-bubble">
      <span className="rich-text-image-bubble-label">Image</span>
      <button
        type="button"
        onClick={() => update({ align: "left" })}
        className={align === "left" ? "is-active" : ""}
        title="Align left"
      >
        L
      </button>
      <button
        type="button"
        onClick={() => update({ align: "center" })}
        className={align === "center" ? "is-active" : ""}
        title="Align center"
      >
        C
      </button>
      <button
        type="button"
        onClick={() => update({ align: "right" })}
        className={align === "right" ? "is-active" : ""}
        title="Align right"
      >
        R
      </button>
      <select
        value={fullWidth ? "full" : (width === 200 || width === 400 || width === 600 ? String(width) : "")}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "full") {
            update({ fullWidth: true, width: null, height: null });
          } else {
            update({ fullWidth: false, width: v ? Number(v) : null, height: v ? null : null });
          }
        }}
        className="rich-text-image-bubble-size"
        title="Size"
      >
        {IMAGE_SIZE_OPTIONS.map((o) => (
          <option key={o.value === "" ? "none" : o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Alt text (required for publish)"
        value={altValue}
        onChange={(e) => setLocalAlt(e.target.value)}
        onFocus={onAltFocus}
        onBlur={onAltBlur}
        className="rich-text-image-bubble-alt"
        title="Alt text"
        maxLength={200}
      />
    </div>
  );
}

function Toolbar({ editor, fullScreen, onToggleFullScreen, onImageUploadClick, imageUploading }) {

  // so the input always shows the currently selected image’s alt and each image keeps its own text.
  if (!editor) return null;

  const addImageByUrl = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: "", align: null, width: null, height: null }).run();
    selectNewlyInsertedImage(editor);
  };

  const handleImageClick = () => {
    if (onImageUploadClick) onImageUploadClick();
    else addImageByUrl();
  };

  const setLink = () => {
    const url = window.prompt("URL:", editor.getAttributes("link").href || "");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const clearFormat = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const headingValue = editor.isActive("heading", { level: 1 }) ? 1
    : editor.isActive("heading", { level: 2 }) ? 2
    : editor.isActive("heading", { level: 3 }) ? 3
    : 0;

  return (
    <div className="rich-text-toolbar-wrap">
      <div className="rich-text-toolbar rich-text-toolbar-row">
        <select
          value={headingValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: v }).run();
          }}
          className="rich-text-toolbar-select"
          title="Paragraph / Heading"
        >
          <option value={0}>Paragraph</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
        <span className="rich-text-toolbar-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "is-active" : ""} title="Bold">B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "is-active" : ""} title="Italic">I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "is-active" : ""} title="Strikethrough">S</button>
        <span className="rich-text-toolbar-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "is-active" : ""} title="Bullet list">•</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "is-active" : ""} title="Numbered list">1.</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "is-active" : ""} title="Quote">“</button>
        <span className="rich-text-toolbar-sep" />
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""} title="Align left">L</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""} title="Align center">C</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""} title="Align right">R</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={editor.isActive({ textAlign: "justify" }) ? "is-active" : ""} title="Justify">J</button>
        <span className="rich-text-toolbar-sep" />
        <button type="button" onClick={setLink} className={editor.isActive("link") ? "is-active" : ""} title="Insert link">Link</button>
        <button type="button" onClick={unsetLink} title="Remove link">Unlink</button>
        <button type="button" onClick={handleImageClick} disabled={imageUploading} title={onImageUploadClick ? "Upload image" : "Insert image URL"}>
          Img
          {imageUploading && <span className="rich-text-toolbar-uploading" aria-live="polite"> Uploading…</span>}
        </button>
        <button type="button" onClick={clearFormat} title="Clear formatting">Clear</button>
        <span className="rich-text-toolbar-sep" />
        <button type="button" onClick={insertTable} title="Insert table">Table</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal line">—</button>
        <button type="button" onClick={onToggleFullScreen} className={fullScreen ? "is-active" : ""} title={fullScreen ? "Exit full screen" : "Full screen"}>⛶</button>
      </div>
    </div>
  );
}

export default function RichTextEditor({ value = "", onChange, placeholder, error, className = "", onUploadImage, onUploadError }) {
  const valueRef = useRef(value);
  const lastValuePropRef = useRef(value);
  const fileInputRef = useRef(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const placeholderText = placeholder || "Write your content here…";
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      ImageWithAlign.configure({
        inline: false,
        allowBase64: true,
        resize: { enabled: true, minWidth: 80, minHeight: 80 },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        "data-placeholder": placeholderText,
      },
      handleDOMEvents: {
        mousedown(view, event) {
          const target = event.target;
          if (!target || !target.closest?.(".ProseMirror")) return;
          if (target.closest?.("[data-resize-handle]")) return;
          const coords = { left: event.clientX, top: event.clientY };
          const pos = view.posAtCoords(coords);
          if (!pos) return;
          const { doc } = view.state;
          const $pos = doc.resolve(pos.pos);
          for (let d = $pos.depth; d > 0; d--) {
            const node = $pos.node(d);
            if (node.type.name === "image") {
              const nodePos = $pos.before(d);
              const tr = view.state.tr.setSelection(NodeSelection.create(doc, nodePos));
              view.dispatch(tr);
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }
        },
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      valueRef.current = html;
      onChange(html);
    },
  });

  // Only sync content when the value *prop* actually changes (e.g. load from server, form reset).
  // Avoids overwriting editor and losing image selection when parent re-renders with same/stale value.
  useEffect(() => {
    if (!editor) return;
    const next = value ?? "";
    if (next !== lastValuePropRef.current) {
      lastValuePropRef.current = next;
      valueRef.current = next;
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  // Re-render when selection changes so image toolbar (L, C, R, Size, Alt) enables when an image is selected
  useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            from: ed.state.selection.from,
            to: ed.state.selection.to,
            type: ed.state.selection.type?.name,
          }
        : null,
  });

  const triggerImageFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadImage || !editor) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      onUploadError?.("Please choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > IMAGE_MAX_SIZE) {
      onUploadError?.(`Image must be 5MB or smaller (current: ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    setImageUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        editor.chain().focus().setImage({
          src: url,
          alt: "",
          width: 400,
          height: null,
          align: "center",
        }).run();
        selectNewlyInsertedImage(editor);
      }
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div
      className={`rich-text-editor ${error ? "rich-text-editor--error" : ""} ${fullScreen ? "rich-text-editor--fullscreen" : ""} ${className}`}
      style={{ "--editor-placeholder": `"${placeholderText.replace(/"/g, '\\"')}"` }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden="true"
        onChange={handleImageFileChange}
      />
      <Toolbar
        editor={editor}
        fullScreen={fullScreen}
        onToggleFullScreen={() => setFullScreen((v) => !v)}
        onImageUploadClick={onUploadImage ? triggerImageFileInput : undefined}
        imageUploading={imageUploading}
      />
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) => ed.isActive("image")}
          options={{ placement: "top" }}
        >
          <ImageBubbleMenu editor={editor} />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

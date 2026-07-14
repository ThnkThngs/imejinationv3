import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadCloud, Trash2, Star, Loader2, GripVertical, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/lib/admin/mock-data";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_MAX = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX = 100 * 1024 * 1024; // 100 MB

function classify(file: File): "image" | "video" | null {
  if (IMAGE_TYPES.includes(file.type)) return "image";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  // Fallback by extension (e.g. .mov may report empty type on some browsers)
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (ext && ["mp4", "webm", "mov"].includes(ext)) return "video";
  return null;
}

function humanSize(n: number) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

interface Props {
  media: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  coverUrl?: string | null;
  onCoverChange?: (url: string) => void;
}

export function MediaUploader({ media, onChange, coverUrl, onCoverChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<
    { id: string; name: string; progress: number; error?: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const uploadFile = useCallback(
    async (file: File) => {
      const kind = classify(file);
      if (!kind) {
        toast.error(`${file.name}: unsupported file type`);
        return;
      }
      const limit = kind === "image" ? IMAGE_MAX : VIDEO_MAX;
      if (file.size > limit) {
        toast.error(
          `${file.name}: exceeds ${kind === "image" ? "10MB" : "100MB"} (${humanSize(file.size)})`,
        );
        return;
      }

      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ext = file.name.split(".").pop() || (kind === "image" ? "jpg" : "mp4");
      const path = `${uid}.${ext}`;

      setUploads((prev) => [...prev, { id: uid, name: file.name, progress: 5 }]);

      // Fake progress ticker (Supabase JS v2 lacks native progress events)
      const tick = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => (u.id === uid && u.progress < 90 ? { ...u, progress: u.progress + 8 } : u)),
        );
      }, 250);

      const { error } = await supabase.storage
        .from("portfolio")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });

      clearInterval(tick);

      if (error) {
        setUploads((prev) => prev.map((u) => (u.id === uid ? { ...u, error: error.message } : u)));
        toast.error(`${file.name}: ${error.message}`);
        setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uid)), 4000);
        return;
      }

      const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);
      const item: MediaItem = { url: pub.publicUrl, type: kind, name: file.name };
      onChange([...(media ?? []), item]);
      setUploads((prev) => prev.map((u) => (u.id === uid ? { ...u, progress: 100 } : u)));
      setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uid)), 800);
    },
    [media, onChange],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((f) => uploadFile(f));
    },
    [uploadFile],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  async function removeItem(idx: number) {
    const item = media[idx];
    onChange(media.filter((_, i) => i !== idx));
    // Best-effort remove from storage if it lives in our bucket
    try {
      const marker = "/portfolio/";
      const i = item.url.indexOf(marker);
      if (i > -1) {
        const path = item.url.substring(i + marker.length).split("?")[0];
        await supabase.storage.from("portfolio").remove([path]);
      }
    } catch {
      /* ignore */
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = media.map((_, i) => String(i));
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(media, oldIdx, newIdx));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-white/15 bg-white/[0.02]"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-white/50" />
        <p className="mt-2 text-sm text-white/70">Drag & drop photos or videos here</p>
        <p className="text-[11px] text-white/40">
          JPG · PNG · WEBP · GIF up to 10MB · MP4 · WEBM · MOV up to 100MB
        </p>
        <div className="mt-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            Choose files
          </Button>
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-1.5">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate">
                  {u.error ? null : <Loader2 className="h-3 w-3 animate-spin" />}
                  <span className="truncate">{u.name}</span>
                </span>
                <span className={u.error ? "text-red-400" : "text-white/50"}>
                  {u.error ? "Error" : `${u.progress}%`}
                </span>
              </div>
              {!u.error && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.error && <p className="mt-1 text-red-400/80">{u.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {media.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={media.map((_, i) => String(i))} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((m, i) => (
                <MediaTile
                  key={`${m.url}-${i}`}
                  index={i}
                  item={m}
                  isCover={coverUrl === m.url}
                  onSetCover={() => onCoverChange?.(m.url)}
                  onRemove={() => removeItem(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function MediaTile({
  index,
  item,
  isCover,
  onSetCover,
  onRemove,
}: {
  index: number;
  item: MediaItem;
  isCover: boolean;
  onSetCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(index),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-md border bg-black ${
        isCover ? "border-primary" : "border-white/10"
      }`}
    >
      {item.type === "image" ? (
        <img src={item.url} alt={item.name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <>
          <video src={item.url} className="h-full w-full object-cover" muted playsInline />
          <PlayCircle className="pointer-events-none absolute inset-0 m-auto h-8 w-8 text-white/80" />
        </>
      )}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag"
        className="absolute left-1 top-1 cursor-grab rounded bg-black/70 p-1 text-white/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onSetCover}
          aria-label="Set as cover"
          className={`rounded bg-black/70 p-1 backdrop-blur ${
            isCover ? "text-primary" : "text-white/80 hover:text-primary"
          }`}
        >
          <Star className={`h-3 w-3 ${isCover ? "fill-primary" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="rounded bg-black/70 p-1 text-red-300 backdrop-blur hover:text-red-200"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {isCover && (
        <span className="absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary-foreground">
          Cover
        </span>
      )}
      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/80 backdrop-blur">
        {item.type}
      </span>
    </div>
  );
}

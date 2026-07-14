import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Search,
  Copy,
  GripVertical,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
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
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePortfolio } from "@/lib/admin/store";
import { MediaUploader } from "@/components/admin/MediaUploader";
import type { MediaItem, PortfolioItem } from "@/lib/admin/mock-data";

export const Route = createFileRoute("/admin/portfolio")({
  component: PortfolioAdmin,
});

const empty: PortfolioItem = {
  id: "",
  title: "",
  category: "",
  location: "",
  description: "",
  cover_image: "",
  gallery_images: [],
  media: [],
  published: false,
  featured: false,
  display_order: 0,
  created_at: "",
  updated_at: "",
};

type SortMode = "manual" | "newest" | "oldest";

function PortfolioAdmin() {
  const {
    items,
    upsert,
    remove,
    togglePublished,
    toggleFeatured,
    duplicate,
    bulkDelete,
    bulkPublish,
    reorder,
    updatePartial,
  } = usePortfolio();

  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [previewing, setPreviewing] = useState<PortfolioItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => {
      if (categoryFilter !== "all" && (i.category ?? "") !== categoryFilter) return false;
      if (statusFilter === "published" && !i.published) return false;
      if (statusFilter === "draft" && i.published) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q) ||
        (i.location ?? "").toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q)
      );
    });
    if (sortMode === "newest") {
      list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sortMode === "oldest") {
      list = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return list;
  }, [items, search, categoryFilter, statusFilter, sortMode]);

  const dndDisabled =
    sortMode !== "manual" || !!search.trim() || categoryFilter !== "all" || statusFilter !== "all";

  function openNew() {
    setEditing({ ...empty, display_order: items.length });
  }

  async function save() {
    if (!editing) return;
    await upsert(editing);
    setEditing(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    if (filtered.every((i) => selected.has(i.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.add(i.id));
        return next;
      });
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = filtered.map((i) => i.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorder(newOrder);
  }

  const selectedIds = Array.from(selected);
  const anySelected = selectedIds.length > 0;

  return (
    <AdminShell
      title="Portfolio"
      description="Manage published case studies"
      actions={
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> New project
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description, location…"
            className="border-white/10 bg-black pl-9 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full border-white/10 bg-black text-white md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-black text-white">
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-full border-white/10 bg-black text-white md:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-black text-white">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={(v: any) => setSortMode(v)}>
          <SelectTrigger className="w-full border-white/10 bg-black text-white md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-black text-white">
            <SelectItem value="manual">Manual order</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filtered.length > 0 && filtered.every((i) => selected.has(i.id))}
              onCheckedChange={selectAllVisible}
              className="border-white/30"
            />
            Select visible ({filtered.length})
          </label>
          {anySelected && <span className="text-primary">{selectedIds.length} selected</span>}
          {!dndDisabled && (
            <span className="hidden md:inline text-white/30">· Drag cards to reorder</span>
          )}
        </div>
        {anySelected && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/15 bg-transparent text-xs text-white hover:bg-white/5"
              onClick={() => {
                bulkPublish(selectedIds, true);
                setSelected(new Set());
              }}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/15 bg-transparent text-xs text-white hover:bg-white/5"
              onClick={() => {
                bulkPublish(selectedIds, false);
                setSelected(new Set());
              }}
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Unpublish
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-red-500/30 bg-transparent text-xs text-red-300 hover:bg-red-500/10"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-white/60 hover:bg-white/5"
              onClick={() => setSelected(new Set())}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filtered.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <SortableCard
                key={item.id}
                item={item}
                dndDisabled={dndDisabled}
                selected={selected.has(item.id)}
                onSelect={() => toggleSelect(item.id)}
                onEdit={() => setEditing(item)}
                onPreview={() => setPreviewing(item)}
                onDuplicate={() => duplicate(item.id)}
                onDelete={() => setDeleteId(item.id)}
                onTogglePublished={() => togglePublished(item.id)}
                onToggleFeatured={() => toggleFeatured(item.id)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-16 text-center text-sm text-white/40">
                No projects match. Adjust filters or create a new one.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <EditorDialog
        editing={editing}
        setEditing={setEditing}
        onSave={save}
        onAutoSave={updatePartial}
      />

      <PreviewDialog previewing={previewing} onClose={() => setPreviewing(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-white/10 bg-black text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes the project from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) remove(deleteId);
                setDeleteId(null);
              }}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="border-white/10 bg-black text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} projects?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes the selected projects from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDelete(selectedIds);
                setSelected(new Set());
                setBulkDeleteOpen(false);
              }}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function SortableCard({
  item,
  dndDisabled,
  selected,
  onSelect,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
}: {
  item: PortfolioItem;
  dndDisabled: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: dndDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-white/[0.03] transition-colors ${
        selected ? "border-primary/60" : "border-white/10"
      }`}
    >
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
        <div className="rounded bg-black/70 p-1 backdrop-blur">
          <Checkbox checked={selected} onCheckedChange={onSelect} className="border-white/40" />
        </div>
        {!dndDisabled && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded bg-black/70 p-1.5 text-white/70 backdrop-blur hover:text-white active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt={item.title}
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/30">
            No image
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1.5">
          {item.featured && (
            <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
              Featured
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              item.published ? "bg-emerald-400/90 text-black" : "bg-white/10 text-white/70"
            }`}
          >
            {item.published ? "Live" : "Draft"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">
          {item.category ?? "—"}
        </p>
        <h3 className="mt-2 font-display text-lg leading-tight text-white">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/50">{item.description ?? ""}</p>
        <p className="mt-3 text-xs text-white/40">{item.location ?? ""}</p>
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
          <IconBtn onClick={onPreview} label="Preview">
            <Eye className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onEdit} label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onDuplicate} label="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onTogglePublished} label={item.published ? "Unpublish" : "Publish"}>
            {item.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn onClick={onToggleFeatured} label={item.featured ? "Unfeature" : "Feature"}>
            <Star className={`h-3.5 w-3.5 ${item.featured ? "fill-primary text-primary" : ""}`} />
          </IconBtn>
          <IconBtn onClick={onDelete} label="Delete" tone="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
    </article>
  );
}

function EditorDialog({
  editing,
  setEditing,
  onSave,
  onAutoSave,
}: {
  editing: PortfolioItem | null;
  setEditing: (v: PortfolioItem | null) => void;
  onSave: () => void;
  onAutoSave: (id: string, patch: Partial<PortfolioItem>) => Promise<unknown>;
}) {
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef<PortfolioItem | null>(null);

  useEffect(() => {
    initialRef.current = editing ? { ...editing } : null;
    setAutoSaveState("idle");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editing?.id]);

  // Debounced auto-save for existing items only
  useEffect(() => {
    if (!editing || !editing.id) return;
    const initial = initialRef.current;
    if (!initial || initial.id !== editing.id) return;
    // Skip if unchanged
    const changed =
      initial.title !== editing.title ||
      (initial.category ?? "") !== (editing.category ?? "") ||
      (initial.location ?? "") !== (editing.location ?? "") ||
      (initial.description ?? "") !== (editing.description ?? "") ||
      (initial.cover_image ?? "") !== (editing.cover_image ?? "") ||
      initial.display_order !== editing.display_order ||
      initial.published !== editing.published ||
      initial.featured !== editing.featured ||
      JSON.stringify(initial.gallery_images ?? []) !==
        JSON.stringify(editing.gallery_images ?? []);
    if (!changed) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setAutoSaveState("saving");
    const snapshot = { ...editing };
    timerRef.current = setTimeout(async () => {
      await onAutoSave(snapshot.id, {
        title: snapshot.title,
        category: snapshot.category,
        location: snapshot.location,
        description: snapshot.description,
        cover_image: snapshot.cover_image,
        gallery_images: snapshot.gallery_images,
        published: snapshot.published,
        featured: snapshot.featured,
        display_order: snapshot.display_order,
      });
      initialRef.current = snapshot;
      setAutoSaveState("saved");
    }, 900);
  }, [editing, onAutoSave]);

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-black text-white sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-display text-2xl font-light">
              {editing && editing.id ? "Edit project" : "New project"}
            </DialogTitle>
            {editing?.id && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                {autoSaveState === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </>
                )}
                {autoSaveState === "saved" && (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Saved
                  </>
                )}
              </span>
            )}
          </div>
        </DialogHeader>
        {editing && (
          <div className="space-y-4">
            {!editing.published && editing.id && (
              <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
                Draft mode · not visible on the public site
              </div>
            )}
            <FieldInput
              label="Title"
              value={editing.title}
              onChange={(v) => setEditing({ ...editing, title: v })}
            />
            <FieldInput
              label="Category"
              value={editing.category ?? ""}
              onChange={(v) => setEditing({ ...editing, category: v })}
            />
            <FieldInput
              label="Location"
              value={editing.location ?? ""}
              onChange={(v) => setEditing({ ...editing, location: v })}
            />
            <div className="space-y-2">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="border-white/10 bg-white/[0.03] text-white"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Media (photos & videos)</Label>
              <MediaUploader
                media={editing.media ?? []}
                onChange={(next: MediaItem[]) =>
                  setEditing({
                    ...editing,
                    media: next,
                    // Keep legacy gallery_images URLs in sync with images only, for backwards-compat readers
                    gallery_images: next.filter((m) => m.type === "image").map((m) => m.url),
                    // Auto-assign cover if none set
                    cover_image:
                      editing.cover_image && next.some((m) => m.url === editing.cover_image)
                        ? editing.cover_image
                        : next.find((m) => m.type === "image")?.url ?? next[0]?.url ?? "",
                  })
                }
                coverUrl={editing.cover_image}
                onCoverChange={(url) => setEditing({ ...editing, cover_image: url })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Display order</Label>
              <Input
                type="number"
                value={editing.display_order}
                onChange={(e) =>
                  setEditing({ ...editing, display_order: Number(e.target.value) })
                }
                className="border-white/10 bg-white/[0.03] text-white"
              />
            </div>
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <Switch
                  checked={editing.published}
                  onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <Switch
                  checked={editing.featured}
                  onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                />
                Featured
              </label>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setEditing(null)}
            className="text-white/70 hover:bg-white/5"
          >
            Close
          </Button>
          {editing && !editing.id && (
            <Button
              onClick={onSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({
  previewing,
  onClose,
}: {
  previewing: PortfolioItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!previewing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-black p-0 text-white">
        {previewing && (
          <div>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
                <Eye className="h-3.5 w-3.5" /> Preview
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    previewing.published
                      ? "bg-emerald-400/90 text-black"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {previewing.published ? "Live" : "Draft"}
                </span>
              </div>
            </div>
            <div className="p-6 md:p-10">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
                {previewing.category ?? "Uncategorized"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-light md:text-5xl">
                {previewing.title}
              </h2>
              {previewing.location && (
                <p className="mt-2 text-sm text-white/50">{previewing.location}</p>
              )}
              {previewing.description && (
                <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70">
                  {previewing.description}
                </p>
              )}
              {previewing.cover_image && (
                <img
                  src={previewing.cover_image}
                  alt={previewing.title}
                  className="mt-8 w-full rounded-md object-cover"
                />
              )}
              {(previewing.gallery_images ?? []).length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {previewing.gallery_images.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`${previewing.title} gallery ${i + 1}`}
                      className="w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-white/70">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-white/10 bg-white/[0.03] text-white placeholder:text-white/30"
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
        tone === "danger"
          ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
          : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

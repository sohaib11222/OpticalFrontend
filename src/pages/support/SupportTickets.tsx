import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type User = { id: number; name: string; email?: string; account_type?: string };
type FileInfo = { id: number; filename: string; title?: string; mime: string; size: number; scan_status: string };
type Attachment = { id: number; message_id?: number | null; file?: FileInfo };
type Ticket = { id: number; public_id: string; subject: string; category: string; priority: string; status: string; description: string; version: number; created_at: string; updated_at: string; creator?: User; assignee?: User; messages?: TicketMessage[]; attachments?: Attachment[] };
type TicketMessage = { id: number; body: string; created_at: string; sender?: User };
type Page<T> = { data: T[]; last_page: number };
type TicketNotice = { id: number; kind: string; read_at?: string | null; created_at: string; ticket?: Pick<Ticket, "id" | "subject" | "status" | "public_id"> };

const categories = ["general", "account", "technical", "billing", "integration", "data"];
const priorities = ["low", "normal", "high", "urgent"];

function UploadAttachments({ ticketId, files, onDone }: { ticketId: number; files: File[]; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.set("file", file);
        body.set("title", file.name);
        body.set("upload_key", crypto.randomUUID());
        await api.request(`/support/tickets/${ticketId}/attachments`, { method: "POST", body });
      }
      toast.success("Attachments uploaded and security checked.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Attachment upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return <Button type="button" variant="outline" disabled={!files.length || busy} onClick={() => void upload()}>{busy ? "Uploading…" : `Upload ${files.length || ""} attachment${files.length === 1 ? "" : "s"}`}</Button>;
}

function TicketDetail({ ticketId, onClose, onChanged }: { ticketId: number; onClose: () => void; onChanged: () => void }) {
  const { user } = useSession();
  const { data, error, loading, reload } = useApiResource<{ data: Ticket }>(`/support/tickets/${ticketId}`);
  const ticket = data?.data;
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, [reload]);
  const refresh = async () => { await Promise.all([reload(), onChanged()]); };
  const sendReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await api.request(`/support/tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify({ body: reply }) });
      setReply("");
      toast.success("Reply sent to support.");
      await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to send your reply."); }
    finally { setBusy(false); }
  };
  const changeStatus = async (status: "open" | "closed") => {
    if (!ticket) return;
    setBusy(true);
    try {
      await api.request(`/support/tickets/${ticket.id}/status`, { method: "PATCH", body: JSON.stringify({ status, version: ticket.version }) });
      toast.success(status === "closed" ? "Ticket closed." : "Ticket reopened.");
      await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to update the ticket."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{ticket?.subject || "Support ticket"}</DialogTitle><DialogDescription>{ticket ? `${ticket.public_id} · ${ticket.category} · ${ticket.priority} priority · ${ticket.status}` : "Loading ticket…"}</DialogDescription></DialogHeader>
      {loading && <p>Loading ticket…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {ticket && <div className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4"><p className="font-medium">Original request</p><p className="whitespace-pre-wrap mt-2">{ticket.description}</p></div>
        <div className="space-y-3">
          {(ticket.messages ?? []).map((message) => <div key={message.id} className={message.sender?.id === user?.id ? "ml-8 rounded-lg bg-primary/10 p-3" : "mr-8 rounded-lg border p-3"}>
            <p className="text-sm font-medium">{message.sender?.name || "Support"}</p><p className="whitespace-pre-wrap">{message.body}</p><p className="text-xs text-muted-foreground mt-1">{new Date(message.created_at).toLocaleString()}</p>
          </div>)}
        </div>
        {!!ticket.attachments?.length && <div className="flex flex-wrap gap-2">{ticket.attachments.map((attachment) => attachment.file && <Button key={attachment.id} variant="outline" size="sm" asChild disabled={attachment.file.scan_status !== "clean"}><a href={`/api/v1/support/tickets/${ticket.id}/attachments/${attachment.id}`}>{attachment.file.title || attachment.file.filename} · {attachment.file.scan_status}</a></Button>)}</div>}
        {ticket.status !== "closed" && <div className="space-y-3 border-t pt-4"><Label htmlFor="ticket-reply">Reply to support</Label><Textarea id="ticket-reply" value={reply} maxLength={8000} onChange={(event) => setReply(event.target.value)} /><Input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.csv,.docx,.xlsx" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><div className="flex flex-wrap gap-2"><Button disabled={busy || !reply.trim()} onClick={() => void sendReply()}>{busy ? "Sending…" : "Send reply"}</Button><UploadAttachments ticketId={ticket.id} files={files} onDone={refresh} /><Button variant="outline" disabled={busy} onClick={() => void changeStatus("closed")}>Close ticket</Button></div></div>}
        {ticket.status === "closed" && <Button disabled={busy} onClick={() => void changeStatus("open")}>Reopen ticket</Button>}
      </div>}
    </DialogContent>
  </Dialog>;
}

function NewTicket({ onClose, onCreated }: { onClose: () => void; onCreated: (ticket: Ticket) => Promise<void> }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      const result = await api.request<{ data: Ticket }>("/support/tickets", { method: "POST", body: JSON.stringify({ subject, category, priority, description }) });
      for (const file of files) {
        const body = new FormData(); body.set("file", file); body.set("title", file.name); body.set("upload_key", crypto.randomUUID());
        await api.request(`/support/tickets/${result.data.id}/attachments`, { method: "POST", body });
      }
      toast.success("Support ticket created.");
      await onCreated(result.data);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create the ticket."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>New support ticket</DialogTitle><DialogDescription>Describe the issue clearly. The support team will receive it immediately.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="ticket-subject">Subject</Label><Input id="ticket-subject" value={subject} maxLength={180} onChange={(event) => setSubject(event.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><select className="h-9 w-full rounded-md border bg-background px-3" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div><div><Label>Priority</Label><select className="h-9 w-full rounded-md border bg-background px-3" value={priority} onChange={(event) => setPriority(event.target.value)}>{priorities.map((value) => <option key={value}>{value}</option>)}</select></div></div><div><Label htmlFor="ticket-description">Description</Label><Textarea id="ticket-description" value={description} maxLength={8000} onChange={(event) => setDescription(event.target.value)} /></div><div><Label>Attachments</Label><Input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.csv,.docx,.xlsx" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></div><div className="flex gap-2"><Button disabled={busy || subject.trim().length < 3 || description.trim().length < 10} onClick={() => void create()}>{busy ? "Creating…" : "Create ticket"}</Button><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button></div></div></DialogContent></Dialog>;
}

export default function SupportTickets() {
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<number | null>(() => {
    const ticket = Number(searchParams.get("ticket"));
    return Number.isInteger(ticket) && ticket > 0 ? ticket : null;
  });
  const params = useMemo(() => new URLSearchParams({ ...(status ? { status } : {}), ...(priority ? { priority } : {}) }).toString(), [status, priority]);
  const { data, error, loading, reload } = useApiResource<Page<Ticket>>(`/support/tickets?${params}`);
  const notices = useApiResource<{ data: TicketNotice[]; unread: number }>("/support/notifications");
  const canCreate = !!user?.permissions.includes("support.create");
  const canRead = !!user?.permissions.includes("support.read");
  useEffect(() => {
    const timer = setInterval(() => { void reload(); void notices.reload(); }, 20000);
    return () => clearInterval(timer);
  }, [reload, notices.reload]);
  useEffect(() => {
    const ticket = Number(searchParams.get("ticket"));
    if (Number.isInteger(ticket) && ticket > 0) setSelected(ticket);
  }, [searchParams]);
  const closeTicket = () => {
    setSelected(null);
    if (!searchParams.has("ticket")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("ticket");
    setSearchParams(next, { replace: true });
  };
  const openNotice = async (notice: TicketNotice) => {
    try {
      if (!notice.read_at) await api.request(`/support/notifications/${notice.id}/read`, { method: "POST" });
      setSelected(notice.ticket?.id ?? null);
      await notices.reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to open the ticket notification."); }
  };
  if (!canRead) return <Card><CardContent className="p-6">You do not have access to support tickets.</CardContent></Card>;
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Support tickets</CardTitle><p className="text-sm text-muted-foreground mt-1">Ask the Vista Express 360 support team for help and track every reply.</p></div>{canCreate && <Button onClick={() => setCreating(true)}>New ticket</Button>}</div></CardHeader><CardContent className="space-y-4">{!!notices.data?.unread && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{notices.data.unread} unread support update{notices.data.unread === 1 ? "" : "s"}</p><Button variant="ghost" size="sm" onClick={() => void notices.reload()}>Refresh updates</Button></div><div className="mt-2 flex flex-wrap gap-2">{notices.data.data.filter((notice) => !notice.read_at).slice(0, 5).map((notice) => <Button key={notice.id} variant="outline" size="sm" onClick={() => void openNotice(notice)}>{notice.ticket?.public_id || "Ticket"} · {notice.ticket?.subject || notice.kind}</Button>)}</div></div>}<div className="flex flex-wrap gap-3"><select className="h-9 rounded-md border bg-background px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{["open", "in_progress", "waiting_for_response", "resolved", "closed"].map((value) => <option key={value}>{value}</option>)}</select><select className="h-9 rounded-md border bg-background px-3" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="">All priorities</option>{priorities.map((value) => <option key={value}>{value}</option>)}</select><Button variant="outline" onClick={reload}>Refresh</Button></div>{error && <p role="alert" className="text-destructive">{error}</p>}{loading && <p>Loading tickets…</p>}<Table><TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data?.data.map((ticket) => <TableRow key={ticket.id}><TableCell><p className="font-medium">{ticket.subject}</p><p className="text-xs text-muted-foreground">{ticket.public_id}</p></TableCell><TableCell>{ticket.category}</TableCell><TableCell><Badge variant={ticket.priority === "urgent" ? "destructive" : "secondary"}>{ticket.priority}</Badge></TableCell><TableCell><Badge variant={ticket.status === "closed" ? "outline" : "secondary"}>{ticket.status.split("_").join(" ")}</Badge></TableCell><TableCell>{new Date(ticket.updated_at).toLocaleString()}</TableCell><TableCell><Button variant="outline" size="sm" onClick={() => setSelected(ticket.id)}>Open</Button></TableCell></TableRow>)}</TableBody></Table>{!loading && !data?.data.length && <p className="py-8 text-center text-muted-foreground">No support tickets match these filters.</p>}{creating && <NewTicket onClose={() => setCreating(false)} onCreated={async (ticket) => { setCreating(false); await reload(); setSelected(ticket.id); }} />}{selected && <TicketDetail ticketId={selected} onClose={closeTicket} onChanged={reload} />}</CardContent></Card>;
}

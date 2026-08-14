import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, type PublicProfile } from "@/lib/market-api";
import {
  canJobApplicantChat,
  formatSalary,
  jobConversationQuery,
  jobMessagesQuery,
  markJobMessagesRead,
  myApplicationForJobQuery,
  sendJobMessage,
} from "@/lib/jobs-api";

export const Route = createFileRoute("/mensagens/vaga/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversa sobre a vaga — teiyaa" },
      {
        name: "description",
        content: "Converse com o anunciante da vaga e combine a entrevista pelo teiyaa.",
      },
      { property: "og:title", content: "Conversa sobre a vaga — teiyaa" },
      { property: "og:description", content: "Chat entre empregador e candidato." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobChatPage,
});

function JobChatPage() {
  const { conversationId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: convo } = useQuery(jobConversationQuery(conversationId));
  const { data: messages = [] } = useQuery(jobMessagesQuery(conversationId));
  const isApplicant = !!convo && !!user && convo.applicant_id === user.id;
  const { data: myApp } = useQuery({
    ...myApplicationForJobQuery(convo?.job_id ?? "", user?.id),
    enabled: isApplicant,
  });
  const canWrite = !isApplicant || canJobApplicantChat(myApp?.status);
  const [other, setOther] = useState<PublicProfile | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!convo || !user) return;
    const otherId = convo.owner_id === user.id ? convo.applicant_id : convo.owner_id;
    fetchProfiles([otherId]).then((m) => setOther(m[otherId] ?? null));
  }, [convo, user]);

  useEffect(() => {
    if (user) markJobMessagesRead(conversationId, user.id);
  }, [conversationId, user, messages.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`job-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["job-messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await sendJobMessage(conversationId, user.id, text.trim());
      setText("");
      qc.invalidateQueries({ queryKey: ["job-messages", conversationId] });
    } catch {
      toast.error("Não consegui enviar a mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-8 flex flex-col">
        <Link
          to="/mensagens"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-4" /> Mensagens
        </Link>

        {convo?.job && (
          <Link
            to="/vagas/$jobId"
            params={{ jobId: convo.job.id }}
            className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface"
          >
            <div className="size-12 rounded-xl bg-cat-vaga-soft flex items-center justify-center shrink-0">
              <span className="text-xl">💼</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{convo.job.title}</p>
              <p className="text-xs text-muted-foreground">
                Vaga · {formatSalary(convo.job)} • com {other?.display_name ?? "Vizinho"}
              </p>
            </div>
          </Link>
        )}

        <div className="flex-1 min-h-[45vh] mt-4 space-y-3 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              Combine entrevista, horário e detalhes por aqui.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    mine
                      ? "bg-brand text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <span
                    className={`block mt-1 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {canWrite ? (
          <form onSubmit={handleSend} className="sticky bottom-0 bg-background py-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem…"
              className="flex-1 h-12 px-4 rounded-full bg-card border border-border focus:border-brand outline-none"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="Enviar"
              className="size-12 rounded-full bg-brand text-primary-foreground flex items-center justify-center disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </form>
        ) : (
          <p className="sticky bottom-0 bg-background py-3 text-center text-sm text-muted-foreground">
            Você poderá conversar com o anunciante assim que for pré-selecionado ou escolhido.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

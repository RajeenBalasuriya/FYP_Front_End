"use client"

import * as React from "react"
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
    content: string
    score: number
    metadata?: Record<string, unknown>
}

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    sources?: Source[]
    timestamp: Date
    isLoading?: boolean
}

interface QueryResponse {
    answer: string
    sources?: any // 🔥 FIXED (was strict, now flexible)
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE_URL = "http://localhost:3005/api/v1"

async function queryRag(query: string, topK = 5): Promise<QueryResponse> {
    const res = await fetch(`${API_BASE_URL}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topK }),
    })

    if (!res.ok) {
        const error = await res.text()
        throw new Error(error || "Failed to query RAG service")
    }

    return res.json()
}

// ─── 🔥 FIX: normalize backend sources safely ────────────────────────────────

function normalizeSources(sources: any): Source[] {
    if (!Array.isArray(sources)) return []

    return sources.map((s) => {
        if (typeof s === "string") {
            return {
                content: s,
                score: 1,
            }
        }

        return {
            content: s?.content ?? "Unknown source",
            score: typeof s?.score === "number" ? s.score : 1,
        }
    })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceCard({ source, index }: { source: Source; index: number }) {
    const [expanded, setExpanded] = React.useState(false)
    const preview = source.content.slice(0, 120)
    const hasMore = source.content.length > 120

    return (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-muted-foreground">
                    Source {index + 1}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    score: {source.score.toFixed(3)}
                </Badge>
            </div>

            <p className="text-foreground/80 leading-relaxed">
                {expanded ? source.content : preview}
                {hasMore && !expanded && "…"}
            </p>

            {hasMore && (
                <button
                    onClick={() => setExpanded((e) => !e)}
                    className="text-primary hover:underline text-[10px]"
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    )
}

function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user"

    return (
        <div
            className={cn(
                "flex gap-3 px-1",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}
            >
                {isUser ? (
                    <User className="h-4 w-4" />
                ) : (
                    <Bot className="h-4 w-4" />
                )}
            </div>

            {/* Bubble */}
            <div
                className={cn(
                    "flex max-w-[75%] flex-col gap-2",
                    isUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        isUser
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm bg-muted text-foreground"
                    )}
                >
                    {message.isLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Thinking…
                        </span>
                    ) : (
                        message.content
                    )}
                </div>

                {/* Sources (🔥 FIXED SAFE RENDER) */}
                {!message.isLoading &&
                    Array.isArray(message.sources) &&
                    message.sources.length > 0 && (
                        <div className="w-full space-y-1.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
                                Referenced sources
                            </p>

                            {message.sources.map((src, i) => (
                                <SourceCard key={i} source={src} index={i} />
                            ))}
                        </div>
                    )}

                <span className="text-[10px] text-muted-foreground px-1">
                    {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            </div>
        </div>
    )
}

// ─── Empty State (UNCHANGED) ────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-semibold">Ask anything</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Query your knowledge base. The AI will retrieve relevant sources and
                    generate a grounded answer.
                </p>
            </div>
        </div>
    )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
    const [messages, setMessages] = React.useState<Message[]>([])
    const [input, setInput] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector(
                "[data-radix-scroll-area-viewport]"
            )
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight
            }
        }
    }, [messages])

    const handleSend = React.useCallback(async () => {
        const query = input.trim()
        if (!query || isLoading) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: query,
            timestamp: new Date(),
        }

        const loadingId = crypto.randomUUID()

        const loadingMsg: Message = {
            id: loadingId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isLoading: true,
        }

        setMessages((prev) => [...prev, userMsg, loadingMsg])
        setInput("")
        setIsLoading(true)

        try {
            const data = await queryRag(query, 5)

            const safeSources = normalizeSources(data.sources)

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === loadingId
                        ? {
                            ...m,
                            content: data.answer ?? "No response",
                            sources: safeSources,
                            isLoading: false,
                            timestamp: new Date(),
                        }
                        : m
                )
            )
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === loadingId
                        ? {
                            ...m,
                            content:
                                err instanceof Error
                                    ? `⚠️ ${err.message}`
                                    : "⚠️ Something went wrong",
                            isLoading: false,
                            timestamp: new Date(),
                        }
                        : m
                )
            )
        } finally {
            setIsLoading(false)
            textareaRef.current?.focus()
        }
    }, [input, isLoading])

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 md:p-6">
            {/* Header (UNCHANGED) */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        AI Assistant
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Powered by your knowledge base
                    </p>
                </div>

                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMessages([])}
                        className="gap-1.5 text-muted-foreground"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                )}
            </div>

            <Separator />

            {/* Chat Card (UNCHANGED STRUCTURE) */}
            <Card className="flex flex-1 flex-col overflow-hidden">
                <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
                    <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 pt-4">
                        {messages.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-6 pb-4">
                                {messages.map((msg) => (
                                    <ChatMessage key={msg.id} message={msg} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <Separator />

                    {/* Input (UNCHANGED) */}
                    <div className="flex items-end gap-2 px-4 pb-4">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder="Ask something…"
                            disabled={isLoading}
                        />

                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="h-11 w-11 shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Send, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "model" | "admin";
  content: string;
  senderName?: string;
  timestamp?: Timestamp;
};

type Conversation = {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastUpdate: Timestamp;
  isEscalated: boolean;
  messages: Message[];
};

export default function AdminMessagingPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedConversation, setSelectedConversation] =
    React.useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    const q = query(
      collection(firestore, `schools/${schoolId}/support-chats`),
      orderBy("lastUpdate", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Conversation,
      );
      setConversations(convos);
      setIsLoading(false);

      // If a conversation is selected, update it with new data
      if (selectedConversation) {
        const updatedConvo = convos.find(
          (c) => c.id === selectedConversation.id,
        );
        setSelectedConversation(updatedConvo || null);
      }
    });

    return () => unsubscribe();
  }, [schoolId, selectedConversation]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const handleSendMessage = async () => {
    if (!reply.trim() || !selectedConversation || !user || !schoolId) return;

    setIsSending(true);
    const newAdminMessage: Message = {
      role: "admin",
      content: reply,
      senderName: user.displayName || "Admin",
      timestamp: Timestamp.now(),
    };

    try {
      const conversationRef = doc(
        firestore,
        "schools",
        schoolId,
        "support-chats",
        selectedConversation.id,
      );
      await updateDoc(conversationRef, {
        messages: arrayUnion(newAdminMessage),
        lastMessage: reply,
        lastUpdate: serverTimestamp(),
        isEscalated: false, // De-escalate on reply
      });
      setReply("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (convo) =>
      convo.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleResolveConversation = async () => {
    if (!selectedConversation || !schoolId) return;
    try {
      await deleteDoc(
        doc(
          firestore,
          "schools",
          schoolId,
          "support-chats",
          selectedConversation.id,
        ),
      );
      setSelectedConversation(null);
    } catch (error) {
      console.error("Error resolving conversation:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          User Messaging
        </h1>
        <p className="text-muted-foreground">
          View and respond to escalated support requests.
        </p>
      </div>

      <Card className="h-[calc(100vh-250px)]">
        <div className="grid h-full grid-cols-1 md:grid-cols-3">
          <div className="flex flex-col border-r">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    className={cn(
                      "w-full text-left p-4 border-b hover:bg-muted/50",
                      selectedConversation?.id === convo.id && "bg-muted",
                    )}
                    onClick={() => setSelectedConversation(convo)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{convo.userName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {convo.lastUpdate?.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessage}
                    </p>
                    {convo.isEscalated && (
                      <Badge variant="destructive" className="mt-2">
                        Escalated
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>
          <div className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.userAvatar} />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.userName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        User Support Chat
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleResolveConversation}>
                    Close Conversation
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {selectedConversation.messages.map((message, index) => {
                      const isAdmin = message.role === "admin";
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-end gap-2",
                            isAdmin ? "justify-end" : "justify-start",
                          )}
                        >
                          {!isAdmin && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-3 text-sm shadow-md",
                              isAdmin
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-muted rounded-bl-none",
                            )}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp
                                ?.toDate()
                                .toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </p>
                          </div>
                          {isAdmin && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.senderName?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="relative">
                    <Input
                      placeholder="Type your reply..."
                      className="pr-12"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <Button
                      size="icon"
                      className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                      onClick={handleSendMessage}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8">
                <MessageSquare className="h-16 w-16 mb-4" />
                <h3 className="font-semibold text-lg">
                  Select a conversation to view
                </h3>
                <p className="text-sm">
                  Choose a chat from the left panel to see the messages and
                  reply.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

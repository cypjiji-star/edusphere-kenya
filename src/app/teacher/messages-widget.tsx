
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, ArrowRight, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { firestore, auth } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type ConversationParticipant = {
  id: string;
  name: string;
  avatar: string;
};

type Conversation = {
  id: string;
  participantsData: ConversationParticipant[];
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
  participants: string[];
  lastMessageSender?: string;
};

const getIconComponent = (participants: string[]) => {
  if (participants.length > 2) return Users;
  return User;
};

async function getParticipantDetails(
  schoolId: string,
  userId: string,
): Promise<ConversationParticipant | null> {
  const userDocRef = doc(firestore, "schools", schoolId, "users", userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: userId,
      name: data.name || "Unknown User",
      avatar: data.avatarUrl || "",
    };
  }
  return null;
}

export function MessagesWidget() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const { user } = useAuth();

  const unreadCount = conversations.filter(
    (c) => c.unread && c.lastMessageSender !== user?.uid,
  ).length;

  React.useEffect(() => {
    if (!schoolId || !user) return;
    const q = query(
      collection(firestore, `schools/${schoolId}/conversations`),
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const convosPromises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherParticipantId = data.participants.find(
          (p: string) => p !== user.uid,
        );

        let participantDetails: ConversationParticipant[] = [];
        if (otherParticipantId) {
          const details = await getParticipantDetails(
            schoolId,
            otherParticipantId,
          );
          if (details) {
            participantDetails.push(details);
          }
        }

        return {
          id: doc.id,
          ...data,
          participantsData: participantDetails,
        } as Conversation;
      });

      const resolvedConvos = await Promise.all(convosPromises);
      setConversations(resolvedConvos);
    });

    return () => unsubscribe();
  }, [schoolId, user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Recent Messages
          </div>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} Unread</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.slice(0, 3).map((message, index) => {
            const otherParticipant = message.participantsData[0] || {
              name: "Chat",
              avatar: "",
            };
            const IconComponent = getIconComponent(message.participants);
            return (
              <div key={index} className="space-y-3">
                <Link
                  href={`/teacher/messaging?schoolId=${schoolId}`}
                  className="block hover:bg-muted/50 p-2 -m-2 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={otherParticipant.avatar}
                        alt={otherParticipant.name}
                      />
                      <AvatarFallback>
                        <IconComponent />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">
                          {otherParticipant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {message.timestamp
                            ?.toDate()
                            .toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.lastMessage}
                      </p>
                    </div>
                    {message.unread &&
                      message.lastMessageSender !== user?.uid && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1"></div>
                      )}
                  </div>
                </Link>
                {index < conversations.slice(0, 3).length - 1 && <Separator />}
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="font-semibold">No new messages</p>
              <p className="text-sm">Your inbox is clear.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/teacher/messaging?schoolId=${schoolId}`}>
            Open Full Messaging App
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

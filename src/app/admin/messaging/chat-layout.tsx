
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Search,
  Send,
  PlusCircle,
  Archive,
  Trash2,
  Paperclip,
  CheckCircle2,
  Languages,
  Users,
  User,
  Loader2,
  X,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { translateText } from '@/ai/flows/translate-text';

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  icon: React.ElementType;
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
};

type Message = { 
  id?: string;
  sender: 'me' | 'other'; 
  text: string; 
  timestamp: Timestamp | null;
  read?: boolean; 
  senderName?: string;
  translatedText?: string;
};

const newContactOptions = [
    { id: 'contact-1', name: 'Mr. Otieno (Teacher)', avatar: 'https://picsum.photos/seed/teacher-otieno/100', icon: User },
    { id: 'contact-2', name: 'Ms. Njeri (Teacher)', avatar: 'https://picsum.photos/seed/teacher-njeri/100', icon: User },
    { id: 'contact-3', name: 'Mrs. Kamau (Parent)', avatar: 'https://picsum.photos/seed/parent2/100', icon: User },
];

export function AdminChatLayout() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [selectedConvo, setSelectedConvo] = React.useState<Conversation | null>(null);
  const [message, setMessage] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const q = query(collection(firestore, 'conversations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        setConversations(convos);
        if (!selectedConvo && convos.length > 0) {
            setSelectedConvo(convos[0]);
        }
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!selectedConvo) return;

    const messagesQuery = query(
        collection(firestore, 'conversations', selectedConvo.id, 'messages'),
        orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const convoMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(prev => ({
            ...prev,
            [selectedConvo.id]: convoMessages,
        }));
    });

    return () => unsubscribe();
  }, [selectedConvo]);

  const handleSendMessage = async () => {
    if ((message.trim() === '' && !attachment) || !selectedConvo) return;
    
    setIsSending(true);
    let messageText = message;
    
    if (attachment) {
      try {
        const storageRef = ref(storage, `chat-attachments/${attachment.name}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, attachment);
        const downloadURL = await getDownloadURL(snapshot.ref);
        messageText += `\n\n📎 [Attachment](${downloadURL})`;
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload your file. Please try again.",
        });
        setIsSending(false);
        return;
      }
    }

    const newMessage: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = {
      sender: 'me',
      text: messageText,
      timestamp: serverTimestamp(),
      read: false,
    };
    
    await addDoc(collection(firestore, 'conversations', selectedConvo.id, 'messages'), newMessage);

    setMessage('');
    setAttachment(null);
    setIsSending(false);
  };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleCreateConversation = async (contactId: string) => {
    const contact = newContactOptions.find(c => c.id === contactId);
    if (!contact) return;
    
    const existingConvo = conversations.find(c => c.name === contact.name);
    if (existingConvo) {
        setSelectedConvo(existingConvo);
        return;
    }

    const newConvoData = {
        name: contact.name,
        avatar: contact.avatar,
        icon: 'User', // Storing string instead of component
        lastMessage: 'New conversation started.',
        timestamp: serverTimestamp(),
        unread: false,
    };

    const docRef = await addDoc(collection(firestore, 'conversations'), newConvoData);
    
    toast({
        title: 'Conversation Started',
        description: `You can now chat with ${contact.name}.`
    });
  }

  const handleTranslate = async () => {
    if (!message) {
      toast({
        variant: 'destructive',
        title: 'No Message to Translate',
        description: 'Please type a message before using AI translation.',
      });
      return;
    }
    
    setIsTranslating(true);
    try {
      const result = await translateText({ text: message, targetLanguage: 'Swahili' });
      if (result && result.translatedText) {
        setMessage(result.translatedText);
        toast({
          title: 'Translation Complete',
          description: 'The message has been translated to Swahili.',
        });
      } else {
         throw new Error('AI did not return translated text.');
      }
    } catch(e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'The AI could not translate the message.',
      });
    } finally {
        setIsTranslating(false);
    }
  };

  const handleTranslateIncomingMessage = async (messageIndex: number, text: string) => {
    if (!selectedConvo) return;
    try {
        const result = await translateText({ text, targetLanguage: 'Swahili' });
        if (result && result.translatedText) {
            setMessages(prev => {
                const currentConvoMessages = prev[selectedConvo.id] || [];
                const updatedMessages = [...currentConvoMessages];
                updatedMessages[messageIndex] = {
                    ...updatedMessages[messageIndex],
                    translatedText: result.translatedText,
                };
                return {
                    ...prev,
                    [selectedConvo.id]: updatedMessages,
                };
            });
        } else {
            throw new Error('AI did not return translated text.');
        }
    } catch (e) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Translation Failed',
            description: 'The AI could not translate the message.',
        });
    }
};

  const handleArchive = () => {
    if (!selectedConvo) return;

    setConversations(prev => {
        const newConversations = prev.filter(c => c.id !== selectedConvo.id);
        setSelectedConvo(newConversations.length > 0 ? newConversations[0] : null);
        return newConversations;
    });

    toast({
        title: 'Conversation Archived',
    });
  }

  const handleDelete = () => {
    if (!selectedConvo) return;
    
    handleArchive(); // Same logic as archiving for now, but also deletes messages
    
    setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[selectedConvo.id];
        return newMessages;
    });

     toast({
        title: 'Conversation Deleted',
        variant: 'destructive',
    });
  }
  
  const getIconComponent = (iconName: string) => {
    if (iconName === 'User') return User;
    if (iconName === 'Users') return Users;
    return MessageCircle;
  }

  const filteredConversations = conversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Messenger</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Conversation</DialogTitle>
                            <DialogDescription>Select a user to start a new chat.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                           <Label htmlFor="new-chat-recipient">Recipient</Label>
                           <Select onValueChange={handleCreateConversation}>
                                <SelectTrigger id="new-chat-recipient">
                                    <SelectValue placeholder="Select a teacher or parent..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {newContactOptions.map(contact => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={contact.avatar} />
                                                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{contact.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
                        </div>
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages or users..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
            {filteredConversations.map((convo) => {
                const IconComponent = getIconComponent(convo.icon as unknown as string);
                return (
                    <button
                        key={convo.id}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50',
                          selectedConvo?.id === convo.id && 'bg-muted'
                        )}
                        onClick={() => setSelectedConvo(convo)}
                      >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={convo.avatar} alt={convo.name} />
                            <AvatarFallback><IconComponent /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{convo.name}</p>
                            <p className="text-xs text-muted-foreground">{convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                        </div>
                         {convo.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center"></div>}
                      </button>
                )
            })}
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full h-full">
          {selectedConvo ? (
            <>
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConvo.avatar} alt={selectedConvo.name} />
                        <AvatarFallback>{React.createElement(getIconComponent(selectedConvo.icon as unknown as string))}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{selectedConvo.name}</p>
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleArchive}>
                        <Archive className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id] || []).map((msg, index) => {
                    const IconComponent = getIconComponent(selectedConvo.icon as unknown as string);
                    return (
                        <div key={msg.id || index} className={cn(
                            "flex items-end gap-2",
                            msg.sender === 'me' ? 'justify-end' : 'justify-start'
                        )}>
                            {msg.sender === 'other' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConvo.avatar}/><AvatarFallback><IconComponent/></AvatarFallback></Avatar>}
                            <div className="group relative">
                              <div className={cn(
                                  "max-w-xs lg:max-w-md rounded-2xl p-3 text-sm shadow-sm",
                                  msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none'
                              )}>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                  {msg.translatedText && (
                                      <p className="mt-2 pt-2 border-t border-secondary-foreground/20 italic text-secondary-foreground/80">
                                          {msg.translatedText}
                                      </p>
                                  )}
                                  <div className={cn("text-xs mt-2 flex items-center gap-2", msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                      <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      {msg.sender === 'me' && msg.read && <CheckCircle2 className="h-4 w-4" />}
                                  </div>
                              </div>
                              {msg.sender === 'other' && (
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute -top-2 -right-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleTranslateIncomingMessage(index, msg.text)}
                                  >
                                      <Languages className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                              )}
                            </div>
                             {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://picsum.photos/seed/admin-avatar/100" /><AvatarFallback>A</AvatarFallback></Avatar>}
                        </div>
                    )
                })}
              </div>
              <div className="flex-shrink-0 p-4 border-t space-y-2">
                 {attachment && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setAttachment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    placeholder="Type a message..."
                    className="pr-40"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                     onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                   <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                     <Button type="button" variant="outline" size="sm" onClick={handleTranslate} disabled={isTranslating}>
                        {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                        Translate
                    </Button>
                    <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                             <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleAttachmentClick}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Attach file</p>
                         </TooltipContent>
                       </Tooltip>
                    </TooltipProvider>
                    <Button
                        size="icon"
                        disabled={(!message.trim() && !attachment) || isSending}
                        onClick={handleSendMessage}
                    >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-col items-center justify-center h-full text-muted-foreground hidden md:flex">
              <MessageCircle className="h-16 w-16" />
              <p className="mt-4 text-lg font-semibold">Select a conversation</p>
              <p>Your messages will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

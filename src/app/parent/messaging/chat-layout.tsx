
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Search,
  Send,
  PlusCircle,
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
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

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
import { useAuth } from '@/context/auth-context';

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  icon: string;
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
  participants: string[];
  lastMessageSender?: string;
};

type Message = { 
  id?: string;
  sender: string; // Changed to string to store user ID
  text: string; 
  timestamp: Timestamp | null;
  read?: boolean; 
  senderName?: string;
  translatedText?: string;
  attachmentUrl?: string;
};

type SelectableContact = {
  id: string;
  name: string;
  avatar: string;
  icon: React.ElementType;
  role: string;
}

type TranslationLanguage = {
  code: string;
  name: string;
}

export function ParentChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [selectedConvo, setSelectedConvo] = React.useState<Conversation | null>(null);
  const [message, setMessage] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [newContactOptions, setNewContactOptions] = React.useState<SelectableContact[]>([]);
  const [targetLanguage, setTargetLanguage] = React.useState('sw');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const translationLanguages: TranslationLanguage[] = [
    { code: 'sw', name: 'Swahili' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConvo]);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const convosQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`), 
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubConvos = onSnapshot(convosQuery, 
      (querySnapshot) => {
        const convos = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Conversation));
        setConversations(convos);
        
        if (!selectedConvo && convos.length > 0) {
          setSelectedConvo(convos[0]);
        }
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Could not load conversations. Please try again.",
        });
      }
    );

    const usersQuery = query(
      collection(firestore, `schools/${schoolId}/users`), 
      where('role', '==', 'Teacher')
    );
    
    const unsubUsers = onSnapshot(usersQuery, 
      (snapshot) => {
        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: `${data.name}`,
            avatar: data.avatarUrl || '',
            icon: User,
            role: data.role,
          }
        });
        setNewContactOptions(users);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );

    return () => {
      unsubConvos();
      unsubUsers();
    };
  }, [schoolId, user, toast]);

  React.useEffect(() => {
    if (!selectedConvo || !schoolId || !user) return;

    const messagesQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, 
      (querySnapshot) => {
        const convoMessages = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Message));
        
        setMessages(prev => ({
          ...prev,
          [selectedConvo.id]: convoMessages,
        }));

        // Mark messages as read if they're from other users
        const unreadMessages = convoMessages.filter(
          msg => msg.sender !== user.uid && !msg.read
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Could not load messages. Please try again.",
        });
      }
    );

    return () => unsubscribe();
  }, [selectedConvo, schoolId, user, toast]);

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    if (!schoolId || !selectedConvo || !user) return;

    try {
      const batch = writeBatch(firestore);
      
      messagesToMark.forEach(msg => {
        if (msg.id) {
          const messageRef = doc(
            firestore, 
            `schools/${schoolId}/conversations`, 
            selectedConvo.id, 
            'messages', 
            msg.id
          );
          batch.update(messageRef, { read: true });
        }
      });

      // Update conversation unread status
      const convoRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id);
      batch.update(convoRef, { unread: false });

      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if ((message.trim() === '' && !attachment) || !selectedConvo || !schoolId || !user) return;
    
    setIsSending(true);
    let messageText = message.trim();
    let attachmentUrl = '';
    
    if (attachment) {
      try {
        const storageRef = ref(storage, `schools/${schoolId}/chat-attachments/${attachment.name}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        messageText += messageText ? `\n\n📎 [Attachment](${attachmentUrl})` : `📎 [Attachment](${attachmentUrl})`;
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

    try {
      const newMessage: Omit<Message, 'id'> & { timestamp: any } = {
        sender: user.uid,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        senderName: user.displayName || 'Parent',
        ...(attachmentUrl && { attachmentUrl }),
      };
      
      await addDoc(
        collection(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages'), 
        newMessage
      );

      // Update last message in conversation
      const convoRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id);
      await updateDoc(convoRef, {
        lastMessage: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        timestamp: serverTimestamp(),
        lastMessageSender: user.uid,
        unread: true,
      });

      setMessage('');
      setAttachment(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Could not send your message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      // Check file size (max 5MB)
      if (event.target.files[0].size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
        });
        return;
      }
      setAttachment(event.target.files[0]);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleCreateConversation = async (contactId: string) => {
    if (!schoolId || !user) return;
    const contact = newContactOptions.find(c => c.id === contactId);
    if (!contact) return;
    
    try {
      const existingConvoQuery = query(
        collection(firestore, `schools/${schoolId}/conversations`),
        where('participants', 'array-contains', user.uid)
      );
      const existingConvoSnapshot = await getDocs(existingConvoQuery);
      const existingConvo = existingConvoSnapshot.docs.find(doc => 
        doc.data().participants.includes(contactId)
      );

      if (existingConvo) {
        setSelectedConvo({ id: existingConvo.id, ...existingConvo.data() } as Conversation);
        return;
      }

      const newConvoData = {
        name: contact.name,
        avatar: contact.avatar || `https://picsum.photos/seed/${contact.id}/100`,
        icon: 'User',
        lastMessage: 'New conversation started.',
        timestamp: serverTimestamp(),
        unread: false,
        participants: [user.uid, contactId],
        lastMessageSender: user.uid,
      };

      const docRef = await addDoc(collection(firestore, `schools/${schoolId}/conversations`), newConvoData);
      setSelectedConvo({ id: docRef.id, ...newConvoData } as Conversation);
      
      toast({
        title: 'Conversation Started',
        description: `You can now chat with ${contact.name}.`
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not start a new conversation. Please try again.",
      });
    }
  }

  const handleTranslate = async () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Message to Translate',
        description: 'Please type a message before using translation.',
      });
      return;
    }
    
    setIsTranslating(true);
    try {
      const languageName = translationLanguages.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
      const result = await translateText({ 
        text: message, 
        targetLanguage: languageName 
      });
      
      if (result && result.translatedText) {
        setMessage(result.translatedText);
        toast({
          title: 'Translation Complete',
          description: `The message has been translated to ${languageName}.`,
        });
      } else {
        throw new Error('Translation service did not return translated text.');
      }
    } catch(e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'The translation service could not translate the message.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateIncomingMessage = async (messageId: string, text: string, targetLang: string) => {
    if (!selectedConvo || !schoolId) return;
    
    try {
      const languageName = translationLanguages.find(lang => lang.code === targetLang)?.name || targetLang;
      const result = await translateText({ 
        text, 
        targetLanguage: languageName 
      });
      
      if (result && result.translatedText) {
        // Update the message with translated text
        const messageRef = doc(
          firestore, 
          `schools/${schoolId}/conversations`, 
          selectedConvo.id, 
          'messages', 
          messageId
        );
        
        await updateDoc(messageRef, {
          translatedText: result.translatedText,
          translationLanguage: targetLang,
        });
      } else {
        throw new Error('Translation service did not return translated text.');
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'The translation service could not translate the message.',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedConvo || !schoolId) return;
    
    if (!window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id));
      
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[selectedConvo.id];
        return newMessages;
      });

      // Select another conversation if available
      const remainingConvos = conversations.filter(c => c.id !== selectedConvo.id);
      setSelectedConvo(remainingConvos.length > 0 ? remainingConvos[0] : null);

      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been successfully deleted.',
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Could not delete the conversation. Please try again.',
      });
    }
  };
  
  const getIconComponent = (iconName: string) => {
    if (iconName === 'User') return User;
    if (iconName === 'Users') return Users;
    return MessageCircle;
  };

  const filteredConversations = conversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user is the sender of a message
  const isSender = (message: Message) => message.sender === user?.uid;

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        {/* Conversations sidebar */}
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary"/>Messenger
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                    <DialogDescription>Select a teacher to start a new chat.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="new-chat-recipient">Recipient</Label>
                    <Select onValueChange={handleCreateConversation}>
                      <SelectTrigger id="new-chat-recipient">
                        <SelectValue placeholder="Select a teacher..." />
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
                placeholder="Search messages or teachers..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredConversations.map((convo) => {
                const IconComponent = getIconComponent(convo.icon);
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{convo.name}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {convo.lastMessageSender === user?.uid ? 'You: ' : ''}
                        {convo.lastMessage}
                      </p>
                    </div>
                    {convo.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center"></div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-col w-full h-full">
          {selectedConvo ? (
            <>
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConvo.avatar} alt={selectedConvo.name} />
                    <AvatarFallback>{React.createElement(getIconComponent(selectedConvo.icon))}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConvo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConvo.participants.length === 2 ? 'Direct message' : 'Group chat'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id] || []).map((msg, index) => {
                  const IconComponent = getIconComponent(selectedConvo.icon);
                  const isUserSender = isSender(msg);
                  
                  return (
                    <div key={msg.id || index} className={cn(
                      "flex items-end gap-2",
                      isUserSender ? 'justify-end' : 'justify-start'
                    )}>
                      {!isUserSender && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedConvo.avatar}/>
                          <AvatarFallback><IconComponent/></AvatarFallback>
                        </Avatar>
                      )}
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div className={cn(
                          "rounded-2xl p-3 text-sm shadow-sm",
                          isUserSender 
                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                            : 'bg-secondary rounded-bl-none'
                        )}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          
                          {msg.attachmentUrl && (
                            <div className="mt-2">
                              <a 
                                href={msg.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm underline"
                              >
                                <Paperclip className="h-3 w-3 mr-1" />
                                View Attachment
                              </a>
                            </div>
                          )}
                          
                          {msg.translatedText && (
                            <div className="mt-2 pt-2 border-t border-secondary-foreground/20">
                              <p className="italic text-secondary-foreground/80 text-xs">
                                {msg.translatedText}
                              </p>
                            </div>
                          )}
                          
                          <div className={cn(
                            "text-xs mt-2 flex items-center gap-2", 
                            isUserSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            <span>
                              {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isUserSender && msg.read && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        </div>
                        
                        {!isUserSender && !msg.translatedText && (
                          <div className="absolute -top-2 -right-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Select
                              value={targetLanguage}
                              onValueChange={(value) => msg.id && handleTranslateIncomingMessage(msg.id, msg.text, value)}
                            >
                              <SelectTrigger className="h-7 w-7 p-0">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                              </SelectTrigger>
                              <SelectContent>
                                {translationLanguages.map((lang) => (
                                  <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      {isUserSender && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || "https://picsum.photos/seed/parent-avatar/100"} />
                          <AvatarFallback>{user.displayName?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
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
                    className="pr-40 min-h-[80px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*, .pdf, .doc, .docx, .txt"
                  />
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="h-9 w-9 p-0">
                        <Languages className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {translationLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleAttachmentClick}
                            disabled={isSending}
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attach file (max 5MB)</p>
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

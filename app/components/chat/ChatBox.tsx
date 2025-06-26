import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronUp, ChevronDown, FileVideo, FileImage, Type } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { type MediaBinItem } from "../timeline/types";

// llm tools
import { llmAddScrubberToTimeline } from "~/utils/llm-handler";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBoxProps {
  className?: string;
  mediaBinItems: MediaBinItem[];
  handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void;
}

export function ChatBox({ className = "", mediaBinItems, handleDropOnTrack }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your video editing assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Filter media bin items based on mention query
  const filteredMentions = mediaBinItems.filter(item =>
    item.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle input changes and @ mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setInputValue(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      // Only show mentions if @ is at start or after whitespace, and no spaces after @
      const isValidMention = (lastAtIndex === 0 || /\s/.test(beforeCursor[lastAtIndex - 1])) &&
        !afterAt.includes(' ');

      if (isValidMention) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention into input
  const insertMention = (item: MediaBinItem) => {
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const afterCursor = inputValue.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    const newValue = beforeCursor.slice(0, lastAtIndex) + `@${item.name} ` + afterCursor;
    setInputValue(newValue);
    setShowMentions(false);

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtIndex + item.name.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(userMessage.content),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const getAIResponse = (userInput: string): string => {
    // Parse command pattern: @<item> add to track <number> pos <number>
    const commandPattern = /@(\w+(?:\s+\w+)*)\s+add\s+to\s+track\s+(\d+)\s+pos\s+(\d+)/i;
    const match = userInput.match(commandPattern);
    
    if (match) {
      const [, itemName, trackNumber, position] = match;
      
      try {
        // Find the media item by name
        const mediaItem = mediaBinItems.find(item => 
          item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (!mediaItem) {
          return `Error: Media item "${itemName}" not found in the media bin. Please check the name and try again.`;
        }
        
        // Convert position to pixels (assuming some conversion factor)
        const dropLeftPx = parseInt(position);
        const trackId = `track-${trackNumber}`;
        
        // Execute the function
        llmAddScrubberToTimeline(
          mediaItem.id,
          mediaBinItems,
          trackId,
          dropLeftPx,
          handleDropOnTrack
        );
        
        return `✅ Successfully added "${mediaItem.name}" to track ${trackNumber} at position ${position}px.`;
        
      } catch (error) {
        return `❌ Error: ${error instanceof Error ? error.message : 'Failed to add item to timeline'}`;
      }
    }
    
    // Default responses for non-command messages
    const responses = [
      "I can help you with video editing tasks like trimming clips, adding transitions, or adjusting audio levels.",
      "Would you like me to explain how to use any specific feature of the timeline editor?",
      "I can assist with rendering settings, export options, or organizing your media bin.",
      "Feel free to ask about keyboard shortcuts, timeline navigation, or composition settings.",
      "I'm here to help make your video editing workflow more efficient!",
      "Try using commands like '@itemname add to track 1 pos 100' to add media to the timeline.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev < filteredMentions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev > 0 ? prev - 1 : filteredMentions.length - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredMentions[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Chat Header */}
      <div className="h-9 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium tracking-tight">AI Assistant</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 scroll-smooth"
      >
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.isUser
                  ? "bg-primary text-primary-foreground ml-8"
                  : "bg-muted mr-8"
                  }`}
              >
                <div className="flex items-start gap-2">
                  {!message.isUser && (
                    <Bot className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  {message.isUser && (
                    <User className="h-3 w-3 mt-0.5 text-primary-foreground/70 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted mr-8">
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-3 bg-muted/20 relative">
        {/* Mentions Dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div
            ref={mentionsRef}
            className="absolute bottom-full left-3 right-3 mb-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50"
          >
            {filteredMentions.map((item, index) => (
              <div
                key={item.id}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${index === selectedMentionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                  }`}
                onClick={() => insertMention(item)}
              >
                <div className="w-6 h-6 bg-muted/50 rounded flex items-center justify-center">
                  {item.mediaType === 'video' ? (
                    <FileVideo className="h-3 w-3 text-muted-foreground" />
                  ) : item.mediaType === 'image' ? (
                    <FileImage className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Type className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.mediaType}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask about video editing... (type @ to mention media)"
            className="flex-1 h-8 text-sm border-border/50 bg-background"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line • @ to mention media
        </p>
      </div>
    </div>
  );
} 
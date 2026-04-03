import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback className="bg-slate-600 text-white text-xs">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        <span
          className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
}

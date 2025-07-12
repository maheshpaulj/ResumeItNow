import * as React from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bold, List, Eye, Edit } from "lucide-react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    showEnhanceButton?: boolean;
    onTextChange?: (text: string) => void;
  }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showEnhanceButton = true, onTextChange, value, onChange, ...props }, forwardedRef) => {
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const [currentText, setCurrentText] = React.useState<string>(value as string || '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentTab, setCurrentTab] = React.useState<string>('edit');
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Update internal state when value prop changes
    React.useEffect(() => {
      setCurrentText(value as string || '');
    }, [value]);

    const { toast } = useToast();

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setCurrentText(newText);
      
      // Trigger both onTextChange and original onChange
      onTextChange?.(newText);
      onChange?.(e);
    };

    const handleEnhance = async () => {
      if (!currentText.trim()) {
        toast({
          title: "Error",
          description: "Please enter some text first",
          variant: "destructive",
        });
        return;
      }

      setIsEnhancing(true);
      try {
        const response = await fetch('/api/enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: currentText }),
        });

        if (!response.ok) {
          throw new Error('Failed to enhance text');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Update text and trigger change event
        const newText = data.enhanced;
        const syntheticEvent = {
          target: { 
            value: newText,
            name: props.name || '' // Ensure name is passed for react-hook-form
          }
        } as React.ChangeEvent<HTMLTextAreaElement>;

        // Update state
        setCurrentText(newText);
        
        // Trigger onChange to work with react-hook-form
        onChange?.(syntheticEvent);
        
        // Additional optional callback
        onTextChange?.(newText);

        toast({
          title: "Success",
          description: "Text enhanced successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to enhance text",
          variant: "destructive",
        });
        console.error(error);
      } finally {
        setIsEnhancing(false);
      }
    };

    const insertMarkdown = (markdownSyntax: string, wrapper = true) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      let newText;
      if (wrapper) {
        newText = selectedText ? 
          text.substring(0, start) + `${markdownSyntax}${selectedText}${markdownSyntax}` + text.substring(end) :
          text.substring(0, start) + `${markdownSyntax}text${markdownSyntax}` + text.substring(end);
      } else {
        newText = text.substring(0, start) + `${markdownSyntax} ` + text.substring(end);
      }

      // Create synthetic event to trigger react-hook-form update
      const syntheticEvent = {
        target: { 
          value: newText,
          name: props.name || '' 
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      // Update state and trigger onChange
      setCurrentText(newText);
      onChange?.(syntheticEvent);
      onTextChange?.(newText);

      textarea.focus();
    };

    const renderMarkdown = (text: string): string => {
      // Basic Markdown parsing
      return text
        .split('\n')
        .map(line => {
          // Convert bold
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          // Convert bullet points
          if (line.trim().startsWith('- ')) {
            line = `<li>${line.substring(2)}</li>`;
          }
          return line;
        })
        .join('\n');
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertMarkdown('**')}
            className="w-8 h-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertMarkdown('- ', false)}
            className="w-8 h-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="edit" onValueChange={setCurrentTab}>
          <div className="flex justify-between" style={{fontFamily: "Montserrat, sans-serif"}}>
            <TabsList className="mb-2">
              <TabsTrigger value="edit" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            {showEnhanceButton && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-purple-400 hover:bg-purple-500 transition hover:scale-105"
                onClick={handleEnhance}
                disabled={isEnhancing}
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  "Enhance with AI"
                )}
              </Button>
            )}
          </div>

          <TabsContent value="edit" className="relative">
            <textarea
              className={cn(
                "flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pb-12",
                className
              )}
              ref={(node) => {
                // Update both refs
                textareaRef.current = node;
                if (typeof forwardedRef === 'function') {
                  forwardedRef(node);
                } else if (forwardedRef) {
                  forwardedRef.current = node;
                }
              }}
              {...props}
              value={currentText}
              onChange={handleTextChange}
            />
          </TabsContent>

          <TabsContent value="preview" className="relative w-full">
            <div
              className="prose min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentText) }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
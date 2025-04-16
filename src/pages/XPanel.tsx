import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedPrompt, PromptTag } from '@/components/dashboard/types';
import { supabase } from '@/integrations/supabase/client';

const XPanel = () => {
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [masterCommand, setMasterCommand] = useState('');
  const [primaryToggle, setPrimaryToggle] = useState('');
  const [secondaryToggle, setSecondaryToggle] = useState('');
  const [tags, setTags] = useState<PromptTag[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError('Prompt ID is missing.');
          return;
        }

        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          setError('Prompt not found.');
          return;
        }
        
        // Ensure tags is always an array of PromptTag
        let promptTags: PromptTag[] = [];
        if (Array.isArray(data.tags)) {
          promptTags = data.tags.map(tag => ({
            id: tag.id || '',
            name: tag.name || '',
            color: tag.color || '',
            category: tag.category || '',
            subcategory: tag.subcategory || ''
          }));
        } else if (data.tags) {
          console.warn("Tags are not in the expected array format:", data.tags);
        }

        const formattedPrompt: SavedPrompt = {
          id: data.id,
          title: data.title,
          prompt: data.prompt_text || '',
          promptText: data.prompt_text || '',
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          user_id: data.user_id || '',
          date: new Date(data.created_at || '').toLocaleString(),
          masterCommand: data.master_command || '',
          primaryToggle: data.primary_toggle || '',
          secondaryToggle: data.secondary_toggle || '',
          variables: data.variables,
          tags: promptTags as PromptTag[]
        };

        setPrompt(formattedPrompt);
        setTitle(formattedPrompt.title);
        setPromptText(formattedPrompt.promptText || '');
        setMasterCommand(formattedPrompt.masterCommand || '');
        setPrimaryToggle(formattedPrompt.primaryToggle || '');
        setSecondaryToggle(formattedPrompt.secondaryToggle || '');
        setTags(promptTags);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch prompt.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id) {
        setError('Prompt ID is missing.');
        return;
      }

      const { error } = await supabase
        .from('prompts')
        .update({
          title,
          prompt_text: promptText,
          master_command: masterCommand,
          primary_toggle: primaryToggle,
          secondary_toggle: secondaryToggle,
          // tags: tags // Save tags if needed
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Prompt updated successfully.",
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update prompt.');
      toast({
        title: "Error",
        description: "Failed to update prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!prompt) {
    return <div>Prompt not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Prompt</CardTitle>
          <CardDescription>Modify the prompt details here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="promptText">Prompt Text</Label>
            <Textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="masterCommand">Master Command</Label>
            <Input
              id="masterCommand"
              value={masterCommand}
              onChange={(e) => setMasterCommand(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="primaryToggle">Primary Toggle</Label>
            <Input
              id="primaryToggle"
              value={primaryToggle}
              onChange={(e) => setPrimaryToggle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="secondaryToggle">Secondary Toggle</Label>
            <Input
              id="secondaryToggle"
              value={secondaryToggle}
              onChange={(e) => setSecondaryToggle(e.target.value)}
            />
          </div>
          <div>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default XPanel;

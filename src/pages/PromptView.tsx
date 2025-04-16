import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SavedPrompt, Variable, PromptTag } from '@/components/dashboard/types';
import { variablesToJson, jsonToVariables } from '@/components/dashboard/types';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PromptView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [promptData, setPromptData] = useState<SavedPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<PromptTag[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchPrompt = useCallback(async () => {
    if (!id) {
      setError("Invalid prompt ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Prompt not found");
      }

      setPromptData({
        id: data.id,
        title: data.title,
        prompt: data.prompt_text,
        promptText: data.prompt_text,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        date: new Date(data.created_at).toLocaleString(),
        masterCommand: data.master_command,
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        variables: data.variables,
        tags: data.tags
      });
      
      if (data.variables) {
        // Handle either array or record format
        if (Array.isArray(data.variables)) {
          setVariables(data.variables as Variable[]);
        } else {
          setVariables(jsonToVariables(data.variables as Record<string, any>));
        }
      } else {
        setVariables([]);
      }

      // Ensure tags are correctly assigned
      if (data.tags && Array.isArray(data.tags)) {
        setTags(data.tags as PromptTag[]);
      } else {
        setTags([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const handleCopyToClipboard = () => {
    if (promptData) {
      navigator.clipboard.writeText(promptData.promptText);
      toast({
        title: "Copied to clipboard",
        description: "The prompt text has been copied to your clipboard.",
      });
    }
  };

  const handleDeletePrompt = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Prompt Deleted",
        description: "The prompt has been successfully deleted.",
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to delete prompt: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!promptData) {
    return <div>Prompt not found</div>;
  }

  // Fix the PromptTag[] assignment
  const sampleTags: PromptTag[] = [
    { id: '1', name: 'Development', category: 'Development', subcategory: 'Web' },
    { id: '2', name: 'Design', category: 'Design', subcategory: 'UI/UX' },
  ];

  return (
    <div className="container mx-auto mt-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{promptData.title}</CardTitle>
          <CardDescription>
            Created on {promptData.date}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2">
            {sampleTags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.category}: {tag.subcategory}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Prompt Text</h3>
            <Textarea
              readOnly
              className="w-full bg-gray-100 border-gray-300 rounded-md p-2 resize-none"
              value={promptData.promptText || ''}
              rows={4}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Master Command</h3>
            <Input
              readOnly
              className="w-full bg-gray-100 border-gray-300 rounded-md p-2"
              value={promptData.masterCommand || ''}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Variables</h3>
            {variables.length > 0 ? (
              <ul className="list-disc list-inside">
                {variables.map((variable) => (
                  <li key={variable.id}>
                    {variable.name}: {variable.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No variables available for this prompt.</p>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="secondary" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
              <Button onClick={() => navigate(`/edit-prompt/${id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this prompt from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePrompt}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptView;

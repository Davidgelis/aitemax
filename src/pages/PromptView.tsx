import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { SavedPrompt, variablesToJson, jsonToVariables, Variable, PromptTag } from '@/components/dashboard/types';
import { formatDistanceToNow } from 'date-fns';
import { Spinner } from '@/components/dashboard/Spinner';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Clock,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export const PromptView = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<PromptTag[]>([]);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; avatar_url: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          username: data.username || 'Unknown User',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser({ id: userId, username: 'Unknown User', avatar_url: '' });
    }
  };

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          const prompt: SavedPrompt = {
            id: data.id,
            title: data.title || 'Untitled Prompt',
            prompt: data.prompt_text || '',
            promptText: data.prompt_text || '',
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
            user_id: data.user_id || '',
            date: new Date(data.created_at || '').toLocaleString(),
            masterCommand: data.master_command || '',
            primaryToggle: data.primary_toggle,
            secondaryToggle: data.secondary_toggle,
            variables: data.variables as unknown as Variable[] || [],
            tags: data.tags as unknown as PromptTag[] || []
          };

          setSelectedPrompt(prompt);

          // Safely handle variables
          if (data.variables) {
            const promptVars = Array.isArray(data.variables) 
              ? data.variables as unknown as Variable[]
              : jsonToVariables(data.variables as unknown as Record<string, any>);
            setVariables(promptVars);
          }

          // Safely handle tags
          if (data.tags) {
            const promptTags = Array.isArray(data.tags) 
              ? data.tags.map(tag => ({
                  id: typeof tag.id === 'string' ? tag.id : '',
                  name: typeof tag.name === 'string' ? tag.name : '',
                  category: typeof tag.category === 'string' ? tag.category : '',
                  subcategory: typeof tag.subcategory === 'string' ? tag.subcategory : '',
                })) as PromptTag[]
              : [];
            setTags(promptTags);
          }

          // Fetch user info
          await fetchUser(data.user_id);
        }
      } catch (error) {
        console.error('Error fetching prompt:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the prompt.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPrompt();
    }
  }, [id, toast]);

  const handleCopyToClipboard = () => {
    if (selectedPrompt) {
      navigator.clipboard.writeText(selectedPrompt.prompt).then(() => {
        toast({
          title: 'Copied!',
          description: 'Prompt copied to clipboard.',
        });
      }).catch(err => {
        console.error('Could not copy prompt: ', err);
        toast({
          title: 'Error',
          description: 'Failed to copy prompt to clipboard.',
          variant: 'destructive'
        });
      });
    }
  };

  const handleTagClick = (tag: PromptTag) => {
    // Implement tag click logic here
    console.log('Tag clicked:', tag);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (!selectedPrompt) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full text-lg">
          Prompt not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto mt-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{selectedPrompt.title}</h1>
              <div className="text-gray-500 text-sm flex items-center mt-1">
                <Clock className="mr-1 h-4 w-4" />
                Created {formatDistanceToNow(new Date(selectedPrompt.created_at), {
                  addSuffix: true,
                })}
                {selectedPrompt.updated_at !== selectedPrompt.created_at && (
                  <>
                    <span className="mx-2">•</span>
                    Updated {formatDistanceToNow(new Date(selectedPrompt.updated_at), {
                      addSuffix: true,
                    })}
                  </>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Author</h2>
            <div className="flex items-center">
              <Avatar className="mr-2">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.username || 'Unknown User'} />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-gray-600">{user?.username || 'Unknown User'}</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  onClick={() => handleTagClick(tag)}
                  className="cursor-pointer"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Prompt</h2>
            <div className="prose max-w-none">
              {showFullPrompt ? (
                <p className="text-gray-800 whitespace-pre-line">{selectedPrompt.prompt}</p>
              ) : (
                <p className="text-gray-800 whitespace-pre-line overflow-hidden max-h-40 relative">
                  {selectedPrompt.prompt.substring(0, 500)}
                  {selectedPrompt.prompt.length > 500 && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-gray-100 flex justify-center items-end">
                      <Button variant="link" size="sm" onClick={() => setShowFullPrompt(true)}>
                        Show More <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </p>
              )}
              {selectedPrompt.prompt.length > 500 && showFullPrompt && (
                <div className="flex justify-center mt-2">
                  <Button variant="link" size="sm" onClick={() => setShowFullPrompt(false)}>
                    Show Less <ChevronUp className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

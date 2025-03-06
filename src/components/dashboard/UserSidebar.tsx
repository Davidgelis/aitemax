import { User, MoreVertical, CopyIcon, Pencil, Trash, Search, FileText, Clock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SavedPrompt } from "./types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";

const ADMIN_USER_ID = "8b40d73f-fffb-411f-9044-480773968d58";

interface UserSidebarProps {
  user: any;
  savedPrompts: SavedPrompt[];
  filteredPrompts: SavedPrompt[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoadingPrompts: boolean;
  handleNewPrompt: () => void;
  handleDeletePrompt: (id: string) => void;
  handleDuplicatePrompt: (prompt: SavedPrompt) => void;
  handleRenamePrompt: (id: string, newTitle: string) => void;
  loadSavedPrompt?: (prompt: SavedPrompt) => void;
  drafts?: any[];
  isLoadingDrafts?: boolean;
  loadDraft?: (draft: any) => void;
  handleDeleteDraft?: (id: string) => void;
}

export const UserSidebar = ({
  user,
  savedPrompts,
  filteredPrompts,
  searchTerm,
  setSearchTerm,
  isLoadingPrompts,
  handleNewPrompt,
  handleDeletePrompt,
  handleDuplicatePrompt,
  handleRenamePrompt,
  loadSavedPrompt,
  drafts = [],
  isLoadingDrafts = false,
  loadDraft,
  handleDeleteDraft
}: UserSidebarProps) => {
  const navigate = useNavigate();
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const isAdmin = user?.id === ADMIN_USER_ID;
  
  const startEditing = (prompt: SavedPrompt) => {
    setEditingPromptId(prompt.id);
    setEditingTitle(prompt.title);
  };

  const saveEdit = () => {
    if (editingPromptId && editingTitle.trim()) {
      handleRenamePrompt(editingPromptId, editingTitle);
      setEditingPromptId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingPromptId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const filteredContent = searchTerm
    ? filteredPrompts
    : [...drafts, ...savedPrompts];

  return (
    <Sidebar side="right">
      <SidebarTrigger className="fixed right-4 top-2 z-50 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
      
      <SidebarContent>
        <div className="p-4 flex items-center justify-between border-b mt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="font-medium">{user ? (user.email || 'User').split('@')[0] : 'Guest'}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded-md transition-all hover:shadow-[0_0_10px_rgba(51,254,166,0.7)] focus:shadow-[0_0_10px_rgba(51,254,166,0.7)]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 4.5C9.41421 4.5 9.75 4.16421 9.75 3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75C8.25 4.16421 8.58579 4.5 9 4.5Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15C9.41421 15 9.75 14.6642 9.75 14.25C9.75 13.8358 9.41421 13.5 9 13.5C8.58579 13.5 8.25 13.8358 8.25 14.25C8.25 14.6642 8.58579 15 9 15Z" fill="#545454" stroke="#545454" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="menu-item-glow">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/analytics")} className="menu-item-glow">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>
              )}
              
              {user ? (
                <DropdownMenuItem 
                  onClick={async () => {
                    const { supabase } = await import('@/integrations/supabase/client');
                    await supabase.auth.signOut();
                  }}
                  className="menu-item-glow"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/auth")} className="menu-item-glow">
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Sign in</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-center my-3">
          <button
            onClick={handleNewPrompt}
            className="aurora-button w-[70%] inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">New Prompt</span>
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto">
          {(isLoadingPrompts || isLoadingDrafts) ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : filteredContent.length > 0 ? (
            <>
              {!searchTerm && drafts.length > 0 && (
                <div className="px-4 py-2 border-b bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Drafts</span>
                  </div>
                </div>
              )}
              
              {!searchTerm && drafts.map((draft) => (
                <div
                  key={draft.id || 'local-draft'}
                  className="p-4 border-b flex items-center justify-between group/item cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => loadDraft && loadDraft(draft)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="text-sm font-medium truncate">
                          {draft.title} <span className="text-xs font-normal text-muted-foreground">(Draft)</span>
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(draft.updated_at) || 'Recently edited'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (handleDeleteDraft && draft.id) {
                        handleDeleteDraft(draft.id);
                      }
                    }}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {!searchTerm && savedPrompts.length > 0 && (
                <div className="px-4 py-2 border-b bg-muted/20">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Saved Prompts</span>
                  </div>
                </div>
              )}
              
              {searchTerm ? filteredPrompts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b flex items-center justify-between group/item cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => loadSavedPrompt && editingPromptId !== item.id && loadSavedPrompt(item)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      {editingPromptId === item.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="text-sm font-medium border border-transparent focus:border-[#33fea6] focus:outline-none rounded px-1 w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(item);
                            }} 
                            className="ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-[#33fea6]" />
                          </button>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <div 
                        className="prompt-action-button"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePrompt(item);
                      }}>
                        <CopyIcon className="mr-2 h-4 w-4" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(item.id);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )) : (
                savedPrompts.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b flex items-center justify-between group/item cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => loadSavedPrompt && editingPromptId !== item.id && loadSavedPrompt(item)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        {editingPromptId === item.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-medium border border-transparent focus:border-[#33fea6] focus:outline-none rounded px-1 w-full"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(item);
                              }} 
                              className="ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground hover:text-[#33fea6]" />
                            </button>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <div 
                          className="prompt-action-button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePrompt(item);
                        }}>
                          <CopyIcon className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(item.id);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {user ? (
                searchTerm ? "No matching prompts found" : "No saved prompts yet"
              ) : (
                <div className="space-y-3">
                  <p>Please sign in to save and view your prompts</p>
                  <Button onClick={() => navigate("/auth")} className="aurora-button">
                    Sign in
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

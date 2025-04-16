
// Update just the relevant parts where the errors occur - these are the object creation spots

// Around line 173
const formattedPrompts: SavedPrompt[] = data?.map(item => {
  return {
    id: item.id,
    title: item.title || 'Untitled Prompt',
    prompt: item.prompt_text || '', // Make sure prompt property is set
    promptText: item.prompt_text || '',
    created_at: item.created_at || '',
    updated_at: item.updated_at || '',
    user_id: item.user_id || '',
    date: new Date(item.created_at || '').toLocaleString(),
    masterCommand: item.master_command || '',
    primaryToggle: item.primary_toggle,
    secondaryToggle: item.secondary_toggle,
    variables: jsonToVariables(item.variables as Json),
  } as SavedPrompt;
}) || [];

// Around line 314
if (data && data.length > 0) {
  const newPrompt: SavedPrompt = {
    id: data[0].id,
    title: data[0].title || 'Untitled Prompt',
    prompt: data[0].prompt_text || '',
    promptText: data[0].prompt_text || '',
    created_at: data[0].created_at || '',
    updated_at: data[0].updated_at || '',
    user_id: data[0].user_id || '',
    date: new Date(data[0].created_at || '').toLocaleString(),
    masterCommand: data[0].master_command || '',
    primaryToggle: data[0].primary_toggle,
    secondaryToggle: data[0].secondary_toggle,
    variables: jsonToVariables(data[0].variables as Json),
    tags: (data[0].tags as unknown as PromptTag[]) || []
  };
  
  if (jsonStructure) {
    newPrompt.jsonStructure = jsonStructure;
  }
  
  setSavedPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
}

// Around line 396
if (prompt.variables) {
  // Ensure proper conversion to Variable[]
  const promptVars = Array.isArray(prompt.variables) 
    ? prompt.variables as Variable[]
    : jsonToVariables(prompt.variables as Record<string, any>);
  setVariables(promptVars);
} else {
  setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
}

// Around line 410
if (data && data.length > 0) {
  const newPrompt: SavedPrompt = {
    id: data[0].id,
    title: data[0].title,
    prompt: data[0].prompt_text || '',
    promptText: data[0].prompt_text || '',
    created_at: data[0].created_at || '',
    updated_at: data[0].updated_at || '',
    user_id: data[0].user_id || '',
    date: new Date(data[0].created_at || '').toLocaleString(),
    masterCommand: data[0].master_command || '',
    primaryToggle: data[0].primary_toggle,
    secondaryToggle: data[0].secondary_toggle,
    variables: jsonToVariables(data[0].variables as Json),
  };
  
  if (prompt.jsonStructure) {
    newPrompt.jsonStructure = prompt.jsonStructure;
  }
  
  setSavedPrompts([newPrompt, ...savedPrompts]);
}

// Around line 495
if (prompt.variables) {
  // Convert variables safely to the correct type
  if (Array.isArray(prompt.variables)) {
    setVariables(prompt.variables as Variable[]);
  } else {
    setVariables(jsonToVariables(prompt.variables as Record<string, any>));
  }
} else {
  setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
}


import { useState } from "react";
import { supabase, refreshSupabaseConnection } from "@/integrations/supabase/client";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { GPT41_ID } from "@/services/model/ModelFetchService";
import { cleanTemplate } from "@/utils/cleanTemplate";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

// Match the server's trimming logic
const MAX_EXAMPLES = 4;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

type LoadingState = {
  isLoading: boolean;
  message:  string;
};

export const usePromptAnalysis = (
  promptText:         string,
  setQuestions:       (q: Question[]) => void,
  setVariables:       (v: Variable[]) => void,
  setMasterCommand:   (c: string)      => void,
  setFinalPrompt:     (p: string)      => void,
  jumpToStep:         (n: number)      => void,
  user:               any,
  currentPromptId:    string | null,
  setWarnings?:       (w: string[]) => void
) => {
  const [loading, setLoading] = useState<LoadingState>({ isLoading:false, message:"" });
  const [retryCount, setRetryCount] = useState<number>(0);
  const { toast }  = useToast();
  const { getCurrentTemplate } = useTemplateManagement();   // ⬅ current template

  /* ---------- helpers ---------- */
  const setLoad = (msg = "", flag = true) => setLoading({ isLoading: flag, message: msg });

  // Sleep function for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 🔐 strip un-serialisable fields & stay below 1 MB
  const processSafeImages = (imgs: UploadedImage[] | null) => {
    if (!imgs?.length) return null;
    let budget = 650_000;                // total bytes for ALL base64 strings
    return imgs.flatMap(({ id, base64 = "", context = "" }) => {
      if (!base64 || base64.length > budget)
        return [{ id, context, base64: null }];
      budget -= base64.length;
      return [{ id, context, base64 }];
    });
  };

  const handleAnalyze = async (
    images: UploadedImage[] | null,
    websiteCtx: {url:string; instructions:string} | null,
    smartCtx  : {context:string; usageInstructions:string} | null
  ) => {
    if (!promptText.trim()) {
      toast({ title:"Empty prompt", description:"Type something first.", variant:"destructive" });
      return;
    }

    try {
      setLoad("Analyzing your prompt…");
      setRetryCount(0); // Reset retry counter on new analyze attempt

      /* prepare data exactly like the original edge-function expects */
      const templateClean = cleanTemplate(getCurrentTemplate());
      
      // ─── DEBUG: show exactly what clean template we're about to send ───
      console.log("📡 [usePromptAnalysis] analyze-prompt payload.template:", JSON.stringify(templateClean, null, 2));
      
      // New debug log to see the full template object
      console.log("▶️  ANALYZE PAYLOAD TEMPLATE:", JSON.stringify(templateClean, null, 2));
      
      // 🔍 Debug: Log template.pillars before sending the request
      console.log("🔍 analyze-prompt payload → template.pillars:", templateClean?.pillars);
      
      const safeImages = processSafeImages(images);

      const payload: any = {
        promptText,
        userId   : user?.id ?? null,
        promptId : currentPromptId,
        model    : GPT41_ID,
        template : templateClean,
        imageData: safeImages ?? undefined,
        websiteData: websiteCtx ?? undefined,
        smartContextData: smartCtx ?? undefined,
      };

      // ─── DEBUG: full payload ───
      console.log("📡 [usePromptAnalysis] full analyze-prompt payload:", JSON.stringify(payload, null, 2));

      // ─── LOG THE FULL PAYLOAD & PILLARS FOR DIAGNOSIS ─────────────────
      // this will print exactly what's being POSTed, so you can copy the
      // template.pillars array out of your browser console:
      console.log("🔍 analyze-prompt payload →", payload);
      console.log("🔍 analyze-prompt payload → template.pillars:", payload.template?.pillars);
      // ───────────────────────────────────────────────────────────────────

      // Function to invoke the edge function with retry logic
      const invokeWithRetry = async (retries: number): Promise<any> => {
        try {
          console.log(`🔄 Attempt ${retries + 1}/${MAX_RETRIES + 1} to invoke analyze-prompt`);
          const { data, error } = await supabase.functions.invoke("analyze-prompt", { body: payload });
          
          if (error) {
            console.error(`Error in attempt ${retries + 1}:`, error);
            throw error;
          }
          
          if (!data) {
            console.error(`No data returned in attempt ${retries + 1}`);
            throw new Error("No data returned");
          }
          
          return data;
        } catch (err) {
          if (retries < MAX_RETRIES) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
            
            // Try to refresh the connection before retrying
            if (retries > 0) {
              console.log("Attempting to refresh Supabase connection...");
              await refreshSupabaseConnection();
            }
            
            return invokeWithRetry(retries + 1);
          }
          
          // All retries exhausted, throw the error
          throw err;
        }
      }
      
      const data = await invokeWithRetry(0);

      /* ---------- normalise server response for front-end ---------- */
      const normQ = (q: any, i: number): Question => {
        console.log(`Processing question ${i}:`, q);
        // Check if there's pre-filled answer data
        const hasPrefill = !!q.answer;
        if (hasPrefill) {
          console.log(`Question ${i} has prefilled answer:`, q.answer);
        }
        
        // Check and normalize prefill source
        let sourceTxt = q.prefillSource;
        if (typeof sourceTxt === 'object' && sourceTxt !== null) {
          console.log(`Normalizing prefill source object for question ${i}:`, sourceTxt);
          sourceTxt = sourceTxt._type || sourceTxt.value || null;
        }
        
        return {
          id        : q.id        || `q-${i+1}`,
          text      : q.text      || q.question || (q.q as string) || "",
          answer    : q.answer    || "",             // Preserve prefilled answer
          isRelevant: q.isRelevant !== false,
          category  : q.category  || "General",
          prefillSource: sourceTxt || undefined,
          contextSource: q.contextSource || undefined,
          examples  : Array.isArray(q.examples) ? q.examples.slice(0, MAX_EXAMPLES) : [],
          hasBeenAnswered: q.hasBeenAnswered ?? !!q.answer                // Retain backend flag or derive from answer
        };
      };

      const normV = (v: any, i: number): Variable => ({
        id        : v.id        || `v-${i+1}`,
        name      : v.name      || "",
        value     : v.value     || "",
        isRelevant: v.isRelevant !== false,
        category  : v.category  || "General",
        code      : v.code      || v.name?.toLowerCase().replace(/\s+/g,"_") || "",
        prefillSource: v.prefillSource || undefined
      });

      // Convert questions and variables, logging the results
      const normalizedQuestions = (data.questions ?? []).map(normQ);
      console.log("Normalized questions:", normalizedQuestions);
      
      const normalizedVariables = (data.variables ?? []).map(normV);
      console.log("Normalized variables:", normalizedVariables);
      
      // If smartContext was not provided, clear any context-derived prefilled data
      if (!smartCtx || !smartCtx.context?.trim()) {
        const clearedQuestions = normalizedQuestions.map(q => {
          // Remove answers/flags that came from context or website
          if (q.prefillSource === 'context' || q.prefillSource === 'website') {
            return { ...q, answer: "", hasBeenAnswered: false, prefillSource: undefined };
          }
          return q;
        });
        const clearedVariables = normalizedVariables.map(v => {
          if (v.prefillSource === 'context') {
            return { ...v, value: "" };
          }
          return v;
        });
        setQuestions(clearedQuestions);
        setVariables(clearedVariables);
      } else {
        setQuestions(normalizedQuestions);
        setVariables(normalizedVariables);
      }
      setMasterCommand(data.masterCommand ?? "");
      setFinalPrompt(data.enhancedPrompt ?? "");

      // If any warnings came back, show them to the user and save for UI
      if (data.warnings && Array.isArray(data.warnings)) {
        setWarnings?.(data.warnings);
        data.warnings.forEach((msg: string) => {
          toast({ title: "Notice", description: msg, variant: "warning" });
        });
      }
      jumpToStep(2);                       // 👈 move on
    } catch (err: any) {
      console.error("Analysis failed:", err);
      
      // Show more helpful error message based on error type
      let errorMessage = err.message ?? String(err);
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorMessage = "Request timed out. The server might be busy, please try again.";
      } else if (errorMessage.includes("401") || errorMessage.includes("auth")) {
        errorMessage = "Authentication error. Try refreshing the page or sign in again.";
      }
      
      toast({ 
        title: "Analysis failed", 
        description: errorMessage, 
        variant: "destructive",
        duration: 5000  // Longer duration for error messages
      });
      
      // Update retry count for tracking
      setRetryCount(prev => prev + 1);
    } finally {
      setLoad("", false);
    }
  };

  const enhancePromptWithGPT = async (
    prompt:            string,
    primary:           string | null,
    secondary:         string | null,
    setFinal:          (p:string)=>void,
    answered:          Question[],
    vars:              Variable[],
    template:          any
  ) => {
    setLoad("Enhancing prompt with GPT-4.1…");
    try {
      // Similar retry mechanism for enhancePrompt
      const invokeWithRetry = async (retries: number): Promise<any> => {
        try {
          console.log(`🔄 Attempt ${retries + 1}/${MAX_RETRIES + 1} to invoke enhance-prompt`);
          const { data, error } = await supabase.functions.invoke("enhance-prompt", {
            body: { 
              originalPrompt: prompt, 
              answeredQuestions: answered, 
              relevantVariables: vars,
              primaryToggle: primary, 
              secondaryToggle: secondary, 
              template 
            }
          });
          
          if (error) throw error;
          if (!data?.enhancedPrompt) throw new Error("No enhanced prompt returned");
          return data;
        } catch (err) {
          if (retries < MAX_RETRIES) {
            console.log(`Retrying enhance-prompt in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
            
            if (retries > 0) {
              await refreshSupabaseConnection();
            }
            
            return invokeWithRetry(retries + 1);
          }
          throw err;
        }
      };
      
      const data = await invokeWithRetry(0);
      setFinal(data.enhancedPrompt);
    } catch (e:any) {
      console.error("Enhancement failed:", e);
      
      // More descriptive error message
      let errorMessage = e.message ?? String(e);
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network connection issue while enhancing prompt. Please check your connection and try again.";
      }
      
      toast({ 
        title: "Enhancement failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoad("",false);
    }
  };

  return {
    isLoading:          loading.isLoading,
    currentLoadingMessage: loading.message,
    loadingState:       loading,
    handleAnalyze,
    enhancePromptWithGPT,
    retryCount
  };
};

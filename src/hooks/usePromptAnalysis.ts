
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { GPT41_ID } from "@/services/model/ModelFetchService";
import { cleanTemplate } from "@/utils/cleanTemplate";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

// Match the server's trimming logic
const MAX_EXAMPLES = 4;

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
  const { toast }  = useToast();
  const { getCurrentTemplate } = useTemplateManagement();   // ⬅ current template

  /* ---------- helpers ---------- */
  const setLoad = (msg = "", flag = true) => setLoading({ isLoading: flag, message: msg });

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

      /* prepare data exactly like the original edge-function expects */
      const templateClean = cleanTemplate(getCurrentTemplate());
      
      // ─── DEBUG: show exactly what clean template we're about to send ───
      console.log("📡 [usePromptAnalysis] analyze-prompt payload.template:", JSON.stringify(templateClean, null, 2));
      
      // New debug log to see the full template object
      console.log("▶️  ANALYZE PAYLOAD TEMPLATE:", JSON.stringify(templateClean, null, 2));
      
      // 🔍 Debug: Log template.pillars before sending the request
      console.log("🔍 analyze-prompt payload → template.pillars:", templateClean?.pillars);
      
      const safeImages    = processSafeImages(images);

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

      const { data, error } = await supabase.functions.invoke("analyze-prompt", { body: payload });
      if (error || !data) throw new Error(error?.message || "No data returned");

      /* ---------- normalise server response for front-end ---------- */
      const normQ = (q: any, i: number): Question => ({
        id        : q.id        || `q-${i+1}`,
        text      : q.text      || q.question || (q.q as string) || "",
        answer    : q.answer    || "",
        isRelevant: q.isRelevant !== false,
        category  : q.category  || "General",
        prefillSource: q.prefillSource || undefined,
        contextSource: q.contextSource || undefined,
        examples  : Array.isArray(q.examples) ? q.examples.slice(0, MAX_EXAMPLES) : [],
        hasBeenAnswered: !!q.answer         // mark if it arrived pre-answered
      });

      const normV = (v: any, i: number): Variable => ({
        id        : v.id        || `v-${i+1}`,
        name      : v.name      || "",
        value     : v.value     || "",
        isRelevant: v.isRelevant !== false,
        category  : v.category  || "General",
        code      : v.code      || v.name?.toLowerCase().replace(/\s+/g,"_") || "",
        prefillSource: v.prefillSource || undefined
      });

      setQuestions( (data.questions ?? []).map(normQ) );
      setVariables( (data.variables ?? []).map(normV) );
      setMasterCommand(data.masterCommand ?? "");
      setFinalPrompt( data.enhancedPrompt ?? "" );

      // If any warnings came back, show them to the user and save for UI
      if (data.warnings && Array.isArray(data.warnings)) {
        setWarnings?.(data.warnings);
        data.warnings.forEach((msg: string) => {
          toast({ title: "Notice", description: msg, variant: "warning" });
        });
      }
      jumpToStep(2);                       // 👈 move on
    } catch (err: any) {
      console.error(err);
      toast({ title:"Analysis failed", description: err.message ?? String(err), variant:"destructive" });
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
      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { originalPrompt:prompt, answeredQuestions:answered, relevantVariables:vars,
                primaryToggle:primary, secondaryToggle:secondary, template }
      });
      if (error || !data?.enhancedPrompt) throw new Error(error?.message || "No enhanced prompt returned");
      setFinal(data.enhancedPrompt);
    } catch (e:any) {
      toast({ title:"Enhancement failed", description:e.message ?? String(e), variant:"destructive" });
    } finally {
      setLoad("",false);
    }
  };

  return {
    isLoading:          loading.isLoading,
    currentLoadingMessage: loading.message,
    loadingState:       loading,
    handleAnalyze,
    enhancePromptWithGPT
  };
};

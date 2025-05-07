
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { authTranslations } from '@/translations/auth';

// Define types for our supported languages
export interface Language {
  id: string;
  name: string;
  native_name: string;
  flag_emoji: string;
}

interface LanguageContextType {
  currentLanguage: string;
  languages: Language[];
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  languages: [],
  setLanguage: async () => {},
  isLoading: true,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch supported languages from the database
  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error fetching languages:', error);
        return;
      }

      setLanguages(data);
    };

    fetchLanguages();
  }, []);

  // Initialize i18next
  useEffect(() => {
    const initI18n = async () => {
      await i18next
        .use(initReactI18next)
        .init({
          resources: {
            en: { translation: { ...authTranslations.en } },
            zh: { translation: { ...authTranslations.zh } },
            es: { translation: { ...authTranslations.es } },
            fr: { translation: { ...authTranslations.fr } },
            de: { translation: { ...authTranslations.de } }
          },
          lng: currentLanguage,
          fallbackLng: 'en',
          interpolation: {
            escapeValue: false
          }
        });
    };

    initI18n();
  }, [currentLanguage]);

  // Fetch user's language preference
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user language:', error);
          return;
        }

        if (data?.preferred_language) {
          setCurrentLanguage(data.preferred_language);
        }
      }
      setIsLoading(false);
    };

    fetchUserLanguage();
  }, [user]);

  const setLanguage = async (lang: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id);

        if (error) throw error;
      }
      
      setCurrentLanguage(lang);
      await i18next.changeLanguage(lang);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      languages,
      setLanguage,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

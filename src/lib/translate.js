// Auto-translation utility using MyMemory API
// Note: Free API, no key required, 1000 words/day limit

// Language code mapping
const LANG_MAP = {
    ru: 'ru',
    kz: 'kk', // Kazakh
    en: 'en',
    es: 'es',
    tr: 'tr'
};

/**
 * Translate text from source language to target language using MyMemory API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (ru, kz, en, es, tr)
 * @param {string} targetLang - Target language code (ru, kz, en, es, tr)
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, sourceLang, targetLang) => {
    if (!text || sourceLang === targetLang) {
        return text;
    }

    const source = LANG_MAP[sourceLang] || sourceLang;
    const target = LANG_MAP[targetLang] || targetLang;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const data = await response.json();

        // Check for valid translation response
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText;
            // MyMemory returns text in uppercase sometimes, normalize it
            if (translated !== translated.toUpperCase()) {
                return translated;
            }
            // If all uppercase, return with first letter uppercase only
            return translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
        }

        console.warn('Translation response not valid:', data);
        return text;
    } catch (error) {
        console.error('Translation error:', error);
        // Return original text on error
        return text;
    }
};

/**
 * Translate text to all supported languages
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @returns {Promise<object>} - Object with translations for all languages
 */
export const translateToAllLanguages = async (text, sourceLang) => {
    const targetLangs = ['ru', 'kz', 'en', 'es', 'tr'].filter(lang => lang !== sourceLang);

    const translations = {
        [sourceLang]: text
    };

    // Translate to all target languages sequentially to avoid rate limits
    for (const targetLang of targetLangs) {
        try {
            const translated = await translateText(text, sourceLang, targetLang);
            translations[targetLang] = translated;
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Failed to translate to ${targetLang}:`, error);
            translations[targetLang] = text; // Fallback to original
        }
    }

    return translations;
};

/**
 * Detect the source language from filled fields
 * @param {object} names - Object with language keys and values
 * @returns {string|null} - Source language code or null if no text found
 */
export const detectSourceLanguage = (names) => {
    // Priority order: ru, en, kz, es, tr
    const priority = ['ru', 'en', 'kz', 'es', 'tr'];

    for (const lang of priority) {
        if (names[lang] && names[lang].trim()) {
            return lang;
        }
    }

    return null;
};

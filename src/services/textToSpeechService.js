// Text-to-Speech Service

// Check if browser supports speech synthesis
const isSpeechSynthesisSupported = 'speechSynthesis' in window;

// Initialize speech synthesis
let synth = null;
let voices = [];

// Initialize the speech synthesis if supported
if (isSpeechSynthesisSupported) {
  synth = window.speechSynthesis;
  
  // Load available voices
  const loadVoices = () => {
    voices = synth.getVoices();
  };
  
  // Chrome loads voices asynchronously
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  
  // Initial load of voices
  loadVoices();
}

// Get preferred voice based on language and quality
const getPreferredVoice = (lang = 'en-US') => {
  if (!isSpeechSynthesisSupported) return null;
  
  // Reload voices if empty
  if (voices.length === 0) {
    voices = synth.getVoices();
  }
  
  // Try to find a high-quality voice for the specified language
  // Prefer Google voices if available
  const googleVoice = voices.find(voice => 
    voice.lang.includes(lang) && voice.name.includes('Google')
  );
  
  if (googleVoice) return googleVoice;
  
  // Fall back to any voice for the specified language
  const langVoice = voices.find(voice => voice.lang.includes(lang));
  if (langVoice) return langVoice;
  
  // Last resort: use the first available voice
  return voices[0];
};

// Speak text
export const speak = (text, options = {}) => {
  if (!isSpeechSynthesisSupported) {
    console.error('Speech synthesis is not supported in this browser.');
    return false;
  }
  
  // Cancel any ongoing speech
  synth.cancel();
  
  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice
  const voice = getPreferredVoice(options.lang);
  if (voice) utterance.voice = voice;
  
  // Set other properties
  utterance.lang = options.lang || 'en-US';
  utterance.pitch = options.pitch || 1;
  utterance.rate = options.rate || 1;
  utterance.volume = options.volume || 1;
  
  // Event handlers
  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;
  
  // Speak
  synth.speak(utterance);
  return true;
};

// Stop speaking
export const stop = () => {
  if (!isSpeechSynthesisSupported) return false;
  synth.cancel();
  return true;
};

// Check if currently speaking
export const isSpeaking = () => {
  if (!isSpeechSynthesisSupported) return false;
  return synth.speaking;
};

// Get available voices
export const getVoices = () => {
  if (!isSpeechSynthesisSupported) return [];
  return synth.getVoices();
};

// Check if speech synthesis is supported
export const isSupported = () => isSpeechSynthesisSupported;

// Export default object
export default {
  speak,
  stop,
  isSpeaking,
  getVoices,
  isSupported
};

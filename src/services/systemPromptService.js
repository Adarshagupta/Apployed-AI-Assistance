/**
 * Service for loading and managing system prompts
 */

import { getCurrentDate } from '../utils/dateUtils';

/**
 * Load the system prompt from a file
 * @param {string} promptPath - Path to the system prompt file
 * @returns {Promise<string>} - The system prompt content
 */
export const loadSystemPrompt = async (promptPath) => {
  try {
    const response = await fetch(promptPath);
    if (!response.ok) {
      throw new Error(`Failed to load system prompt: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading system prompt:', error);
    // Return a fallback system prompt if the file can't be loaded
    return getFallbackSystemPrompt();
  }
};

/**
 * Get a fallback system prompt if the file can't be loaded
 * @returns {string} - A basic system prompt
 */
const getFallbackSystemPrompt = () => {
  return `You are Apployd, an advanced AI assistant.
Knowledge cutoff: 2024-06
Current date: ${getCurrentDate()}

You are helpful, creative, and provide accurate information. If you're unsure about something, you'll admit it rather than making up information.`;
};

/**
 * Process the system prompt by replacing variables and formatting it
 * @param {string} systemPrompt - The raw system prompt content
 * @returns {string} - The processed system prompt
 */
export const processSystemPrompt = (systemPrompt) => {
  // Replace date variables
  const currentDate = getCurrentDate();
  systemPrompt = systemPrompt.replace(/\`Current date: .*?\`/g, `\`Current date: ${currentDate}\``);
  
  return systemPrompt;
};

/**
 * Get the system prompt for the chat interface
 * @param {string} promptPath - Path to the system prompt file (optional)
 * @returns {Promise<string>} - The processed system prompt
 */
export const getSystemPrompt = async (promptPath = '/advance-system-prompt.md') => {
  const rawPrompt = await loadSystemPrompt(promptPath);
  return processSystemPrompt(rawPrompt);
};

/**
 * Extract the core instructions from the system prompt (without tools section)
 * @param {string} systemPrompt - The full system prompt
 * @returns {string} - The core instructions
 */
export const getCoreInstructions = (systemPrompt) => {
  // Extract everything before the "# Tools" section
  const toolsIndex = systemPrompt.indexOf('# Tools');
  if (toolsIndex > 0) {
    return systemPrompt.substring(0, toolsIndex).trim();
  }
  return systemPrompt;
};

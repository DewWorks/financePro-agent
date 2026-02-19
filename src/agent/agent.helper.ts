
import { Logger } from '@nestjs/common';

export class AgentHelper {
    private static readonly logger = new Logger('AgentHelper');

    /**
     * Parses the ADK event stream to find the text response.
     * Handles both ADK v0.3+ 'content' structure and legacy 'model_response'.
     */
    static parseEventExample(event: any): string | null {
        // 1. Check for content in the event (ADK v0.3+ structure)
        const content = event.content;
        if (content && content.parts) {
            const parts = content.parts;
            if (Array.isArray(parts)) {
                const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');
                if (textParts) return textParts;
            }
        }

        // 2. Legacy/Alternative structure check
        if (event.type === 'model_response') {
            const response = event.response;
            if (response && response.content && response.content.parts) {
                const parts = response.content.parts;
                if (Array.isArray(parts)) {
                    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');
                    if (textParts) return textParts;
                }
            }
        }

        return null;
    }

    /**
     * Safely parses a string that might be JSON or Markdown JSON.
     */
    static safeJsonParse(text: string): any {
        const trimmed = text.trim();
        const cleanText = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        if ((cleanText.startsWith('{') && cleanText.endsWith('}')) || (cleanText.startsWith('[') && cleanText.endsWith(']'))) {
            try {
                return JSON.parse(cleanText);
            } catch {
                AgentHelper.logger.warn('Failed to parse JSON response, returning raw text');
            }
        }
        return text;
    }
}

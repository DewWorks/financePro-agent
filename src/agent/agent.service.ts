
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gemini, LlmAgent, InMemoryRunner } from '@google/adk';
import { AnalysisRequestDto, AnalysisResponseDto } from './dto/analysis.dto';
import { ChatRequestDto } from './dto/chat.dto';
import { calculatorTool } from './tools/calculator.tool';
import { Content } from '@google/genai';

@Injectable()
export class AgentService implements OnModuleInit {
    private readonly logger = new Logger(AgentService.name);
    private agent: LlmAgent;
    private model: Gemini;
    private runner: InMemoryRunner;

    // Priority list of models to try
    private readonly MODELS = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-001',
        'gemini-2.0-flash-lite-001',
        'gemini-2.5-pro',
        'gemini-1.5-flash'
    ];
    private currentModelIndex = 0;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.initializeAgent();
    }

    private initializeAgent() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is missing! Agent functionality will be disabled.');
            return;
        }

        // Safety check for index
        if (this.currentModelIndex >= this.MODELS.length) {
            this.currentModelIndex = 0;
        }

        const modelName = this.MODELS[this.currentModelIndex];
        this.logger.log(`Initializing AgentService with model: ${modelName}`);

        try {
            this.model = new Gemini({
                model: modelName,
                apiKey: apiKey,
            });

            this.agent = new LlmAgent({
                name: 'financeExpert',
                model: this.model,
                instruction: `You are a senior financial analyst and expert consultant for FinanceApp.
            Your goal is to provide pragmatic, safe, and personalized financial advice.
            
            PRINCIPLES:
            1. DO NOT JUDGE: Be empathetic but firm about financial goals.
            2. SAFETY FIRST: Never recommend high-risk investments without clear warnings.
            3. GOAL ORIENTED: Always relate current spending to future goals.
            4. ACCURACY: Use the calculator tool for ANY mathematical operation. Do not calculate mentally.
            
            When analyzing data, look for patterns, spending spikes, and opportunities to save.
            Structure your response in JSON format matching the AnalysisResponse schema when requested.`,
                tools: [calculatorTool],
            });

            this.runner = new InMemoryRunner({
                agent: this.agent,
                appName: 'finance-agent',
            });

            this.logger.log(`Agent initialized successfully with ${modelName}`);
        } catch (e) {
            this.logger.error(`Failed to initialize agent with ${modelName}:`, e);
        }
    }

    /*
     * Helper to switch to the next model in the list.
     * Returns true if switch was successful (more models available), false otherwise.
     */
    private switchToNextModel(): boolean {
        if (this.currentModelIndex < this.MODELS.length - 1) {
            this.currentModelIndex++;
            this.logger.warn(`Switching to fallback model: ${this.MODELS[this.currentModelIndex]}`);
            this.initializeAgent();
            return true;
        }
        this.logger.error('All fallback models exhausted.');
        return false;
    }

    async analyze(request: AnalysisRequestDto): Promise<AnalysisResponseDto> {
        const context = JSON.stringify({
            userProfile: request.userProfile,
            financialContext: request.financialContext,
            period: request.period,
        });

        const prompt = `Perform a deep financial analysis for this user.
    Context: ${context}
    
    Output strictly in valid JSON format matching this structure (do not include markdown code blocks):
    {
      "sentiment": "positive" | "warning" | "critical",
      "summary": "string",
      "insights": [{ "type": "spending_spike" | "goal_risk" | "saving_opportunity", "message": "string", "actionableStep": "string" }],
      "forecast": { "endOfMonthBalanceEstimate": number }
    }`;

        // Unique session ID for this analysis request
        const sessionId = `analysis-${Date.now()}`;
        return this.runAgent(sessionId, prompt) as Promise<AnalysisResponseDto>;
    }

    async chat(request: ChatRequestDto): Promise<{ text: string }> {
        const contextSnapshot = request.contextSnapshot ? `Context Snapshot: ${JSON.stringify(request.contextSnapshot)}` : '';
        const message = `${contextSnapshot}\nUser: ${request.message}`;

        const response = await this.runAgent(request.sessionId, message);
        return { text: typeof response === 'string' ? response : JSON.stringify(response) };
    }

    private async runAgent(sessionId: string, prompt: string, retryCount = 0): Promise<any> {
        const modelName = this.MODELS[this.currentModelIndex];
        this.logger.log(`Running agent | Session: ${sessionId} | Model: ${modelName} | Attempt: ${retryCount + 1}`);

        if (!this.runner) {
            // Try to re-init if runner is missing (e.g. startup failed)
            this.initializeAgent();
            if (!this.runner) {
                throw new Error('Agent runner not initialized. Check server logs for startup errors.');
            }
        }

        // Ensure session exists
        try {
            const appName = 'finance-agent';
            const userId = 'user';

            let session = await this.runner.sessionService.getSession({
                appName,
                userId,
                sessionId
            });

            if (!session) {
                this.logger.log(`Creating new session: ${sessionId}`);
                session = await this.runner.sessionService.createSession({
                    appName,
                    userId,
                    sessionId
                });
            }
        } catch (e) {
            this.logger.error(`Error managing session ${sessionId}`, e);
        }

        const newMessage: Content = {
            role: 'user',
            parts: [{ text: prompt }],
        };

        try {
            const iterator = this.runner.runAsync({
                userId: 'user',
                sessionId,
                newMessage,
            });

            let lastText = '';
            let hadError = false;

            // Iterate over the async iterable
            for await (const event of iterator) {
                // Log event types for debugging (verbose)
                this.logger.warn(`Received event: ${JSON.stringify(event)}`);

                // Check for error codes in the event stream (e.g. 404, 429)
                const errorCode = (event as any).errorCode;
                if (errorCode) {
                    this.logger.warn(`Encountered error code ${errorCode} with model ${modelName}`);
                    hadError = true;
                    break; // Stop processing this stream
                }

                if ((event as any).type === 'model_response') {
                    const response = (event as any).response;
                    if (response && response.content && response.content.parts) {
                        const parts = response.content.parts;
                        if (Array.isArray(parts)) {
                            const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');
                            if (textParts) {
                                lastText = textParts;
                            }
                        }
                    }
                }
            }

            if (hadError) {
                if (this.switchToNextModel()) {
                    this.logger.log(`Retrying request with new model...`);
                    return this.runAgent(sessionId, prompt, retryCount + 1);
                } else {
                    throw new Error(`All models failed. Last error with ${modelName}.`);
                }
            }

            if (!lastText) {
                this.logger.warn('Agent execution completed but no text response was captured.');

                if (retryCount < this.MODELS.length && this.switchToNextModel()) {
                    this.logger.warn('Empty response, trying fallback model...');
                    return this.runAgent(sessionId, prompt, retryCount + 1);
                }
                return "I'm sorry, I couldn't generate a response at this time.";
            }

            // Try parsing as JSON if it looks like JSON
            const trimmed = lastText.trim();

            const cleanText = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            if ((cleanText.startsWith('{') && cleanText.endsWith('}')) || (cleanText.startsWith('[') && cleanText.endsWith(']'))) {
                try {
                    return JSON.parse(cleanText);
                } catch {
                    this.logger.warn('Failed to parse JSON response, returning raw text');
                }
            }

            return lastText;

        } catch (e) {
            this.logger.error(`Error running agent with ${modelName}:`, e);

            // If the error catch block is hit (exception thrown), also try fallback
            if (this.switchToNextModel()) {
                this.logger.log(`Exception caught. Retrying request with new model...`);
                return this.runAgent(sessionId, prompt, retryCount + 1);
            }

            throw new Error(`Agent execution failed after retries: ${e.message}`);
        }
    }
}

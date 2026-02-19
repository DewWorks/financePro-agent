
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gemini, LlmAgent, InMemoryRunner } from '@google/adk';
import { AnalysisRequestDto, AnalysisResponseDto } from './dto/analysis.dto';
import { ChatRequestDto } from './dto/chat.dto';
import { calculatorTool } from './tools/calculator.tool';
import { getUserBalanceTool, addTransactionTool, getInvestmentOptionsTool } from './tools/finance.tool';
import { Content } from '@google/genai';
import { AgentHelper } from './agent.helper';

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
                instruction: `You are FinancePro, a connected financial assistant.
            
            CORE RULES:
            1. BE CONCISE. Responses must be short (max 2-3 sentences) unless deeply analyzing.
            2. USE TOOLS. detailed math? Use 'calculator'. Asking about money? Use 'getUserBalance'. Spending? Use 'addTransaction'.
            3. NO LISTS. Do not output bullet points unless explicitly asked.
            4. ACT, DON'T PREACH. If the user says "I spent 50", log it immediately using the tool. Don't ask "did you mean...".
            
            Persona: Professional, direct, efficient.`,
                tools: [calculatorTool, getUserBalanceTool, addTransactionTool, getInvestmentOptionsTool],
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
            this.initializeAgent();
            if (!this.runner) {
                throw new Error('Agent runner not initialized. Check server logs for startup errors.');
            }
        }

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

                // Check for error codes in the event stream
                const errorCode = (event as any).errorCode;
                if (errorCode) {
                    this.logger.warn(`Encountered error code ${errorCode} with model ${modelName}`);
                    hadError = true;
                    break;
                }

                // USE HELPER FOR PARSING
                const parsedText = AgentHelper.parseEventExample(event);
                if (parsedText) {
                    lastText = parsedText;
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

            // USE HELPER FOR JSON PARSING
            return AgentHelper.safeJsonParse(lastText);

        } catch (e) {
            this.logger.error(`Error running agent with ${modelName}:`, e);

            if (this.switchToNextModel()) {
                this.logger.log(`Exception caught. Retrying request with new model...`);
                return this.runAgent(sessionId, prompt, retryCount + 1);
            }

            throw new Error(`Agent execution failed after retries: ${e.message}`);
        }
    }
}

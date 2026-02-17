import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysisRequestDto, AnalysisResponseDto } from './dto/analysis.dto';
import { ChatRequestDto } from './dto/chat.dto';
export declare class AgentService implements OnModuleInit {
    private configService;
    private readonly logger;
    private agent;
    private model;
    private runner;
    private readonly MODELS;
    private currentModelIndex;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private initializeAgent;
    private switchToNextModel;
    analyze(request: AnalysisRequestDto): Promise<AnalysisResponseDto>;
    chat(request: ChatRequestDto): Promise<{
        text: string;
    }>;
    private runAgent;
}

import { AgentService } from './agent.service';
import { AnalysisRequestDto, AnalysisResponseDto } from './dto/analysis.dto';
import { ChatRequestDto } from './dto/chat.dto';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    analyze(request: AnalysisRequestDto): Promise<AnalysisResponseDto>;
    chat(request: ChatRequestDto): Promise<{
        text: string;
    }>;
}

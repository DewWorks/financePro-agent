
import { Controller, Post, Body } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AnalysisRequestDto, AnalysisResponseDto } from './dto/analysis.dto';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post('analyze')
    async analyze(@Body() request: AnalysisRequestDto): Promise<AnalysisResponseDto> {
        return this.agentService.analyze(request);
    }

    @Post('chat')
    async chat(@Body() request: ChatRequestDto): Promise<{ text: string }> {
        return this.agentService.chat(request);
    }
}

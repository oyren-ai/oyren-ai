import type {ChatRequest} from "@/types/AgentRequest.ts";
import type {HandlerResponse} from "@/types/HandlerResponse.ts";
import type {ChatResponse} from "@/types/ChatResponse.ts";
import type {ConversationMessage} from "@/types/ConversationMessage.ts";
import type {ArxivPaperMeta} from "@/capabilities/toolcalling/arxiv/types.ts";
import type {UserIntent} from "@/intent/types.ts";
import {SidecarError} from "@/types/SidecarError.ts";
import {createSystemMessage} from "@/prompts/promptBuilder.ts";
import {extractIntent} from "@/intent/extractIntent.ts";
import {searchArxivWithIntent} from "@/capabilities/toolcalling/arxiv/searchArxiv.ts";
import {paperToMeta} from "@/capabilities/toolcalling/arxiv/types.ts";
import {chatWithLlm} from "@/handlers/chatWithLlm.ts";
import createLlmChatClient from "@/providers/createLlmChatClient.ts";

export async function handleChat(request: ChatRequest): Promise<HandlerResponse<ChatResponse>> {
    const {
        aiProvider,
        model,
        message,
        conversationHistory,
        temperature,
        maxTokens,
        answerMode,
        images,
        files,
        attachedFileNames
    } = request;

    if (!message || !aiProvider || !model) {
        return {
            error: SidecarError.UnknownError({
                message: "Missing required fields: message, aiProvider, or model",
            }),
        };
    }


    const systemMessage: ConversationMessage = createSystemMessage({
        answerMode: answerMode || "short",
        message,
        conversationHistory: conversationHistory || [],
        files,
        attachedFileNames,
    });

    const llmChatClient = createLlmChatClient(aiProvider, model, temperature, maxTokens);

    const userIntent = await extractIntent(llmChatClient, message, conversationHistory || [], files);

    const prefetchedPapers = userIntent.isPaperSearch()
        ? await prefetchPapers(userIntent)
        : []


    const fullHistory = [systemMessage, ...(conversationHistory || [])];

    const result =
        await chatWithLlm(
            llmChatClient,
            aiProvider,
            model,
            message,
            fullHistory,
            images,
            userIntent,
            prefetchedPapers,
            files,
        );

    if (result.error) return {error: result.error};
    return {data: result.data!};
}

async function prefetchPapers(
    intent: UserIntent,
): Promise<ArxivPaperMeta[] | undefined> {

    const searchResult = await searchArxivWithIntent(intent);
    if (searchResult.papers.length > 0) {
        return searchResult.papers.map(paperToMeta);
    }

    return undefined;
}

import React from "react";
import AiChatPanelLayout from "./AiChatPanelLayout";
import { AiChatProvider } from "./context/AiChatContext";
import { useAiChatPanelController } from "./hooks/useAiChatPanelController";

export interface AiChatPanelStatefulProps {
    pdfPath: string | null;
    workspaceId?: string;
    sessionId?: string;
    "data-testid"?: string;
}

const AiChatPanelStateful: React.FC<AiChatPanelStatefulProps> = ({
    pdfPath,
    workspaceId,
    sessionId,
    "data-testid": testId,
}) => {
    const {
        contextValue,
    } = useAiChatPanelController({
        pdfPath,
        workspaceId,
        sessionId,
    });

    return (
        <AiChatProvider value={contextValue}>
            <AiChatPanelLayout data-testid={testId || "ai-chat-panel-content"} />
        </AiChatProvider>
    );
};

export default AiChatPanelStateful;

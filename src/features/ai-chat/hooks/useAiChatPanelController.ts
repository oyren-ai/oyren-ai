import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiContext } from "@/contexts/ApiContext.tsx";
import { workspaceFilesApi } from "@/api/workspaceFilesApi";
import type {
    AnswerMode,
    ChatMessage,
    PendingImage,
    PreviewImage,
} from "../types";
import { MentionedFile, useFileMention } from "./useFileMention";
import { useChatHistory } from "./useChatHistory";
import { useAiChatMessages } from "./chatMessages/useAiChatMessages";
import type { AiProviderKey } from "@/types/aiProviderKey";
import { getDefaultModelFromModels } from "../utils/modelOptions";
import { setActiveProviderKeyId } from "../utils/activeProviderKeyStorage";
import { conversationApi } from "@/api/conversationApi";
import { aiProviderApi } from "@/api/aiProviderApi";
import { toast } from "sonner";
import type { WorkspaceFile } from "@/types/workspace";
import {
    runWorkspacePdfConversion,
    getConversionErrorMessage,
} from "@/features/workspace-management/utils/workspacePdfConversion";
import type { AiChatContextValue } from "../context/AiChatContext";
import { useChatDefaultsLoader } from "./side-effects/useChatDefaultsLoader";
import { useAskAiListener } from "./side-effects/useAskAiListener";
import { useAddImageListener } from "./side-effects/useAddImageListener";
import { useConversationSync } from "./side-effects/useConversationSync";
import { useChatSettingsModal } from "@/contexts/ModalContext";

export interface UseAiChatPanelControllerParams {
    pdfPath: string | null;
    workspaceId?: string;
    sessionId?: string;
}

export interface UseAiChatPanelControllerReturn {
    contextValue: AiChatContextValue;
    temperature: number;
    handleSettingsChange: (settings: {
        providerKey: AiProviderKey;
        temperature: number;
        model?: string;
    }) => void;
}

export function useAiChatPanelController({
    pdfPath,
    workspaceId,
    sessionId,
}: UseAiChatPanelControllerParams): UseAiChatPanelControllerReturn {
    const { hasApiKey } = useApiContext();
    const chatSettingsModal = useChatSettingsModal();

    const {
        selectedProviderKey,
        selectedModel,
        isLoadingDefaults,
        setSelectedProviderKey,
        setSelectedModel,
    } = useChatDefaultsLoader();

    const [temperature, setTemperature] = useState<number>(0.7);

    const apiKey = selectedProviderKey?.key || null;
    const provider = selectedProviderKey?.ai_provider.name || null;

    const [inputValue, setInputValue] = useState("");
    const [answerMode, setAnswerMode] = useState<AnswerMode>("concise");
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(
        new Set(),
    );
    const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
    const [contextFiles, setContextFiles] = useState<MentionedFile[]>([]);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    const [convertingFileId, setConvertingFileId] = useState<string | null>(null);

    const aiChatMessagesOperations = useAiChatMessages({
        apiKey,
        provider,
        selectedModel,
        temperature,
        sessionId,
        pdfPath,
        fetchFileContent: workspaceFilesApi.getWorkspaceFile,
        contextFiles,
    });

    const {
        isLoadingHistory,
        loadChatHistory,
        saveChatHistory,
        startNewChat,
    } = useChatHistory({ sessionId, pdfPath });

    const {
        showMentionPopup,
        mentionFiles,
        selectedFiles,
        mentionSearchQuery,
        onSelectFile,
        onRemoveFile,
        onCloseMentionPopup,
        checkForMention,
        clearSelectedFiles,
    } = useFileMention({
        workspaceId,
        currentPdfPath: pdfPath,
        inputValue,
        onInputChange: setInputValue,
    });

    const { conversationIdRef, resetSyncState, markAllMessagesSynced } = useConversationSync({
        messages: aiChatMessagesOperations.state.messages,
        workspaceId,
        provider,
        selectedModel,
    });

    const tokenTotals = useMemo(() => {
        if (!Array.isArray(aiChatMessagesOperations.state.messages)) {
            return { total: 0, input: 0, output: 0 };
        }

        const result = aiChatMessagesOperations.state.messages.reduce(
            (acc, m) => ({
                total: acc.total + (m.tokenCount || 0),
                input: acc.input + (m.inputTokens || 0),
                output: acc.output + (m.outputTokens || 0),
            }),
            { total: 0, input: 0, output: 0 },
        );

        return result;
    }, [aiChatMessagesOperations.state.messages]);

    const totalTokens = tokenTotals.total;
    const inputTokens = tokenTotals.input || undefined;
    const outputTokens = tokenTotals.output || undefined;

    useEffect(() => {
        // Only load from localStorage if we're not viewing a database conversation
        if (!conversationIdRef.current) {
            loadChatHistory(aiChatMessagesOperations.setMessages);
        }
    }, [loadChatHistory, aiChatMessagesOperations.setMessages]);

    useEffect(() => {
        if (Array.isArray(aiChatMessagesOperations.state.messages)) {
            saveChatHistory(aiChatMessagesOperations.state.messages);
        }
    }, [aiChatMessagesOperations.state.messages, saveChatHistory]);

    useAskAiListener({
        sendMessage: aiChatMessagesOperations.sendMessage,
        answerMode,
    });

    useAddImageListener({ setPendingImages });

    const handleInputChange = useCallback((value: string) => {
        setInputValue(value);
    }, []);

    const handleAnswerModeChange = useCallback((mode: AnswerMode) => {
        setAnswerMode(mode);
    }, []);

    const handleSend = useCallback(() => {
        const trimmedValue = inputValue.trim();
        if (
            !trimmedValue && pendingImages.length === 0 &&
            selectedFiles.length === 0
        ) return;

        const messageFiles = selectedFiles.map((mentionedFile) => ({
            id: mentionedFile.id,
            name: mentionedFile.name,
            path: mentionedFile.path,
        }));

        if (selectedFiles.length > 0) {
            setContextFiles((prev) => {
                // Use Map for O(1) lookups and guaranteed uniqueness
                const fileMap = new Map(prev.map((f) => [f.id, f]));

                // Add new files, overwriting any existing entries with same ID
                selectedFiles.forEach((file) => {
                    fileMap.set(file.id, file);
                });

                return Array.from(fileMap.values());
            });
        }

        void aiChatMessagesOperations.sendMessage({
            messageTextDisplayedInChatBubble: trimmedValue,
            images: pendingImages,
            answerMode,
            files: messageFiles,
        });

        setInputValue("");
        setPendingImages([]);
        clearSelectedFiles();
    }, [
        inputValue,
        pendingImages,
        selectedFiles,
        answerMode,
        aiChatMessagesOperations.sendMessage,
        clearSelectedFiles,
    ]);

    const handleLoadConversation = useCallback(
        async (conversationId: string) => {
            setIsLoadingConversation(true);

            try {
                // Set conversation ID FIRST to prevent localStorage from loading
                conversationIdRef.current = conversationId;

                // Clear current messages
                aiChatMessagesOperations.clearMessages();
                setContextFiles([]);

                const data = await conversationApi.get(conversationId);

                const chatMessages: ChatMessage[] = data.messages.map((
                    msg,
                ) => {
                    // Parse images from JSON string if present
                    let parsedImages: Array<{ data: string; width: number; height: number }> | undefined;
                    if (msg.images) {
                        try {
                            const imageArray = typeof msg.images === 'string'
                                ? JSON.parse(msg.images)
                                : msg.images;
                            parsedImages = imageArray.map((img: { data: string; mime_type: string }) => {
                                // Ensure data has proper data URL format
                                const imageData = img.data.startsWith('data:')
                                    ? img.data
                                    : `data:${img.mime_type};base64,${img.data}`;
                                return {
                                    data: imageData,
                                    width: 800,
                                    height: 600,
                                };
                            });
                            if (parsedImages && parsedImages.length > 0) {
                                console.log(`[LoadConversation] ✅ Parsed ${parsedImages.length} images for ${msg.role} message ${msg.id}, first 20 chars: ${parsedImages[0].data.substring(0, 20)}`);
                            }
                        } catch (error) {
                            console.error('[LoadConversation] ❌ Failed to parse images:', error, msg.images);
                        }
                    }

                    // Parse attached files to files format expected by UI
                    let parsedFiles: Array<{ id: string; name: string; path: string }> | undefined;
                    console.log(`[LoadConversation] 🔍 Checking attached_files for message ${msg.id}:`, msg.attached_files);

                    if (msg.attached_files && msg.attached_files.length > 0) {
                        try {
                            parsedFiles = msg.attached_files.map((file: any) => {
                                const metadata = typeof file.metadata === 'string'
                                    ? JSON.parse(file.metadata)
                                    : file.metadata;

                                const parsed = {
                                    id: file.workspace_file_id || file.id,
                                    name: metadata.filename,
                                    path: metadata.filename,
                                };
                                console.log(`[LoadConversation] 📋 Parsed file:`, parsed);
                                return parsed;
                            });
                            console.log(`[LoadConversation] 📎 Successfully parsed ${parsedFiles.length} files for ${msg.role} message ${msg.id}:`, parsedFiles);
                        } catch (error) {
                            console.error('[LoadConversation] ❌ Failed to parse files:', error, msg.attached_files);
                        }
                    }

                    const chatMsg = {
                        id: msg.id,
                        type: msg.role as "user" | "assistant",
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                        images: parsedImages,
                        files: parsedFiles,
                        inputTokens: msg.input_tokens ?? undefined,
                        outputTokens: msg.output_tokens ?? undefined,
                        tokenCount: (msg.input_tokens ?? 0) + (msg.output_tokens ?? 0) || undefined,
                    };

                    console.log(`[LoadConversation] 🎯 Final chatMsg for ${msg.id}:`, {
                        id: chatMsg.id,
                        type: chatMsg.type,
                        hasFiles: !!chatMsg.files,
                        filesCount: chatMsg.files?.length || 0,
                        files: chatMsg.files
                    });

                    if (parsedImages && parsedImages.length > 0) {
                        console.log(`[LoadConversation] 📸 Message ${msg.id} has ${parsedImages.length} images attached`);
                    }

                    return chatMsg;
                });

                // Load provider keys to find matching provider
                const providerKeys = await aiProviderApi.list();
                const matchingProvider = providerKeys.find(
                    (pk) => pk.ai_provider.name.toLowerCase() === data.conversation.provider.toLowerCase()
                );

                // Update provider and model if found
                if (matchingProvider) {
                    setSelectedProviderKey(matchingProvider);

                    // Check if the saved model exists in the provider's models
                    const modelExists = matchingProvider.models.some(
                        (m) => m.id === data.conversation.model
                    );

                    if (modelExists) {
                        setSelectedModel(data.conversation.model);
                    } else {
                        // Fallback to default model if saved model doesn't exist
                        const defaultModel = getDefaultModelFromModels(matchingProvider.models);
                        if (defaultModel) {
                            setSelectedModel(defaultModel);
                        }
                    }
                }

                console.log(`[LoadConversation] 📤 About to call setMessages with ${chatMessages.length} messages`);
                console.log(`[LoadConversation] 📋 Messages summary:`, chatMessages.map(m => ({
                    id: m.id,
                    type: m.type,
                    filesCount: m.files?.length || 0,
                    hasFiles: !!m.files
                })));

                // Mark synced IMMEDIATELY before setMessages so the flag isn't
                // consumed by the earlier clearMessages() empty-render cycle.
                markAllMessagesSynced();
                aiChatMessagesOperations.setMessages(chatMessages);

                // Log messages after setting to verify they're in state
                setTimeout(() => {
                    console.log(`[LoadConversation] ✅ Messages in state after setMessages:`,
                        aiChatMessagesOperations.state.messages.map(m => ({
                            id: m.id,
                            type: m.type,
                            filesCount: m.files?.length || 0,
                            files: m.files
                        }))
                    );
                }, 100);

                // Extract all unique files from all messages for context panel
                const allFiles: MentionedFile[] = [];
                const seenFileIds = new Set<string>();

                for (const msg of chatMessages) {
                    if (msg.files) {
                        for (const file of msg.files) {
                            if (!seenFileIds.has(file.id)) {
                                seenFileIds.add(file.id);
                                allFiles.push({
                                    id: file.id,
                                    name: file.name,
                                    path: file.path,
                                });
                            }
                        }
                    }
                }

                console.log(`[LoadConversation] 📂 Setting ${allFiles.length} files to context panel`);
                setContextFiles(allFiles);

            } catch (error) {
                console.error("[handleLoadConversation] ❌ Failed to load conversation:", error);
            } finally {
                setIsLoadingConversation(false);
            }
        },
        [aiChatMessagesOperations.setMessages, setSelectedProviderKey, setSelectedModel, markAllMessagesSynced],
    );

    const handleNewChat = useCallback(() => {
        aiChatMessagesOperations.clearMessages();
        setContextFiles([]);
        resetSyncState();
        conversationIdRef.current = null;
        startNewChat();
    }, [aiChatMessagesOperations.clearMessages, startNewChat, resetSyncState]);

    // Listen for conversation deletion events - must be after handleNewChat is defined
    useEffect(() => {
        const handleConversationDeleted = (event: CustomEvent) => {
            const deletedId = event.detail?.conversationId;
            if (deletedId && conversationIdRef.current === deletedId) {
                console.log(`[useAiChatPanelController] 🗑️ Current conversation ${deletedId} was deleted, starting new chat`);
                handleNewChat();
            }
        };

        window.addEventListener('conversation-deleted', handleConversationDeleted as EventListener);
        return () => {
            window.removeEventListener('conversation-deleted', handleConversationDeleted as EventListener);
        };
    }, [handleNewChat]);

    const handleToggleReasoning = useCallback((messageId: string) => {
        setExpandedReasoning((prev) => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    }, []);

    const handleRemoveImage = useCallback((index: number) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleImagePreview = useCallback((
        data: string,
        name: string,
        size: { width: number; height: number },
    ) => {
        setPreviewImage({ data, name, size });
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewImage(null);
    }, []);

    const handleSettingsChange = useCallback((settings: {
        providerKey: AiProviderKey;
        temperature: number;
        model?: string;
    }) => {
        setSelectedProviderKey(settings.providerKey);
        setTemperature(settings.temperature);
        setActiveProviderKeyId(settings.providerKey.id);

        if (settings.model) {
            setSelectedModel(settings.model);
        } else {
            const defaultModel = getDefaultModelFromModels(
                settings.providerKey.models,
            );
            if (defaultModel) {
                setSelectedModel(defaultModel);
            }
        }
    }, [/* dependencies? */]);

    // Update dependencies of handleSettingsChange to be safe, although set functions are stable
    // setSelectedProviderKey, setTemperature, setSelectedModel are from hooks, likely stable or we should include deps if lint complains.
    // The previous code had empty deps array for handleSettingsChange. I will keep it empty but it uses setSelectedProviderKey etc.

    const handleOpenSettings = useCallback(() => {
        chatSettingsModal.open({
            currentTemperature: temperature,
            onSettingsChange: handleSettingsChange,
        });
    }, [chatSettingsModal, temperature, handleSettingsChange]);

    const handleModelChange = useCallback((model: string) => {
        setSelectedModel(model);
    }, []);

    const handleConvertPdfFromMention = useCallback((file: WorkspaceFile) => {
        if (!file.workspace_id || file.file_name.toLowerCase().endsWith(".md")) return;
        setConvertingFileId(file.id);
        runWorkspacePdfConversion(file.workspace_id, file.id)
            .then(() => {
                setConvertingFileId(null);
            })
            .catch((err) => {
                setConvertingFileId(null);
                toast.error(getConversionErrorMessage(err), { id: "conversion-error-chat" });
            });
    }, []);

    const uiState = useMemo(
        () => ({
            inputValue,
            answerMode,
            pendingImages,
            expandedReasoning,
            previewImage,
            showMentionPopup,
            mentionSearchQuery,
            selectedFiles,
            mentionFiles,
            contextFiles,
            convertingFileId,
        }),
        [
            inputValue,
            answerMode,
            pendingImages,
            expandedReasoning,
            previewImage,
            showMentionPopup,
            mentionSearchQuery,
            selectedFiles,
            mentionFiles,
            contextFiles,
            convertingFileId,
        ],
    );

    const chatState = useMemo(
        () => ({
            messages: aiChatMessagesOperations.state.messages,
            isLoading: aiChatMessagesOperations.state.isLoading,
            isLoadingHistory,
            isLoadingConversation,
            aiError: aiChatMessagesOperations.state.aiError,
            hasApiKey,
            totalTokens,
            inputTokens,
            outputTokens,
            pdfPath,
            workspaceId,
        }),
        [
            aiChatMessagesOperations.state.messages,
            aiChatMessagesOperations.state.isLoading,
            aiChatMessagesOperations.state.aiError,
            isLoadingHistory,
            isLoadingConversation,
            hasApiKey,
            totalTokens,
            inputTokens,
            outputTokens,
            pdfPath,
            workspaceId,
        ],
    );

    const modelState = useMemo(
        () => ({
            currentProvider: provider,
            currentModel: selectedModel,
            availableModels: selectedProviderKey?.models ?? [],
        }),
        [provider, selectedModel, selectedProviderKey?.models],
    );

    const actions = useMemo(
        () => ({
            onInputChange: handleInputChange,
            onSend: handleSend,
            onCancelRequest: aiChatMessagesOperations.cancelRequest,
            onNewChat: handleNewChat,
            onLoadConversation: handleLoadConversation,
            onAnswerModeChange: handleAnswerModeChange,
            onToggleReasoning: handleToggleReasoning,
            onRetryUserMessage: aiChatMessagesOperations.retryUserMessage,
            onRetryErrorMessage: aiChatMessagesOperations.retryErrorMessage,
            onRemoveImage: handleRemoveImage,
            onImagePreview: handleImagePreview,
            onClosePreview: handleClosePreview,
            onOpenSettings: handleOpenSettings,
            onModelChange: handleModelChange,
        }),
        [
            handleInputChange,
            handleSend,
            aiChatMessagesOperations.cancelRequest,
            handleNewChat,
            handleLoadConversation,
            handleAnswerModeChange,
            handleToggleReasoning,
            aiChatMessagesOperations.retryUserMessage,
            aiChatMessagesOperations.retryErrorMessage,
            handleRemoveImage,
            handleImagePreview,
            handleClosePreview,
            handleOpenSettings,
            handleModelChange,
        ],
    );

    const mentionActions = useMemo(
        () => ({
            onSelectFile,
            onRemoveFile,
            onCloseMentionPopup,
            onCheckMention: checkForMention,
            onConvertPdfFromMention: handleConvertPdfFromMention,
        }),
        [onSelectFile, onRemoveFile, onCloseMentionPopup, checkForMention, handleConvertPdfFromMention],
    );

    const contextValue = useMemo(
        () => ({
            uiState,
            chatState,
            modelState,
            actions,
            mentionActions,
        }),
        [uiState, chatState, modelState, actions, mentionActions],
    );

    return {
        contextValue,
        temperature,
        handleSettingsChange,
    };
}


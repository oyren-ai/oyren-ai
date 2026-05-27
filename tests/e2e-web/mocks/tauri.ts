import { Page } from '@playwright/test';

export async function setupTauriInternalMocks(page: Page) {
    await page.addInitScript(() => {
        const mockState: {
            workspaces: any[];
            files: any[];
            pdfContent: Uint8Array;
            conversations: any[];
        } = {
            workspaces: [],
            files: [],
            pdfContent: new Uint8Array(0),
            conversations: [],
        };

        (window as any).__MOCK_STATE__ = mockState;

        const extractId = (args: any, key: string) => {
            if (typeof args === 'string') return args;
            if (args && typeof args === 'object') {
                return args[key] || args.id || Object.values(args)[0];
            }
            return args;
        };

        const handlers: Record<string, (args: any) => any> = {
            'login': () => ({
                token: 'mock-jwt-token',
                user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
                refreshTokenLifeTime: 3600,
            }),
            'refresh_token': () => ({
                token: 'mock-refreshed-jwt-token',
                refreshTokenLifeTime: 3600,
            }),
            'list_workspaces': () => mockState.workspaces,
            'list_workspaces_for_display': () => mockState.workspaces,
            'create_workspace': ({ name, description }: any) => {
                const newWs = {
                    id: 'ws-' + Math.random().toString(36).substr(2, 9),
                    name,
                    description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                    is_pinned: false,
                    is_archived: false,
                    is_favourite: false,
                    is_active: true,
                    document_count: 0,
                    chat_count: 0
                };
                // @ts-ignore
                mockState.workspaces.push(newWs);
                // Initialize files for this workspace with a sample PDF
                // @ts-ignore
                mockState.files.push({
                    id: 'file-' + Math.random().toString(36).substr(2, 9),
                    workspace_id: newWs.id,
                    file_path: `/app_data/workspaces/${newWs.id}/sample.pdf`,
                    file_name: 'sample.pdf',
                    added_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                    is_visible: true,
                    is_read_only: false
                });
                return newWs;
            },
            'list_workspace_files': ({ workspaceId }: any) => {
                const files = mockState.files.filter(f => f.workspace_id === workspaceId);
                return files;
            },
            'list_bookmarks_by_file': () => [],
            'list_workspace_notes': () => [],
            'get_workspace_file': ({ fileId }: any) => {
                return mockState.files.find(f => f.id === fileId);
            },
            'delete_workspace_file': ({ workspaceFileId }: any) => {
                const index = mockState.files.findIndex(f => f.id === workspaceFileId);
                if (index > -1) {
                    mockState.files.splice(index, 1);
                }
                return null;
            },
            'rename_workspace_file': ({ workspaceFileId, newFileName }: any) => {
                const file = mockState.files.find(f => f.id === workspaceFileId);
                if (file) {
                    file.file_name = newFileName;
                    // Update path to reflect new name (optional but good for consistency)
                    const dir = file.file_path.substring(0, file.file_path.lastIndexOf('/') + 1);
                    file.file_path = dir + newFileName;
                }
                return null;
            },
            'read_pdf_file': () => new Uint8Array(0),
            'extract_pdf_sync': () => ({
                metadata: { page_count: 1 },
                pages: [{ page_number: 1, text: 'Mock PDF Content', width: 600, height: 800 }],
                success: true,
            }),
            'search_pdf_text_enhanced': ({ query }: any) => {
                if (query.toLowerCase().includes('mock')) {
                    return [{
                        page_number: 1,
                        line_number: 1,
                        context: 'This is some Mock PDF Content for testing.',
                        match_text: 'Mock',
                        start_pos: 13,
                        end_pos: 17,
                        context_start_line: 1
                    }];
                }
                return [];
            },
            'ai_chat': ({ request }: any) => ({
                response: `Mock response to: ${request.message}`,
                usage_metadata: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
            }),
            'create_conversation': (args: any) => {
                const { title, provider, model } = args;
                const workspaceId = extractId(args, 'workspaceId');

                const newConv = {
                    id: 'conv-' + Math.random().toString(36).substr(2, 9),
                    workspace_id: workspaceId,
                    title,
                    provider,
                    model,
                    is_pinned: false,
                    is_archived: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    messages: []
                };
                console.log(`[IPC] create_conversation WS: ${workspaceId}, ID: ${newConv.id}, Title: ${title}`);
                mockState.conversations.push(newConv);
                return newConv;
            },
            'get_conversation': (args: any) => {
                const conversationId = extractId(args, 'conversationId');
                const conv = mockState.conversations.find(c => c.id === conversationId);
                console.log(`[IPC] get_conversation ${conversationId}. Found: ${!!conv}`);
                if (conv) {
                    return {
                        conversation: conv,
                        messages: conv.messages || []
                    };
                } else {
                    return {
                        conversation: {
                            id: conversationId, title: 'New Conversation', messages: [], created_at: new Date().toISOString()
                        },
                        messages: []
                    };
                }
            },
            'list_workspace_conversations': (args: any) => {
                const workspaceId = extractId(args, 'workspaceId');
                const filtered = mockState.conversations.filter(c => c.workspace_id === workspaceId);
                console.log(`[IPC] list_workspace_conversations WS: ${workspaceId}, Found: ${filtered.length}, Total: ${mockState.conversations.length}`);
                return filtered;
            },
            'add_message_to_conversation': ({ conversationId, role, content, images }: any) => {
                const conv = mockState.conversations.find(c => c.id === conversationId);
                if (conv) {
                    const msg = {
                        id: 'msg-' + Math.random().toString(36).substr(2, 9),
                        role,
                        content,
                        images,
                        timestamp: new Date().toISOString()
                    };
                    conv.messages.push(msg);
                    conv.updated_at = new Date().toISOString();
                    return msg;
                }
                return null;
            },
            'save_chat_interaction': ({ conversationId, userMessage, aiResponse }: any) => {
                const conv = mockState.conversations.find(c => c.id === conversationId);
                if (conv) {
                    const uMsg = {
                        id: 'msg-' + Math.random().toString(36).substr(2, 9),
                        role: 'user',
                        content: userMessage,
                        timestamp: new Date().toISOString()
                    };
                    const aMsg = {
                        id: 'msg-' + Math.random().toString(36).substr(2, 9),
                        role: 'assistant',
                        content: aiResponse,
                        timestamp: new Date().toISOString()
                    };
                    conv.messages.push(uMsg, aMsg);
                    conv.updated_at = new Date().toISOString();
                    return [uMsg, aMsg];
                }
                return null;
            },
            'list_ai_provider_keys': () => ([
                {
                    id: 'pk-1',
                    provider_id: 'openai',
                    name: 'My OpenAI',
                    key: 'sk-mock',
                    ai_provider: { id: 'openai', name: 'openai' },
                    models: [
                        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', enabled: true },
                        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', enabled: true }
                    ]
                }
            ]),
            'get_ai_provider_key': ({ id }: any) => ({
                id,
                provider_id: 'openai',
                name: 'My OpenAI',
                key: 'sk-mock',
                ai_provider: { id: 'openai', name: 'openai' },
                models: [
                    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', enabled: true },
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', enabled: true }
                ]
            }),
            'create_ai_provider_key': (args: any) => ({
                id: 'pk-' + Math.random().toString(36).substr(2, 9),
                ...args,
                ai_provider: { id: args.providerId, name: args.providerId },
                models: [{ id: 'mock-model', name: 'Mock Model', provider: args.providerId, enabled: true }]
            }),
            'save_chat_history': () => null,
            'load_chat_history': () => [],
            'plugin:opener|open': () => console.log('Mock: Opened URL'),
            'search_arxiv': () => [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">',
                '<opensearch:totalResults>1</opensearch:totalResults>',
                '<entry>',
                '<id>http://arxiv.org/abs/2401.00001v1</id>',
                '<title>Mock ArXiv Paper on AI</title>',
                '<summary>A mock paper summary for testing.</summary>',
                '<published>2024-01-15T00:00:00Z</published>',
                '<author><name>Author A</name></author>',
                '<author><name>Author B</name></author>',
                '</entry>',
                '</feed>',
            ].join('\n'),
            'download_arxiv_paper': ({ workspaceId }: any) => {
                const fileId = 'file-arxiv-' + Math.random().toString(36).substr(2, 9);
                mockState.files.push({
                    id: fileId, workspace_id: workspaceId,
                    file_path: `/app_data/workspaces/${workspaceId}/arxiv-paper.pdf`,
                    file_name: 'arxiv-paper.pdf', added_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(), is_visible: true, is_read_only: false,
                });
                return fileId;
            },
            'update_workspace': ({ id, name, description }: any) => {
                const ws = mockState.workspaces.find(w => w.id === id);
                if (ws) { ws.name = name; ws.description = description; ws.updated_at = new Date().toISOString(); }
                return ws || null;
            },
            'delete_workspace': ({ id }: any) => {
                const idx = mockState.workspaces.findIndex(w => w.id === id);
                if (idx > -1) mockState.workspaces.splice(idx, 1);
                return null;
            },
            'create_workspace_note': ({ workspaceId, name }: any) => {
                const file = {
                    id: 'note-' + Math.random().toString(36).substr(2, 9),
                    workspace_id: workspaceId, file_path: `/app_data/workspaces/${workspaceId}/${name}.md`,
                    file_name: `${name}.md`, added_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(), is_visible: true, is_read_only: false,
                };
                mockState.files.push(file);
                return file;
            },
            'read_workspace_file': () => '# Mock Note\n\nThis is mock markdown content.',
            'update_workspace_file': () => null,
            'pin_conversation': ({ conversationId }: any) => {
                const conv = mockState.conversations.find(c => c.id === conversationId);
                if (conv) conv.is_pinned = !conv.is_pinned;
                return conv || null;
            },
            'delete_conversation': ({ conversationId }: any) => {
                const idx = mockState.conversations.findIndex(c => c.id === conversationId);
                if (idx > -1) mockState.conversations.splice(idx, 1);
                return null;
            },
            'update_conversation_title': ({ conversationId, title }: any) => {
                const conv = mockState.conversations.find(c => c.id === conversationId);
                if (conv) conv.title = title;
                return conv || null;
            },
            'archive_conversation': ({ conversationId }: any) => {
                const conv = mockState.conversations.find(c => c.id === conversationId);
                if (conv) conv.is_archived = !conv.is_archived;
                return conv || null;
            },
            'delete_ai_provider_key': () => null,
            'update_ai_provider_key': (args: any) => ({
                id: args.id, ...args,
                ai_provider: { id: args.providerId || 'openai', name: args.providerId || 'openai' },
            }),
            'list_ai_provider_models': () => ([
                { id: 'gpt-4', name: 'GPT-4', provider: 'openai', enabled: true },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', enabled: true },
                { id: 'claude-3', name: 'Claude 3', provider: 'anthropic', enabled: false },
            ]),
            'update_ai_provider_model_active': () => null,
            'get_ai_provider_model': ({ id }: any) => ({
                id, name: 'GPT-4', provider: 'openai', enabled: true,
            }),
        };

        const mockInvoke = async (cmd: string, args: any) => {
            console.log(`[IPC] ${cmd}`, JSON.stringify(args));
            if (handlers[cmd]) {
                const result = handlers[cmd](args);
                console.log(`[IPC] Result for ${cmd}:`, JSON.stringify(result));
                return result;
            }
            console.warn(`[IPC] Unhandled command: ${cmd}`);
            return null;
        };

        (window as any).__TAURI__ = {
            core: { invoke: mockInvoke },
            invoke: mockInvoke,
        };

        (window as any).__TAURI_INTERNALS__ = { invoke: mockInvoke };
    });
}

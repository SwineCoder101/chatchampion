type MessageInfo = {
    update_id: number;
    message: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username: string;
            language_code: string;
        };
        chat: {
            id: number;
            title: string;
            type: string;
            all_members_are_administrators: boolean;
        };
        date: number;
        text: string;
    };
  };

class ChatCache {
    private cache: Map<string, MessageInfo[]>;

    constructor() {
        this.cache = new Map();
    }

    // Add a new update to a specific chat channel
    addUpdate(chatId: string, update: MessageInfo): void {
        if (!this.cache.has(chatId)) {
            this.cache.set(chatId, []);
        }
        this.cache.get(chatId)?.push(update);
    }

    formatChatUpdates(updates: MessageInfo[]): string {
        return updates.map(update => `${update.message.from.username}: ${update.message.text}`).join('\n\n\n\n\n');
    }

    // Get updates for a specific chat channel
    getUpdates(chatId: string): string {
        return this.formatChatUpdates(this.cache.get(chatId) || []);
    }

    // Reset (clear) updates for a specific chat channel
    resetChat(chatId: string): void {
        this.cache.set(chatId, []);
    }

    // Clear updates for all chat channels
    resetAllChats(): void {
        this.cache.clear();
    }
}

export default new ChatCache();
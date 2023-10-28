"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChatCache {
    constructor() {
        this.cache = new Map();
    }
    // Add a new update to a specific chat channel
    addUpdate(chatId, update) {
        var _a;
        if (!this.cache.has(chatId)) {
            this.cache.set(chatId, []);
        }
        (_a = this.cache.get(chatId)) === null || _a === void 0 ? void 0 : _a.push(update);
    }
    formatChatUpdates(updates) {
        return updates.map(update => `${update.message.from.username}: ${update.message.text}`).join('\n\n\n\n\n');
    }
    // Get updates for a specific chat channel
    getUpdates(chatId) {
        return this.formatChatUpdates(this.cache.get(chatId) || []);
    }
    // Reset (clear) updates for a specific chat channel
    resetChat(chatId) {
        this.cache.set(chatId, []);
    }
    // Clear updates for all chat channels
    resetAllChats() {
        this.cache.clear();
    }
}
exports.default = new ChatCache();
//# sourceMappingURL=ChatCache.js.map
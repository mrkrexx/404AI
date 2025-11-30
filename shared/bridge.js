// Система коммуникации между агентами без бэкенда
// Использует localStorage для связи между вкладками/окнами

class MessageBridge {
    constructor() {
        this.storageKey = '404ai_messages';
        this.responseKey = '404ai_responses';
        this.modeKey = '404ai_mode';
        this.listeners = new Map();
        
        this.init();
    }
    
    init() {
        // Слушаем изменения в localStorage (связь между агентами)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.handleNewMessages();
            } else if (e.key === this.responseKey) {
                this.handleNewResponses();
            } else if (e.key === this.modeKey) {
                this.handleModeChange();
            }
        });
        
        // Периодическая проверка для тех же вкладок
        setInterval(() => {
            this.checkForUpdates();
        }, 1000);
    }
    
    // Отправка сообщения от публичного агента локальному
    sendMessage(message) {
        const messages = this.getMessages();
        const newMessage = {
            id: Utils.generateId(),
            text: message,
            timestamp: new Date().toISOString(),
            source: 'public-agent',
            read: false
        };
        
        messages.unshift(newMessage);
        this.saveMessages(messages);
        
        console.log('📤 Message sent to local agent:', newMessage);
        
        // Множественные триггеры для гарантии доставки
        try {
            // 1. Storage event для других вкладок
            localStorage.setItem(this.storageKey, JSON.stringify(messages));
            
            // 2. Принудительный storage event
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.storageKey,
                newValue: JSON.stringify(messages),
                oldValue: null
            }));
            
            // 3. Custom event
            window.dispatchEvent(new CustomEvent('newMessage', {
                detail: newMessage
            }));
            
            // 4. Bridge emit
            this.emit('newMessage', newMessage);
            
            // 5. Дополнительная проверка через 100мс
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('newMessage', {
                    detail: newMessage
                }));
            }, 100);
            
        } catch (error) {
            console.error('Error sending message:', error);
        }
        
        return newMessage.id;
    }
    
    // Отправка ответа от локального агента публичному
    sendResponse(messageId, response) {
        const responses = this.getResponses();
        const newResponse = {
            messageId: messageId,
            text: response,
            timestamp: new Date().toISOString(),
            sender: 'operator'
        };
        
        responses.unshift(newResponse);
        this.saveResponses(responses);
        
        // Принудительное обновление localStorage
        localStorage.setItem(this.responseKey, JSON.stringify(responses));
        
        // Удаляем сообщение из очереди
        this.removeMessage(messageId);
        
        // Триггер для публичного агента через storage event
        window.dispatchEvent(new StorageEvent('storage', {
            key: this.responseKey,
            newValue: JSON.stringify(responses),
            oldValue: null
        }));
        
        // Дополнительный триггер через кастомное событие
        window.dispatchEvent(new CustomEvent('newResponse', {
            detail: newResponse
        }));
        
        // Триггер через мост для гарантии доставки
        this.emit('newResponse', newResponse);
        
        console.log('📤 Response sent to public agent:', newResponse);
        return true;
    }
    
    // Получение сообщений
    getMessages() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (e) {
            console.error('Error loading messages:', e);
            return [];
        }
    }
    
    // Сохранение сообщений
    saveMessages(messages) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(messages));
            return true;
        } catch (e) {
            console.error('Error saving messages:', e);
            return false;
        }
    }
    
    // Получение ответов
    getResponses() {
        try {
            return JSON.parse(localStorage.getItem(this.responseKey) || '[]');
        } catch (e) {
            console.error('Error loading responses:', e);
            return [];
        }
    }
    
    // Сохранение ответов
    saveResponses(responses) {
        try {
            localStorage.setItem(this.responseKey, JSON.stringify(responses));
            return true;
        } catch (e) {
            console.error('Error saving responses:', e);
            return false;
        }
    }
    
    // Удаление сообщения
    removeMessage(messageId) {
        const messages = this.getMessages();
        const filtered = messages.filter(msg => msg.id !== messageId);
        this.saveMessages(filtered);
    }
    
    // Отметка сообщения как прочитанного
    markAsRead(messageId) {
        const messages = this.getMessages();
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
            message.read = true;
            this.saveMessages(messages);
        }
    }
    
    // Переключение режима
    setMode(mode) {
        localStorage.setItem(this.modeKey, JSON.stringify({
            mode: mode,
            timestamp: new Date().toISOString()
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: this.modeKey
        }));
    }
    
    getMode() {
        try {
            const data = JSON.parse(localStorage.getItem(this.modeKey) || '{}');
            return data.mode || CONFIG.MODES.MANUAL;
        } catch (e) {
            return CONFIG.MODES.MANUAL;
        }
    }
    
    // Подписка на события
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    // Отписка от событий
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    // Триггер события
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in event callback:', e);
                }
            });
        }
    }
    
    // Обработчики событий
    handleNewMessages() {
        const messages = this.getMessages();
        this.emit('newMessages', messages);
    }
    
    handleNewResponses() {
        const responses = this.getResponses();
        this.emit('newResponses', responses);
    }
    
    handleModeChange() {
        const mode = this.getMode();
        this.emit('modeChange', mode);
    }
    
    // Проверка обновлений
    checkForUpdates() {
        const messages = this.getMessages();
        const responses = this.getResponses();
        const mode = this.getMode();
        
        this.emit('checkMessages', messages);
        this.emit('checkResponses', responses);
        this.emit('checkMode', mode);
    }
    
    // Очистка старых сообщений (старше 24 часов)
    cleanup() {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Очистка сообщений
        const messages = this.getMessages();
        const filteredMessages = messages.filter(msg => 
            new Date(msg.timestamp) > dayAgo
        );
        this.saveMessages(filteredMessages);
        
        // Очистка ответов
        const responses = this.getResponses();
        const filteredResponses = responses.filter(res => 
            new Date(res.timestamp) > dayAgo
        );
        this.saveResponses(filteredResponses);
        
        console.log('Cleanup completed');
    }
    
    // Статистика
    getStats() {
        const messages = this.getMessages();
        const responses = this.getResponses();
        
        return {
            totalMessages: messages.length,
            unreadMessages: messages.filter(msg => !msg.read).length,
            totalResponses: responses.length,
            mode: this.getMode()
        };
    }
}

// Утилиты для работы с мостом
const BridgeUtils = {
    // Создание моста
    createBridge() {
        return new MessageBridge();
    },
    
    // Проверка доступности localStorage
    isLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Fallback для случаев когда localStorage недоступен
    createMemoryBridge() {
        // В памяти мост (работает только в пределах одной вкладки)
        const messages = [];
        const responses = [];
        const listeners = new Map();
        
        return {
            sendMessage: (message) => {
                const newMessage = {
                    id: Utils.generateId(),
                    text: message,
                    timestamp: new Date().toISOString(),
                    source: 'public-agent',
                    read: false
                };
                
                messages.unshift(newMessage);
                return newMessage.id;
            },
            
            getMessages: () => messages,
            
            sendResponse: (messageId, response) => {
                const newResponse = {
                    messageId: messageId,
                    text: response,
                    timestamp: new Date().toISOString(),
                    sender: 'operator'
                };
                
                responses.unshift(newResponse);
                const index = messages.findIndex(msg => msg.id === messageId);
                if (index > -1) {
                    messages.splice(index, 1);
                }
                return true;
            },
            
            getResponses: () => responses,
            
            on: (event, callback) => {
                if (!listeners.has(event)) {
                    listeners.set(event, []);
                }
                listeners.get(event).push(callback);
            },
            
            emit: (event, data) => {
                if (listeners.has(event)) {
                    listeners.get(event).forEach(callback => callback(data));
                }
            }
        };
    },
    
    // Получение экземпляра моста
    getBridge() {
        if (this.isLocalStorageAvailable()) {
            return this.createBridge();
        } else {
            console.warn('localStorage not available, using memory bridge');
            return this.createMemoryBridge();
        }
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessageBridge, BridgeUtils };
} else {
    window.MessageBridge = MessageBridge;
    window.BridgeUtils = BridgeUtils;
}

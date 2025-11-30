// Общая конфигурация для обоих агентов
const CONFIG = {
    // API эндпоинты
    API_ENDPOINTS: {
        PUBLIC_WEBHOOK: 'https://your-webhook-url.com/message',
        LOCAL_SERVER: 'http://localhost:3000',
        FALLBACK_API: 'https://api.example.com/messages'
    },
    
    // Режимы работы
    MODES: {
        MANUAL: 'manual',      // Ручной режим - отвечаете вы
        AUTO: 'auto'          // Авто-режим - рандомные ответы
    },
    
    // Рандомные ответы для авто-режима
    AUTO_RESPONSES: {
        greetings: [
            "Привет! Я немного занят сейчас, но скоро вернусь к тебе.",
            "Здравствуйте! Мои нейросети сейчас в перезагрузке.",
            "Приветствую! Я обрабатываю сложный запрос, подожди немного."
        ],
        redirects: [
            "Интересный вопрос! Может, сначала обсудим погоду?",
            "Хм, давай сменим тему. Как насчет твоего дня?",
            "Это сложная тема. Может, начнем с чего-то попроще?",
            "Я сейчас не готов обсуждать это. Давай поговорим о другом?",
            "Ой, это слишком сложно для меня. Может, что-нибудь полегче?",
            "Интересно, но я бы предпочел обсудить что-то другое.",
            "Это глубокий вопрос! А что ты думаешь о котиках?",
            "Давай оставим это для позже. Хочешь услышать анекдот?",
            "Я сейчас в режиме раздумий. Может, вернемся к этому позже?",
            "Это слишком серьезно! Давай о чем-нибудь веселом?"
        ],
        dont_know: [
            "Я не знаю, но я готов учиться!",
            "Хороший вопрос! Мне нужно время подумать.",
            "Это超出 моих знаний. Давай поищем вместе?",
            "Я не уверен, но могу предположить...",
            "Это сложный вопрос. Нужна помощь эксперта."
        ],
        website_requests: [
            "Я не могу давать ссылки на сайты, но могу помочь с информацией!",
            "Лучше поищи в Google. А я могу помочь с чем-то другим?",
            "Сайты - это не моя сильная сторона. Давай поговорим о чем-то другом?",
            "Я не рекомендую сайты, но могу обсудить тему!",
            "Для сайтов есть поисковики. А я здесь для общения!"
        ],
        default: [
            "Давай сменим тему. Что у тебя нового?",
            "Интересно! А как ты к этому пришел?",
            "Я немного запутался. Давай начнем сначала?",
            "Это требует долгого разговора. У тебя есть время?",
            "Я сейчас не в настроении для таких тем. Извини."
        ]
    },
    
    // Звуки уведомлений
    SOUNDS: {
        NEW_MESSAGE: '/sounds/notification.mp3',
        SEND_MESSAGE: '/sounds/send.mp3',
        ERROR: '/sounds/error.mp3'
    },
    
    // Настройки UI
    UI: {
        ANIMATION_DURATION: 300,
        TYPING_DELAY: 50,
        NOTIFICATION_DURATION: 5000,
        MAX_MESSAGE_LENGTH: 2000,
        AUTO_HIDE_TYPING: 3000
    },
    
    // Хранилище
    STORAGE_KEYS: {
        MODE: 'ai_agent_mode',
        MESSAGES: 'chat_messages',
        SETTINGS: 'user_settings',
        LAST_SEEN: 'last_seen_messages'
    }
};

// Утилиты
const Utils = {
    // Получить рандомный ответ для авто-режима
    getRandomResponse(category = 'default', userMessage = '') {
        const responses = CONFIG.AUTO_RESPONSES[category] || CONFIG.AUTO_RESPONSES.default;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Добавляем персонализацию
        if (userMessage.toLowerCase().includes('сайт') && category === 'default') {
            return this.getRandomResponse('website_requests', userMessage);
        }
        
        return response;
    },
    
    // Определить категорию ответа
    categorizeMessage(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('привет') || msg.includes('здравствуй') || msg.includes('хай')) {
            return 'greetings';
        }
        
        if (msg.includes('сайт') || msg.includes('ссылк') || msg.includes('где купить')) {
            return 'website_requests';
        }
        
        if (msg.includes('не знаешь') || msg.includes('помоги') || msg.includes('как')) {
            return 'dont_know';
        }
        
        return 'redirects';
    },
    
    // Сохранить в localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },
    
    // Загрузить из localStorage
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },
    
    // Воспроизвести звук
    playSound(soundPath) {
        try {
            const audio = new Audio(soundPath);
            audio.play().catch(e => console.log('Sound play error:', e));
        } catch (e) {
            console.log('Sound creation error:', e);
        }
    },
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.UI.NOTIFICATION_DURATION);
    },
    
    // Форматировать время
    formatTime(date = new Date()) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Генерировать ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Utils };
} else {
    window.CONFIG = CONFIG;
    window.Utils = Utils;
}

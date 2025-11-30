// Простой сервер для приема сообщений от публичного агента
// Запускать локально для связи с локальным агентом

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Хранилище сообщений
const messages = [];

// Эндпоинт для приема сообщений от публичного агента
app.post('/webhook/message', (req, res) => {
    const { message, timestamp, source } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    const newMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        text: message,
        timestamp: new Date(timestamp || Date.now()),
        source: source || 'public-agent',
        read: false
    };
    
    messages.unshift(newMessage);
    
    console.log('New message received:', newMessage);
    
    // В реальном приложении здесь можно:
    // 1. Отправить WebSocket сообщение локальному агенту
    // 2. Отправить push уведомление
    // 3. Сохранить в базу данных
    
    res.json({ 
        success: true, 
        messageId: newMessage.id,
        status: 'received'
    });
});

// Эндпоинт для получения сообщений локальным агентом
app.get('/api/messages', (req, res) => {
    res.json({
        messages: messages,
        unreadCount: messages.filter(msg => !msg.read).length
    });
});

// Эндпоинт для отметки сообщения как прочитанного
app.put('/api/messages/:id/read', (req, res) => {
    const messageId = req.params.id;
    const message = messages.find(msg => msg.id === messageId);
    
    if (message) {
        message.read = true;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Message not found' });
    }
});

// Эндпоинт для отправки ответов
app.post('/api/messages/:id/respond', (req, res) => {
    const messageId = req.params.id;
    const { response } = req.body;
    
    const message = messages.find(msg => msg.id === messageId);
    
    if (message) {
        if (!message.responses) {
            message.responses = [];
        }
        
        message.responses.push({
            text: response,
            timestamp: new Date(),
            sender: 'operator'
        });
        
        // Удаляем из очереди
        const index = messages.indexOf(message);
        if (index > -1) {
            messages.splice(index, 1);
        }
        
        console.log('Response sent:', { messageId, response });
        
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Message not found' });
    }
});

// Обслуживание публичного агента
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket для реального времени (опционально)
const http = require('http');
const server = http.createServer(app);

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/message`);
    console.log(`🌐 Public agent: http://localhost:${PORT}`);
});

module.exports = app;

// Система авторизации для локального агента
class AuthSystem {
    constructor() {
        this.storageKey = '404ai_auth';
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Проверяем авторизацию при загрузке
        this.checkAuth();
    }
    
    // Проверка авторизации
    checkAuth() {
        const authData = Utils.loadFromStorage(this.storageKey);
        if (authData && authData.isLoggedIn) {
            this.currentUser = authData.user;
            return true;
        }
        return false;
    }
    
    // Вход в систему
    login(username, password) {
        // Простая проверка (в реальном проекте здесь будет API)
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            const authData = {
                isLoggedIn: true,
                user: {
                    username: user.username,
                    displayName: user.displayName,
                    role: user.role,
                    avatar: user.avatar
                },
                loginTime: new Date().toISOString()
            };
            
            Utils.saveToStorage(this.storageKey, authData);
            this.currentUser = authData.user;
            
            console.log('✅ User logged in:', user.username);
            return { success: true, user: authData.user };
        }
        
        return { success: false, error: 'Неверный логин или пароль' };
    }
    
    // Выход из системы
    logout() {
        Utils.saveToStorage(this.storageKey, { isLoggedIn: false });
        this.currentUser = null;
        console.log('👋 User logged out');
        return true;
    }
    
    // Получение пользователей (в реальном проекте с сервера)
    getUsers() {
        return [
            {
                username: 'admin',
                password: 'admin123',
                displayName: 'Администратор',
                role: 'admin',
                avatar: '👨‍💼'
            },
            {
                username: 'operator',
                password: 'operator123',
                displayName: 'Оператор',
                role: 'operator',
                avatar: '👨‍💻'
            },
            {
                username: 'support',
                password: 'support123',
                displayName: 'Служба поддержки',
                role: 'support',
                avatar: '🎧'
            }
        ];
    }
    
    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Проверка роли
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
    
    // Проверка авторизации
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Обновление профиля
    updateProfile(updates) {
        if (!this.currentUser) return false;
        
        const authData = Utils.loadFromStorage(this.storageKey);
        if (authData && authData.isLoggedIn) {
            authData.user = { ...authData.user, ...updates };
            Utils.saveToStorage(this.storageKey, authData);
            this.currentUser = authData.user;
            return true;
        }
        return false;
    }
    
    // Получение статистики оператора
    getOperatorStats() {
        if (!this.currentUser) return null;
        
        return Utils.loadFromStorage(`404ai_stats_${this.currentUser.username}`, {
            messagesAnswered: 0,
            averageResponseTime: 0,
            sessionsCount: 0,
            lastSession: null
        });
    }
    
    // Обновление статистики
    updateStats(stats) {
        if (!this.currentUser) return false;
        
        const currentStats = this.getOperatorStats();
        const updatedStats = { ...currentStats, ...stats };
        Utils.saveToStorage(`404ai_stats_${this.currentUser.username}`, updatedStats);
        return true;
    }
}

// Глобальный экземпляр
const Auth = new AuthSystem();

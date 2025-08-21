class PFChecker {
    constructor() {
        this.isMonitoring = false;
        this.intervalId = null;
        this.checkInterval = 30; // seconds
        this.apiUrl = 'http://localhost:8080/api/data-bloqueada/mes-ano/11/2025/124/2?codigoSolicitacao=A20251052913';
        
        this.initializeElements();
        this.bindEvents();
        this.updateStatus('Aguardando início do monitoramento', 'inactive');
    }

    initializeElements() {
        this.elements = {
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            statusDot: document.querySelector('.status-dot'),
            lastCheck: document.getElementById('lastCheck'),
            nextCheck: document.getElementById('nextCheck'),
            resultsContent: document.getElementById('resultsContent'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            checkNowBtn: document.getElementById('checkNowBtn'),
            intervalInput: document.getElementById('intervalInput'),
            urlInput: document.getElementById('urlInput')
        };
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startMonitoring());
        this.elements.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.elements.checkNowBtn.addEventListener('click', () => this.checkAvailability());
        
        this.elements.intervalInput.addEventListener('change', (e) => {
            this.checkInterval = parseInt(e.target.value) || 30;
        });
        
        this.elements.urlInput.addEventListener('change', (e) => {
            this.apiUrl = e.target.value;
        });


    }

    updateStatus(text, type = 'active') {
        this.elements.statusText.textContent = text;
        this.elements.statusDot.className = 'status-dot ' + type;
    }

    updateTimestamps() {
        const now = new Date();
        this.elements.lastCheck.textContent = now.toLocaleTimeString('pt-BR');
        
        const nextCheck = new Date(now.getTime() + this.checkInterval * 1000);
        this.elements.nextCheck.textContent = nextCheck.toLocaleTimeString('pt-BR');
    }

    showLoading() {
        this.elements.resultsContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Verificando disponibilidade...</p>
            </div>
        `;
    }

    showError(message) {
        this.elements.resultsContent.innerHTML = `
            <div class="error-message">
                <p>❌ Erro na verificação</p>
                <p>${message}</p>
            </div>
        `;
    }

    showNoAvailability() {
        this.elements.resultsContent.innerHTML = `
            <div class="no-availability">
                <p>⚠️ Todas as datas estão ocupadas</p>
                <p>Nenhuma vaga disponível encontrada no momento.</p>
            </div>
        `;
    }

    showAvailableDates(availableDates) {
        if (availableDates.length === 0) {
            this.showNoAvailability();
            return;
        }

        // Extrair informações do mês
        const monthYear = this.extractMonthYearFromUrl(this.apiUrl);
        let monthInfo = '';
        
        if (monthYear) {
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            monthInfo = ` - ${monthNames[monthYear.month - 1]} ${monthYear.year}`;
        }

        const datesHtml = availableDates.map(date => 
            `<div class="date-item">${date}</div>`
        ).join('');

        this.elements.resultsContent.innerHTML = `
            <div class="available-dates">
                <h4>✅ Datas disponíveis encontradas${monthInfo}:</h4>
                ${datesHtml}
            </div>
        `;
    }

    // Função para obter o número de dias em um mês
    getDaysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }

    // Função para extrair mês e ano da URL da API
    extractMonthYearFromUrl(url) {
        const match = url.match(/mes-ano\/(\d+)\/(\d+)/);
        if (match) {
            return {
                month: parseInt(match[1]),
                year: parseInt(match[2])
            };
        }
        return null;
    }

    // Função para obter a URL direta da API
    getDirectApiUrl() {
        const monthYear = this.extractMonthYearFromUrl(this.apiUrl);
        if (monthYear) {
            return `https://servicos.dpf.gov.br/agenda-publico-rest/api/data-bloqueada/mes-ano/${monthYear.month}/${monthYear.year}/124/2?codigoSolicitacao=A20251052913`;
        }
        return 'https://servicos.dpf.gov.br/agenda-publico-rest/api/data-bloqueada/mes-ano/11/2025/124/2?codigoSolicitacao=A20251052913';
    }



    async checkAvailability() {
        try {
            this.showLoading();
            this.updateStatus('Verificando disponibilidade...', 'active');
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blockedDates = await response.json();
            
            if (!Array.isArray(blockedDates)) {
                throw new Error('Resposta inválida da API');
            }

            // Extrair mês e ano da URL para calcular o número correto de dias
            const monthYear = this.extractMonthYearFromUrl(this.apiUrl);
            let daysInMonth = 31; // padrão
            
            if (monthYear) {
                daysInMonth = this.getDaysInMonth(monthYear.month, monthYear.year);
                console.log(`📅 Mês ${monthYear.month}/${monthYear.year} tem ${daysInMonth} dias`);
            }

            // Encontrar datas disponíveis (1 até o último dia do mês que não estão no array bloqueado)
            const allDates = Array.from({length: daysInMonth}, (_, i) => i + 1);
            const availableDates = allDates.filter(date => !blockedDates.includes(date));

            // Verificar se todas as datas estão ocupadas
            if (blockedDates.length === daysInMonth) {
                this.showNoAvailability();
                this.updateStatus('Todas as datas ocupadas', 'inactive');
            } else {
                this.showAvailableDates(availableDates);
                this.updateStatus(`${availableDates.length} datas disponíveis encontradas!`, 'active');
                
                // Notificação sonora se encontrou vagas
                this.playNotificationSound();
            }

            this.updateTimestamps();
            this.elements.resultsContent.classList.add('updated');
            
            // Remover classe de animação após a animação terminar
            setTimeout(() => {
                this.elements.resultsContent.classList.remove('updated');
            }, 500);

        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            this.showError(`Erro na conexão: ${error.message}`);
            this.updateStatus('Erro na verificação', 'error');
        }
    }

    playNotificationSound() {
        // Criar um beep simples usando Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Não foi possível tocar notificação sonora');
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.checkNowBtn.disabled = true;

        this.updateStatus('Monitoramento ativo', 'active');
        
        // Primeira verificação imediata
        this.checkAvailability();
        
        // Configurar verificação periódica
        this.intervalId = setInterval(() => {
            this.checkAvailability();
        }, this.checkInterval * 1000);

        console.log(`Monitoramento iniciado - verificando a cada ${this.checkInterval} segundos`);
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.checkNowBtn.disabled = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.updateStatus('Monitoramento parado', 'inactive');
        console.log('Monitoramento parado');
    }

    // Método para testar com dados simulados
    testWithMockData() {
        console.log('Testando com dados simulados...');
        
        // Extrair mês e ano da URL atual
        const monthYear = this.extractMonthYearFromUrl(this.apiUrl);
        let daysInMonth = 31; // padrão
        
        if (monthYear) {
            daysInMonth = this.getDaysInMonth(monthYear.month, monthYear.year);
            console.log(`📅 Teste: Mês ${monthYear.month}/${monthYear.year} tem ${daysInMonth} dias`);
        }
        
        // Simular resposta da API com algumas datas bloqueadas (ajustado para o mês atual)
        const mockBlockedDates = [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
        
        const allDates = Array.from({length: daysInMonth}, (_, i) => i + 1);
        const availableDates = allDates.filter(date => !mockBlockedDates.includes(date));
        
        this.showAvailableDates(availableDates);
        this.updateStatus(`${availableDates.length} datas disponíveis (teste)`, 'active');
        this.updateTimestamps();
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const pfChecker = new PFChecker();
    
    // Expor para debug (opcional)
    window.pfChecker = pfChecker;
    
    console.log('PF Checker inicializado com sucesso!');
    console.log('Para testar com dados simulados, execute: pfChecker.testWithMockData()');
});

# PF Checker - Monitor de Vagas

Aplicação web para monitorar a disponibilidade de vagas na Polícia Federal (PF) através da API oficial.

## 🚀 Funcionalidades

- **Monitoramento Automático**: Verifica a disponibilidade de vagas a cada 30 segundos (configurável)
- **Interface Moderna**: Design responsivo e profissional com animações suaves
- **Notificações Sonoras**: Alerta sonoro quando vagas são encontradas
- **Configuração Flexível**: Permite alterar URL da API e intervalo de verificação
- **Status em Tempo Real**: Mostra status atual do monitoramento e próximas verificações

## 📋 Como Funciona

A aplicação faz requisições para a API da PF e analisa as datas bloqueadas retornadas:

- **API Endpoint**: `https://servicos.dpf.gov.br/agenda-publico-rest/api/data-bloqueada/mes-ano/11/2025/124/2?codigoSolicitacao=A20251052913`
- **Resposta**: Array com números dos dias bloqueados (ex: `[1,2,3,6,7,8,9,10,13,14,15,16,20,21,22,23,24,25,26,27,28,29,30]`)
- **Lógica**: Dias que NÃO estão no array = vagas disponíveis

### Exemplo de Análise

Se a API retorna: `[1,2,3,6,7,8,9,10,13,14,15,16,20,21,22,23,24,25,26,27,28,29,30]`

**Datas disponíveis**: 4, 5, 11, 12, 17, 18, 19, 31

## 🛠️ Instalação e Uso

### Método 1: Abrir Diretamente
1. Baixe todos os arquivos do projeto
2. Abra o arquivo `index.html` em qualquer navegador moderno
3. Clique em "Iniciar Monitoramento"

### Método 2: Servidor Local (Recomendado)
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx http-server

# Usando PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

## 🎯 Como Usar

1. **Iniciar Monitoramento**: Clique no botão "Iniciar Monitoramento"
2. **Verificação Manual**: Use "Verificar Agora" para uma verificação única
3. **Parar**: Clique em "Parar Monitoramento" para interromper
4. **Configurar**: Altere o intervalo de verificação e URL da API conforme necessário

## ⚙️ Configurações

### Intervalo de Verificação
- **Padrão**: 30 segundos
- **Mínimo**: 10 segundos
- **Máximo**: 300 segundos (5 minutos)

### URL da API
- **Padrão**: URL configurada para novembro/2025
- **Personalização**: Altere para outros meses/cidades conforme necessário

## 🔧 Estrutura do Projeto

```
PF-checker/
├── index.html          # Interface principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
└── README.md           # Documentação
```

## 🎨 Design

- **Fonte**: Montserrat (Google Fonts)
- **Paleta**: Gradientes azul/roxo
- **Responsivo**: Funciona em desktop e mobile
- **Animações**: Transições suaves e indicadores visuais

## 🚨 Limitações e Considerações

### CORS (Cross-Origin Resource Sharing)
A API da PF pode ter restrições de CORS. Se encontrar erros:

1. **Use um servidor local** (não abra o arquivo diretamente)
2. **Instale uma extensão CORS** no navegador
3. **Configure um proxy** se necessário

### Rate Limiting
- A API pode ter limites de requisições
- Use intervalos maiores se necessário
- Monitore os logs do console para erros

## 🐛 Debug e Testes

### Console do Navegador
Abra o DevTools (F12) para ver logs detalhados.

### Teste com Dados Simulados
No console do navegador, execute:
```javascript
pfChecker.testWithMockData()
```

### Verificar Status
```javascript
console.log(pfChecker.isMonitoring);
console.log(pfChecker.apiUrl);
console.log(pfChecker.checkInterval);
```

## 📱 Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🔒 Privacidade e Segurança

- **Dados**: Nenhum dado é armazenado localmente
- **Rede**: Apenas requisições GET para a API da PF
- **Código**: 100% client-side, sem servidor necessário

## 📞 Suporte

Para problemas ou sugestões:
1. Verifique o console do navegador para erros
2. Teste com dados simulados
3. Verifique a conectividade com a API

## 📄 Licença

Este projeto é de uso livre para fins educacionais e pessoais.

---

**Desenvolvido para facilitar o agendamento na Polícia Federal** 🇧🇷

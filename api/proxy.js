const https = require('https');
const http = require('http');

ж// Функция для Vercel
module.exports = async (req, res) => {
  return handleRequest(req, res);
};

// Функция для Netlify
exports.handler = async (event, context) => {
  const req = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers || {}
  };
  
  const res = {
    status: (code) => ({ statusCode: code }),
    setHeader: (name, value) => {},
    send: (data) => ({ body: data }),
    json: (data) => ({ body: JSON.stringify(data) }),
    end: () => {}
  };
  
  const result = await handleRequest(req, res);
  return result;
};

async function handleRequest(req, res) {
  // Настройка CORS
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    if (res.status) {
      res.status(200).end();
    } else {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }
    return;
  }

  try {
    // Извлекаем путь API из URL
    let apiPath = req.url;
    if (apiPath.startsWith('/api/')) {
      apiPath = apiPath.substring(5);
    }
    
    // Конструируем полный URL для API PF
    const targetUrl = `https://servicos.dpf.gov.br/agenda-publico-rest/api/${apiPath}`;
    
    console.log(`🔄 Proxy request to: ${targetUrl}`);

    // Настройки запроса
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000
    };

    // Выполняем запрос
    return new Promise((resolve, reject) => {
      const request = https.get(targetUrl, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log(`✅ Response received: ${data.length} bytes`);
          
          if (res.status) {
            // Vercel
            res.setHeader('Content-Type', response.headers['content-type'] || 'application/json');
            res.status(response.statusCode).send(data);
          } else {
            // Netlify
            resolve({
              statusCode: response.statusCode,
              headers: {
                'Content-Type': response.headers['content-type'] || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              },
              body: data
            });
          }
        });
      });

      request.on('error', (error) => {
        console.error(`❌ Request error: ${error.message}`);
        const errorResponse = {
          error: true,
          message: `Request error: ${error.message}`
        };
        
        if (res.status) {
          res.status(500).json(errorResponse);
        } else {
          resolve({
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(errorResponse)
          });
        }
      });

      request.on('timeout', () => {
        console.error('❌ Request timeout');
        request.destroy();
        const errorResponse = {
          error: true,
          message: 'Request timeout'
        };
        
        if (res.status) {
          res.status(500).json(errorResponse);
        } else {
          resolve({
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(errorResponse)
          });
        }
      });
    });

  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    const errorResponse = {
      error: true,
      message: `Unexpected error: ${error.message}`
    };
    
    if (res.status) {
      res.status(500).json(errorResponse);
    } else {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
  }
}

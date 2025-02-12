const express = require('express');
const catalog = require('./src/services/catalog');
const deals = require('./src/services/deals');
const glossary = require('./src/services/glossary');
const search = require('./src/services/search');
const top = require('./src/services/top');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ message: 'GSMArena API is running' });
});

app.get('/api/search', async (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ success: false, message: 'O parâmetro "name" é obrigatório.' });
    }
    
    try {
        const devices = await catalog.searchDeviceByName(name);
        if (devices.length === 0) {
            return res.json({ success: false, message: 'Nenhum dispositivo encontrado.' });
        }
        return res.json({ success: true, devices });
    } catch (error) {
        console.error('Erro na busca:', error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;

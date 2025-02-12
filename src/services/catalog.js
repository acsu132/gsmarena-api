const cheerio = require('cheerio');
const { getDataFromUrl } = require('./utils');

const getBrands = async () => {
    const html = await getDataFromUrl('/makers.php3');

    const $ = cheerio.load(html);
    const json = [];
    const brands = $('table').find('td');

    brands.each((i, el) => {
        const aBlock = $(el).find('a');
        json.push({
            id: aBlock.attr('href').replace('.php', ''),
            name: aBlock.text().replace(' devices', '').replace(/[0-9]/g, ''),
            devices: parseInt($(el).find('span').text().replace(' devices', ''), 10),
        });
    });

    return json;
};

const getNextPage = ($) => {
    const nextPage = $('a.prevnextbutton[title="Next page"]').attr('href');
    if (nextPage) {
        return nextPage.replace('.php', '');
    }
    return false;
};

const getDevices = ($, devicesList) => {
    const devices = [];
    devicesList.each((i, el) => {
        const imgBlock = $(el).find('img');
        devices.push({
            id: $(el).find('a').attr('href').replace('.php', ''),
            name: $(el).find('span').text(),
            img: imgBlock.attr('src'),
            description: imgBlock.attr('title'),
        });
    });

    return devices;
};

const getBrand = async (brand) => {
    let html = await getDataFromUrl(`/${brand}.php`);

    let $ = cheerio.load(html);
    let json = [];

    let devices = getDevices($, $('.makers').find('li'));
    json = [...json, ...devices];

    while (getNextPage($)) {
        html = await getDataFromUrl(`/${getNextPage($)}.php`);
        $ = cheerio.load(html);
        devices = getDevices($, $('.makers').find('li'));
        json = [...json, ...devices];
    }

    return json;
};

const getDevice = async (device) => {
    const html = await getDataFromUrl(`/${device}.php`);
    const $ = cheerio.load(html);

    const displaySize = $('span[data-spec=displaysize-hl]').text();
    const displayRes = $('div[data-spec=displayres-hl]').text();
    const cameraPixels = $('.accent-camera').text();
    const videoPixels = $('div[data-spec=videopixels-hl]').text();
    const ramSize = $('.accent-expansion').text();
    const chipset = $('div[data-spec=chipset-hl]').text();
    const batterySize = $('.accent-battery').text();
    const batteryType = $('div[data-spec=battype-hl]').text();

    const quickSpec = [];
    quickSpec.push({ name: 'Display size', value: displaySize });
    quickSpec.push({ name: 'Display resolution', value: displayRes });
    quickSpec.push({ name: 'Camera pixels', value: cameraPixels });
    quickSpec.push({ name: 'Video pixels', value: videoPixels });
    quickSpec.push({ name: 'RAM size', value: ramSize });
    quickSpec.push({ name: 'Chipset', value: chipset });
    quickSpec.push({ name: 'Battery size', value: batterySize });
    quickSpec.push({ name: 'Battery type', value: batteryType });

    const name = $('.specs-phone-name-title').text();
    const img = $('.specs-photo-main a img').attr('src');

    const specNode = $('table');
    const detailSpec = [];

    specNode.each((i, el) => {
        const specList = [];
        const category = $(el).find('th').text();
        const specN = $(el).find('tr');

        specN.each((index, ele) => {
            specList.push({
                name: $('td.ttl', ele).text(),
                value: $('td.nfo', ele).text(),
            });
        });
        if (category) {
            detailSpec.push({
                category,
                specifications: specList,
            });
        }
    });

    return {
        name,
        img,
        detailSpec,
        quickSpec,
    };
};


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let cache = { brands: null, devices: {}, timestamp: 0 };
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

const searchDeviceByName = async (deviceName) => {
    const now = Date.now();

    // Se já temos os dados em cache e ainda são válidos, usamos o cache
    if (cache.brands && (now - cache.timestamp < CACHE_DURATION)) {
        console.log("Usando cache para evitar requisições desnecessárias.");
        return filterDevicesFromCache(deviceName);
    }

    console.log("Buscando marcas para atualizar cache...");
    const brands = await getBrands();
    let foundDevices = [];

    for (const brand of brands) {
        console.log(`Buscando dispositivos da marca: ${brand.name}`);

        // Evita buscar dispositivos da mesma marca repetidamente
        if (!cache.devices[brand.id]) {
            await delay(6000); // Aguardar 6 segundos entre cada requisição para evitar bloqueio
            try {
                const brandHtml = await getDataFromUrl(`/${brand.id}.php`);
                const $ = cheerio.load(brandHtml);

                cache.devices[brand.id] = $('div.makers a').map((i, el) => ({
                    id: $(el).attr('href').replace('.php', ''),
                    name: $(el).find('span').text(),
                    img: $(el).find('img').attr('src'),
                    brand: brand.name
                })).get();
            } catch (error) {
                console.warn(`Erro ao buscar dispositivos de ${brand.name}:`, error.message);
            }
        }

        // Filtrar os dispositivos que correspondem ao nome buscado
        foundDevices = foundDevices.concat(
            cache.devices[brand.id].filter(device =>
                device.name.toLowerCase().includes(deviceName.toLowerCase())
            )
        );

        // Se já encontramos dispositivos suficientes, paramos a busca
        if (foundDevices.length > 5) break;
    }

    // Atualiza o cache
    cache.brands = brands;
    cache.timestamp = Date.now();

    return foundDevices;
};

const filterDevicesFromCache = (deviceName) => {
    let results = [];
    for (const brand in cache.devices) {
        results = results.concat(
            cache.devices[brand].filter(device =>
                device.name.toLowerCase().includes(deviceName.toLowerCase())
            )
        );
    }
    return results;
};

module.exports = { 
    getBrands, 
    getBrand, 
    getDevice, 
    searchDeviceByName 
};

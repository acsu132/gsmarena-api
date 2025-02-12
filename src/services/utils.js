exports.getDataFromUrl = async (url) => {
    const html = await axios({
        method: 'get',
        url: `https://www.gsmarena.com${url}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/'
        }
    });

    return html.data;
};


exports.getPrice = (text) => {
    const value = text.replace(',', '').split(' ');
    return {
        currency: value[0],
        price: parseFloat(value[1]),
    };
};

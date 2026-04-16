
const https = require('https');

const key = "AIzaSyBeXSAJzyC0cqaSejrq8Vk7jQFbpyV08xc";
const data = JSON.stringify({
    contents: [{ parts: [{ text: "Hello, say 'Gemini is Integrated!'" }] }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let response = '';
    res.on('data', (d) => { response += d; });
    res.on('end', () => {
        console.log(response);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();

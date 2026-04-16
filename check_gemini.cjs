
const https = require('https');

const key = "AIzaSyBRmQetvLD99tBWRaib4HOWnpbPj-rM2WY";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                json.models.forEach(m => {
                    if (m.name.includes('gemini')) {
                        console.log(m.name);
                    }
                });
            } else {
                console.log("Response:", data);
            }
        } catch (e) {
            console.error("JSON Parse Error:", e.message);
            console.log("Raw Data:", data);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e.message);
});

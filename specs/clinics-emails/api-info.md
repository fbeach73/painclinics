import Api from 'website-contacts-extractor';

async function main() {
    // Create an instance of the API with your API key
    const api = new Api({
        apiKey: 'ok_1eec1cee5033fdcd1d8bfd4258a93c19',
        createResponseFiles: true, // Optional: saves responses to files for debugging, remove this in production.
    });
    const contacts = await api.getContacts('https://www.example.com/');
}

main();
const axios = require('axios');
const Dalle2Token = require('./env.js');

async function generateAIPhoto(prompt) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                prompt: prompt,
                size: "256x256",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Dalle2Token}`,
                },
                responseType: "arraybuffer",
            }
        );

        if (response.status === 200) {
            console.log("response.status === 200");

            const jsonString = response.data.toString();
            const parsedJson = JSON.parse(jsonString);
            const url = parsedJson.data[0].url;
            return url;
        }
    } catch (error) {
        console.log("Failed to generate image");
        console.error(`Failed to generate image: ${error.message}`);
        throw error;
    }
}

module.exports = {
    generateAIPhoto
};

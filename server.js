const express = require('express')
const socket = require('socket.io'); //requires socket.io module
const axios = require("axios");
const Jimp = require('jimp');

const app = express()
const admin = require("firebase-admin")
const credentials = require("./serviceAccountKey.json")
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});
const db = admin.firestore()

const PORT = process.env.PORT || 8080



let itemStringToFile = new Map();
itemStringToFile.set('t-shirt-grey', 'itemsDir/t-shirt-grey.png');
itemStringToFile.set('hat-white', 'itemsDir/hat-white.jpg');
let itemStringToXY = new Map();
itemStringToXY.set('t-shirt-grey', [300,300]);
itemStringToXY.set('hat-white', [350,300]);

function generateUniqueId() {
    const timestamp = new Date().getTime().toString();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    return timestamp + '_' + uniqueId;
}

const getCounter = (() => {
    let counter = 0;
    return () => {
        counter++;
        return counter;
    };

})();

const Dalle2Token = require('./env.js');

async function generateCombineImage(prompt, itemString,image1Path, x, y) {
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


            const jsonString = response.data.toString()
            const parsedJson = JSON.parse(jsonString);
            const url = parsedJson.data[0].url;

            const loadedImages = await Promise.all([Jimp.read(image1Path), Jimp.read(url)]);
            const baseImage = loadedImages[0];
            const topImage = loadedImages[1];

            // topImage.resize(500, 500);
            baseImage.composite(topImage, x, y);
            // const now = new Date();
            // const i = getCounter()
            const id = generateUniqueId()
            const outputFileName = "imageOutput/" +itemString+ id.toString() + ".jpg"

            await baseImage.writeAsync(outputFileName);
            console.log("generateCombineImage done")
        }
    } catch (error) {
        console.error(`Failed to generate image: ${error.message}`);
    }
}

// how to use - http://localhost:8080/generatedImage?prompt=fire ball&itemString=t-shirt
app.get("/generatedImage", async (req, res) => {
    try {
        console.log("/generatedImage")
        const prompt = req.query.prompt;
        const itemString = req.query.itemString;
        const s = "/generatedImage\n"+prompt+itemString
        console.log(s)
        const filePath = itemStringToFile.get(itemString)
        await generateCombineImage(prompt, itemString, filePath, itemStringToXY.get(itemString)[0], itemStringToXY.get(itemString)[1])
        res.send(s)
    } catch (error) {
        res.send(error)
    }
})


//
// how to use - http://localhost:8080/read/UserDesign/down or up
app.get("/read/UserDesign/:Bid", async (req, res) => {
    let filterdResArr;
    try {
        console.log("enter /read/Users Design filter")
        const UsersDesignRef = db.collection("User Design")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
            if (item["Order State"] === "false") {
                filterdResArr.push(item)
            }
        })
        if (req.params.Bid === "down") {
            filterdResArr.sort(compareBid)
        } else {
            filterdResArr.sort(function (a, b) {
                return -compareBid(a, b)
            })
        }

        res.send(filterdResArr);

    } catch (error) {
        res.send(error)
    }
})
// how to use - http://localhost:8080/read/UserExistenceDesign/down or up
app.get("/read/UserExistenceDesign/:Price", async (req, res) => {
    let filterdResArr;
    try {
        console.log("enter /read/Users UserExistenceDesign filter")
        const UsersDesignRef = db.collection("Supplier Uploads")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
                filterdResArr.push(item)
        })
        if (req.params.Price === "down") {
            filterdResArr.sort(comparePrice)
        } else {
            filterdResArr.sort(function (a, b) {
                return -comparePrice(a, b)
            })
        }

        res.send(filterdResArr);

    } catch (error) {
        res.send(error)
    }
})


//
app.post('/update/:id/:suject', async (req, res) => {
    try {
        const response = await db.collection("User Design").doc(req.params.id).update({
            subject: req.params.suject
        })
        res.send(response)
    } catch (error) {
        res.send(error)
    }
})

app.get("/read/UserDesign/:subject", async (req, res) => {
    let filterdResArr;
    try {
        console.log("enter /read/Users Design filter")
        const UsersDesignRef = db.collection("User Design")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
            if (item["Order State"] === "false") {
                if (item["subject"] === req.params.subject) {
                    filterdResArr.push(item)
                }
            }
        })

        res.send(filterdResArr);

    } catch (error) {
        res.send(error)
    }
})

function compareBid(a, b) {
    const ia = parseInt(a["Bid"])
    const ib = parseInt(b["Bid"])
    if (ib > ia) {
        return -1
    } else {
        if (ia > ib) {
            return 1
        } else {
            return 0
        }
    }

}

function comparePrice(a, b) {
    const ia = parseInt(a["Price"])
    const ib = parseInt(b["Price"])
    if (ib > ia) {
        return -1
    } else {
        if (ia > ib) {
            return 1
        } else {
            return 0
        }
    }
}

app.get("/read/Users", async (req, res) => {
    try {
        console.log("enter /read/Users")
        const usersRef = db.collection("Users")
        const response = await usersRef.get()
        let responseArr = []
        response.forEach(doc => {
            responseArr.push(doc.data())
        });
        res.send(responseArr);

    } catch (error) {
        res.send(error)
    }
})


function indexToSubjectName(index) {
    if (index === 0){
        return "pants"
    }
    if (index === 1){
        return "mobile"
    }
    if (index === 2){
        return "notebooks"
    }
    if (index === 3){
        return "office_supplies"
    }
    if (index === 4){
        return "hats"
    }
    if (index === 5){
        return "games"
    }
    if (index === 6){
        return "clothing"
    }
    if (index === 7){
        return "puzzles"
    }
    if (index === 8){
        return "toys"
    }
    return ""
}

app.get("/read/UserDesign/filter/:arr", async (req, res) => {
    let filterdResArr;
    let str = req.params.arr
    let filterArr = str.split(",");
    console.log(filterArr)

    try {
        // mSelectedOptions[0] = checkbox_pants.isChecked();
        // mSelectedOptions[1] = checkbox_mobile.isChecked();
        // mSelectedOptions[2] = checkbox_notebooks.isChecked();
        // mSelectedOptions[3] = checkbox_office_supplies.isChecked();
        // mSelectedOptions[4] = checkbox_hats.isChecked();
        // mSelectedOptions[5] = checkbox_games.isChecked();
        // mSelectedOptions[6] = checkbox_clothing.isChecked();
        // mSelectedOptions[7] = checkbox_puzzles.isChecked();
        // mSelectedOptions[8] = checkbox_toys.isChecked();
        // int low =0;
        // int high =0;
        // 1 for low to high 0 for high to low
        // console.log("enter /read/Users Design filter" + filterArr)
        console.log("enter /read/Users Design filter")
        const UsersDesignRef = db.collection("User Design")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
            if (item["Order State"] === "false") {
                if(filterItems(filterArr,item,"Bid")){
                    filterdResArr.push(item)
                }
            }
        })
        if (parseInt(filterArr[11]) === 1) {
            filterdResArr.sort(compareBid)
        } else {
            filterdResArr.sort(function (a, b) {
                return -compareBid(a, b)
            })
        }
        res.send(filterdResArr);
        // console.log(filterArr)

    } catch (error) {
        res.send(error)
    }
})


app.get("/read/UserExistenceDesign/filter/:", async (req, res) => {
    let filterdResArr;
    let str = req.params.arr
    let filterArr = str.split(",");
    console.log(filterArr)
    try {
        // mSelectedOptions[0] = checkbox_pants.isChecked();
        // mSelectedOptions[1] = checkbox_mobile.isChecked();
        // mSelectedOptions[2] = checkbox_notebooks.isChecked();
        // mSelectedOptions[3] = checkbox_office_supplies.isChecked();
        // mSelectedOptions[4] = checkbox_hats.isChecked();
        // mSelectedOptions[5] = checkbox_games.isChecked();
        // mSelectedOptions[6] = checkbox_clothing.isChecked();
        // mSelectedOptions[7] = checkbox_puzzles.isChecked();
        // mSelectedOptions[8] = checkbox_toys.isChecked();
        // int low =0;
        // int high =0;
        // 1 for low to high 0 for high to low
        // console.log("enter /read/Users Design filter" + filterArr)
        console.log("enter /read/UserExistenceDesign filter")
        const UsersDesignRef = db.collection("Supplier Uploads")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {//subject  clothing
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
                if(filterItems(filterArr,item,"Price")){
                    filterdResArr.push(item)
                }
        })

        if (parseInt(filterArr[11]) === 1) {
            filterdResArr.sort(comparePrice)
        } else {
            filterdResArr.sort(function (a, b) {
                return -comparePrice(a, b)
            })
        }
        res.send(filterdResArr);
        // console.log(filterArr)

    } catch (error) {
        res.send(error)
    }
})

function filterItems(filterArr, item,BidOrPrice) {
    for (let i = 0; i < filterArr.length - 3; i++) {
        if (filterArr[i] === "1" ||filterArr[i] === " 1" ) {
            if (item["subject"] === indexToSubjectName(i) ){
                if (item[BidOrPrice] >= Number.parseInt(filterArr[9].match(/\d+/)[0])) {
                    if (item[BidOrPrice] <= Number.parseInt(filterArr[10].match(/\d+/)[0])) {
                        return true;
                    }
                }
            }
        }
    }
return false;
}





const server = app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

const io = socket(server);

let count = 0;


//Socket.io Connection------------------
io.on('connection', (socket) => {

    console.log("New socket connection: " + socket.id)

    socket.on('counter', () => {
        count++;
        console.log(count)
        io.emit('counter', count);
    })
})

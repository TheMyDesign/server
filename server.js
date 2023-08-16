const express = require('express')
const socket = require('socket.io'); //requires socket.io module
const axios = require("axios");
const Jimp = require('jimp');
const bodyParser = require('body-parser');
const uuid = require('uuid-v4');
const {Storage} = require('@google-cloud/storage');

const app = express()
app.use(bodyParser.json());

const admin = require("firebase-admin")
const credentials = require("./serviceAccountKey.json")
admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket: 'mydesign-cf41a.appspot.com'
});
const db = admin.firestore()

const PORT = process.env.PORT || 8080

app.use(bodyParser.json());





const aiGenerator = require("./aiGenerator");
const imageCombiner = require("./imageCombiner");
const firebaseModule = require("./firebaseModule");


// how to use - http://10.0.2.2:8080/confirmOrderReceived
app.post("/confirmOrderReceived", async (req, res) => {
    try {
        console.log("/confirmOrderReceived")
        const collection = "UsersOrders"
        const documentId = req.body.orderItemId;
        const updateData =
            {
                receivedOrder: "yes"
            };
        await firebaseModule.updateDocument(collection, documentId, updateData, db)

        res.status(200).json({message: 'Order conformation Received successfully'});
    } catch (error) {
        res.send(error)
    }
})

// how to use - http://localhost:8080/yourOwnOngoingOrders?userId=
app.get("/yourOwnOngoingOrders", async (req, res) => {
    let filteredResArr;
    try {
        const uid = req.query.userId;
        console.log("/yourOwnOngoingOrders")
        let responseArr = await firebaseModule.getDocList("UsersOrders", db, uid)

        filteredResArr = []
        responseArr.forEach(item => {
            if (item["userId"] === uid) {
                if (item.hasOwnProperty("receivedOrder") && item["receivedOrder"] === "yes") {

                } else {
                    filteredResArr.push(item)
                }
                // console.log(JSON.stringify(item, null, 2))
            }
        })
        let collectionName = "Users/" + uid + "/Orders"
        responseArr = await firebaseModule.getDocList(collectionName, db, "")
        responseArr.forEach(item => {
            if (item.hasOwnProperty("receivedOrder") && item["receivedOrder"] === "yes") {
            } else {
                filteredResArr.push(item)
                // console.log(JSON.stringify(item, null, 2))
            }
        })
        collectionName = "Admins/" + uid + "/Order"
        let responseArr2 = await firebaseModule.getDocList(collectionName, db, "")
        responseArr2.forEach(item => {
            console.log(JSON.stringify(item, null, 2))
            if (item.hasOwnProperty("receivedOrder") && item["receivedOrder"] === "yes") {
            } else {
                filteredResArr.push(item)
            }
        })
        console.log(filteredResArr.length)
        res.send(filteredResArr);
    } catch (error) {
        res.send(error)
    }
})


// how to use - http://10.0.2.2:8080/AddOrder
app.post("/PlaceOrder", async (req, res) => {
    try {
        console.log("/PlaceOrder")
        const designItemId = req.body.designItemId;
        const itemPrice = req.body.itemPrice;

        const doc = await firebaseModule.getDocumentById("/UserExistingDesign", designItemId)
        console.log(doc)

        await firebaseModule.PalaceOrderToFirebase(doc, itemPrice, admin)

        res.status(200).json({message: 'Order placed successfully'});
    } catch (error) {
        res.send(error)
    }
})


// how to use - http://localhost:8080/yourOwnExistingDesign?userId=
app.get("/yourOwnExistingDesign", async (req, res) => {
    let filteredResArr;
    try {
        const uid = req.query.userId;
        console.log("/yourOwnExistingDesign")
        const UserExistingDesignRef = db.collection("UserExistingDesign")
        const response = await UserExistingDesignRef.get()
        let responseArr = []
        response.forEach(doc => {
            // responseArr.push(doc.data())
            const itemData = doc.data();
            const itemId = doc.id; // Get the document ID as the item ID
            responseArr.push({itemId, ...itemData}); // Include itemId in the response
        });
        filteredResArr = []
        responseArr.forEach(item => {
            if (item["userId"] === uid) {
                filteredResArr.push(item)
            }
        })
        res.send(filteredResArr);
    } catch (error) {
        res.send(error)
    }
})

// how to use - http://10.0.2.2:8080/yourOwnExistingDesing
app.post("/generatedNewImage", async (req, res) => {
    try {
        console.log("/generatedNewImage")

        const receivedData = req.body;
        console.log('Received JSON:', receivedData);
        const clothingKind = receivedData.clothingKind;
        const prompt = receivedData.customText;
        const userId = receivedData.userId;

        const itemString = clothingKind

        const aiPhotoUrl = await aiGenerator.generateAIPhoto(prompt);
        console.log("url = " + aiPhotoUrl)

        // Use imageCombiner module to combine images
        const baseImagePath = itemStringToFile.get(itemString);
        const x = itemStringToXY.get(itemString)[0];
        const y = itemStringToXY.get(itemString)[1];
        const outputFileName = generateUniqueId(clothingKind, userId);

        await imageCombiner.combineImages(baseImagePath, aiPhotoUrl, x, y, outputFileName);

        const imageUrl = await firebaseModule.uploadImageAndSaveToFirestore(userId, outputFileName, receivedData, admin);

        res.status(200).json({message: 'JSON data received successfully', imageUrl: imageUrl});
        res.send()

    } catch (error) {
        res.send(error)
    }
})


// how to use - http://localhost:8080/uploadPhoto
app.post("/uploadPhoto", async (req, res) => {
    await uploadFile("imageOutput/hat-white1683017516837_snzfztp4s.jpg")
    res.status(200).json({message: 'uploadPhoto successfully'});
    res.send()
})

async function uploadFile(filename) {

    const bucket = admin.storage().bucket();
    const destinationFileName = "user_existing_design/" + filename; // Replace yourDesiredFileName with the desired file name
    await bucket.upload(filename, {
        destination: destinationFileName,
        metadata: {
            cacheControl: "public, max-age=315360000",
            contentType: "image/jpg"
        }
    });

}


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
//http://10.0.2.2:8080/
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

//http://10.0.2.2:8080/
// how to use - http://localhost:8080/generateAIPhotoTest/"prompt"
app.get("/generateAIPhotoTest/:prompt", async (req, res) => {
    try {
        const prompt = req.params.prompt
        console.log("prompt = ", prompt)
        const imageUrl = await aiGenerator.generateAIPhoto(prompt)
        res.send(imageUrl);
    } catch (error) {
        res.send(error)
    }
})

function generateUniqueId(clothingKind, userId = "") {
    const timestamp = new Date().getTime().toString();
    // const uniqueId = Math.random().toString(36).substr(2, 9);
    return "imageOutput/" + clothingKind + "_" + userId + '_' + timestamp + ".jpg";
}

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
    if (index === 0) {
        return "pants"
    }
    if (index === 1) {
        return "mobile"
    }
    if (index === 2) {
        return "notebooks"
    }
    if (index === 3) {
        return "office_supplies"
    }
    if (index === 4) {
        return "hats"
    }
    if (index === 5) {
        return "games"
    }
    if (index === 6) {
        return "clothing"
    }
    if (index === 7) {
        return "puzzles"
    }
    if (index === 8) {
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
                if (filterItems(filterArr, item, "Bid")) {
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

        console.log("enter /read/UserExistenceDesign filter")
        const UsersDesignRef = db.collection("Supplier Uploads")
        const response = await UsersDesignRef.get()
        let responseArr = []
        response.forEach(doc => {//subject  clothing
            responseArr.push(doc.data())
        });
        filterdResArr = []
        responseArr.forEach(item => {
            if (filterItems(filterArr, item, "Price")) {
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

function filterItems(filterArr, item, BidOrPrice) {
    for (let i = 0; i < filterArr.length - 3; i++) {
        if (filterArr[i] === "1" || filterArr[i] === " 1") {
            if (item["subject"] === indexToSubjectName(i)) {
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
let itemStringToFile = new Map();
itemStringToFile.set('t-shirt-grey', 'itemsDir/t-shirt-grey.png');
itemStringToFile.set('hat-white', 'itemsDir/hat-white.jpg');
itemStringToFile.set('Pants', 'itemsDir/pants.png');
itemStringToFile.set('Shirt', 'itemsDir/shirt-white.png');
itemStringToFile.set('T-Shirt', 'itemsDir/t-shirt-grey.png');
itemStringToFile.set('Coat', 'itemsDir/coat.png');
itemStringToFile.set('Hat', 'itemsDir/hat-white.jpg');

let itemStringToXY = new Map();
itemStringToXY.set('t-shirt-grey', [300, 300]);
itemStringToXY.set('hat-white', [350, 300]);
itemStringToXY.set('Pants', [300, 300]);
itemStringToXY.set('Shirt', [300, 300]);
itemStringToXY.set('T-Shirt', [300, 300]);
itemStringToXY.set('Coat', [300, 300]);
itemStringToXY.set('Hat', [350, 300]);


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













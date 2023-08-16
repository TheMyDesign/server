
async function uploadImageAndSaveToFirestore(userId, imagePath, receivedData, admin) {
    try {
        const firestore = admin.firestore();
        const description = receivedData.description;
        const clothingKind = receivedData.clothingKind;
        const color = receivedData.color;
        const size = receivedData.size;
        const fit = receivedData.fit;
        const prompt = receivedData.customText;

        const bucket = admin.storage().bucket();
        const destinationFileName = "user_existing_design/" + imagePath; // Replace yourDesiredFileName with the desired file name
        await bucket.upload(imagePath, {
            destination: destinationFileName,
            metadata: {
                cacheControl: "public, max-age=315360000",
                contentType: "image/jpg"
            }
        });
        // Get the download URL for the uploaded file
        const file = bucket.file(destinationFileName);
        const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});

        // Save the URL to Firestore along with other details
        await firestore.collection("UserExistingDesign").add({
            userId: userId,
            imageUrl: url,
            description: description,
            clothingKind: clothingKind,
            color: color,
            size: size,
            fit: fit,
            prompt: prompt
        });
        console.log("image upload to the cloud")
        return url;
    } catch (error) {
        throw error;
    }
}

async function PalaceOrderToFirebase(doc,itemPrice, admin) {
    try {
        const firestore = admin.firestore();

        // Save the URL to Firestore along with other details
        const newOrderRef = await firestore.collection("UsersOrders").add({
            userId: doc["userId"],
            imageUrl: doc["imageUrl"],
            description: doc["description"],
            clothingKind: doc["clothingKind"],
            color: doc["color"],
            size: doc["size"],
            fit: doc["fit"],
            price:itemPrice
        });
        console.log("the ordered has been placed")
        return newOrderRef;
    } catch (error) {
        throw error;
    }
}

async function getDocumentById(collection, documentId) {
    try {
        const documentRef = db.collection(collection).doc(documentId);
        const snapshot = await documentRef.get();

        if (snapshot.exists) {
            const documentData = snapshot.data();
            // console.log('Document data:', documentData);
            return documentData;
        } else {
            // console.log('Document not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting document:', error);
        throw error;
    }
}

async function updateDocument(collectionName, documentId, updatedData,db) {
    try {
        console.log(documentId)
        const documentRef = db.collection(collectionName).doc(documentId);
        await documentRef.update(updatedData);
        console.log('Document updated successfully');
    } catch (error) {
        console.error('Error updating document:', error.message,"documentId = ",documentId);
        throw error;
    }
}

async function getDocList(collectionName,db,userId="") {
    let filteredResArr;
    try {
        console.log("/getDocList - ",collectionName)
        const docsRef = db.collection(collectionName)
        const response = await docsRef.get()
        let responseArr = []
        response.forEach(doc => {
            const itemData = doc.data();
            const itemId = doc.id;
            responseArr.push({itemId, ...itemData});
        });

        filteredResArr = []
        responseArr.forEach(item => {
            if(userId !== ""){
                if (item["userId"] === userId){
                    filteredResArr.push(item);
                }
            }else{
                filteredResArr.push(item);
            }
        })
        return filteredResArr;
    } catch (error) {
        console.error('Error getDocList :', error.message,"collectionName = ",collectionName);
        throw error;
    }
}

module.exports = {
    uploadImageAndSaveToFirestore,
    PalaceOrderToFirebase,
    getDocumentById,
    getDocList,
    updateDocument
};
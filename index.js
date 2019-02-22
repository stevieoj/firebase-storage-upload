const admin = require("firebase-admin");
/* eslint-disable */
const functions = require("firebase-functions");
const Cors = require("cors");
const express = require("express");
const fileUpload = require('./fileUpload');

const uploadApi = express().use(Cors({ origin: true }));
fileUpload("/upload", uploadApi);

admin.initializeApp(functions.config().firebase);

uploadApi.post("/upload", function (req, response, next) {
	const contentType = req.query.type;
    uploadImageToStorage(req.files.file[0], contentType)
    .then(metadata => {
        response.status(200).json(metadata[0]);
        next();
    })
    .catch(error => {
        console.error(error);
        response.status(500).json({ error });
        next();
    });
});

exports.uploadApi = functions.https.onRequest(uploadApi);

const uploadImageToStorage = (file, contentType) => {
    const storage = admin.storage();
    return new Promise((resolve, reject) => {
        const fileUpload = storage.bucket().file(file.originalname);
        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType }
        });

        blobStream.on("error", error => reject(error));

        blobStream.on("finish", () => {
            fileUpload.getMetadata()
            .then(metadata => resolve(metadata))
            .catch(error => reject(error));
        });

    blobStream.end(file.buffer);
  });
}
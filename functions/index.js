/**
 * ShopBeta Cloud Functions entry point.
 */
const { initializeApp } = require("firebase-admin/app");
const { paystackWebhook } = require("./src/paystackWebhook");
const { paystackInitialize } = require("./src/paystackInitialize");

initializeApp();

exports.paystackWebhook = paystackWebhook;
exports.paystackInitialize = paystackInitialize;

/**
 * ShopBeta Cloud Functions entry point.
 * Export HTTPS Paystack webhook for Firebase Console → Build → Functions.
 */
const { initializeApp } = require("firebase-admin/app");
const { paystackWebhook } = require("./src/paystackWebhook");

initializeApp();

exports.paystackWebhook = paystackWebhook;

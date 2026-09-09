/**
 * Environment variables for Cloud Functions
 */

function getKorapaySecretKey() {
  const key = process.env.KORAPAY_SECRET_KEY?.trim();
  if (!key) {
    console.error("KORAPAY_SECRET_KEY is not configured");
    throw new Error("KORAPAY_SECRET_KEY is not configured.");
  }
  console.log("KoraPay secret key loaded successfully");
  return key;
}

module.exports = {
  getKorapaySecretKey,
};

/**
 * Environment variables for Cloud Functions
 */

function getKorapaySecretKey() {
  const key = process.env.KORAPAY_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("KORAPAY_SECRET_KEY is not configured.");
  }
  return key;
}

module.exports = {
  getKorapaySecretKey,
};

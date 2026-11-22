const { test, before, after } = require("node:test");
const { readFileSync } = require("node:fs");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { createRequire } = require("node:module");
const {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} = createRequire(require.resolve("@firebase/rules-unit-testing"))(
  "firebase/firestore",
);
let env;

const baseReview = (uid, extra = {}) => ({
  productId: "prod-1",
  productSlug: "prod-1",
  productName: "Probe Product",
  userId: uid,
  reviewBy: "Probe Reviewer",
  rating: 5,
  review: "Works great.",
  images: [],
  approved: false,
  rejected: false,
  verifiedPurchase: false,
  helpfulCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
});

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Only run this test through the demo Firestore emulator.");
  env = await initializeTestEnvironment({
    projectId: "demo-store-scope",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/admin"), { role: "super_admin" });
    await setDoc(doc(db, "users/customer"), { role: "customer" });
    // Seeded fixtures: an approved review, a pending review, a rejected
    // review and a legacy review with no `approved` field at all.
    await setDoc(doc(db, "reviews/approved-1"), baseReview("customer", { approved: true, verifiedPurchase: true }));
    await setDoc(doc(db, "reviews/pending-1"), baseReview("customer"));
    await setDoc(doc(db, "reviews/rejected-1"), baseReview("customer", { rejected: true }));
    const legacy = baseReview("customer");
    delete legacy.approved;
    delete legacy.rejected;
    await setDoc(doc(db, "reviews/legacy-1"), legacy);
    await setDoc(doc(db, "reviewContacts/approved-1"), {
      reviewId: "approved-1",
      userId: "customer",
      email: "customer@example.com",
      createdAt: serverTimestamp(),
    });
  });
});
after(async () => {
  await env?.cleanup();
});

test("signed-in customers can submit pending reviews bound to their uid", async () => {
  const db = env.authenticatedContext("customer").firestore();
  await assertSucceeds(setDoc(doc(db, "reviews/new-1"), baseReview("customer")));
  // Anonymous (guest) sessions used by checkout may also submit.
  const anon = env.authenticatedContext("anon-uid").firestore();
  await assertSucceeds(setDoc(doc(anon, "reviews/new-2"), baseReview("anon-uid")));
});

test("unauthenticated users cannot create reviews", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(db, "reviews/x"), baseReview("customer")));
});

test("customers cannot self-approve, self-verify, reject or inject contact fields", async () => {
  const db = env.authenticatedContext("customer").firestore();
  await assertFails(setDoc(doc(db, "reviews/a"), baseReview("customer", { approved: true })));
  await assertFails(setDoc(doc(db, "reviews/b"), baseReview("customer", { verifiedPurchase: true })));
  await assertFails(setDoc(doc(db, "reviews/c"), baseReview("customer", { rejected: true })));
  await assertFails(setDoc(doc(db, "reviews/d"), baseReview("customer", { email: "x@example.com" })));
});

test("customers cannot create reviews for another user's uid", async () => {
  const db = env.authenticatedContext("customer").firestore();
  await assertFails(setDoc(doc(db, "reviews/e"), baseReview("someone-else")));
});

test("invalid submissions are rejected", async () => {
  const db = env.authenticatedContext("customer").firestore();
  await assertFails(setDoc(doc(db, "reviews/f"), baseReview("customer", { rating: 6 })));
  await assertFails(setDoc(doc(db, "reviews/g"), baseReview("customer", { rating: 0 })));
  await assertFails(setDoc(doc(db, "reviews/h"), baseReview("customer", { reviewBy: "" })));
  await assertFails(setDoc(doc(db, "reviews/i"), baseReview("customer", { productId: "" })));
});

test("public can read only approved reviews", async () => {
  const db = env.unauthenticatedContext().firestore();
  const approved = await assertSucceeds(
    getDocs(query(collection(db, "reviews"), where("approved", "==", true))),
  );
  if (approved.size !== 1 || approved.docs[0].id !== "approved-1")
    throw new Error("expected exactly the approved review");
  await assertSucceeds(getDoc(doc(db, "reviews/approved-1")));
  // Unapproved, rejected and legacy docs are hidden — get and list both fail.
  for (const id of ["pending-1", "rejected-1", "legacy-1"]) {
    await assertFails(getDoc(doc(db, `reviews/${id}`)));
  }
  await assertFails(getDocs(collection(db, "reviews")));
  await assertFails(getDocs(query(collection(db, "reviews"), where("productId", "==", "prod-1"))));
});

test("staff can read all reviews and moderate them", async () => {
  const db = env.authenticatedContext("admin").firestore();
  const all = await assertSucceeds(getDocs(collection(db, "reviews")));
  if (all.size < 4) throw new Error("staff should see every review");
  await assertSucceeds(updateDoc(doc(db, "reviews/pending-1"), { approved: true, verifiedPurchase: true }));
  await assertSucceeds(updateDoc(doc(db, "reviews/approved-1"), { approved: false }));
  await assertSucceeds(updateDoc(doc(db, "reviews/legacy-1"), { reviewBy: "Edited Name" }));
});

test("customers cannot update or delete any review", async () => {
  const db = env.authenticatedContext("customer").firestore();
  await assertFails(updateDoc(doc(db, "reviews/pending-1"), { review: "edited" }));
  await assertFails(deleteDoc(doc(db, "reviews/approved-1")));
});

test("reviewContacts are private: staff can read, owner can create, others cannot", async () => {
  const staff = env.authenticatedContext("admin").firestore();
  await assertSucceeds(getDoc(doc(staff, "reviewContacts/approved-1")));
  const customer = env.authenticatedContext("customer").firestore();
  await assertFails(getDoc(doc(customer, "reviewContacts/approved-1")));
  await assertSucceeds(
    setDoc(doc(customer, "reviewContacts/new-1"), {
      reviewId: "new-1",
      userId: "customer",
      email: "customer@example.com",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(customer, "reviewContacts/foreign"), {
      reviewId: "foreign",
      userId: "someone-else",
      email: "x@example.com",
      createdAt: serverTimestamp(),
    }),
  );
  const anon = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anon, "reviewContacts/approved-1")));
});

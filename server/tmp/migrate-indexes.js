import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Drop old unique index on email for users collection
    try {
        const userIndexes = await db.collection("users").indexes();
        const emailOnlyIndex = userIndexes.find(
            (idx) => idx.key && idx.key.email === 1 && idx.unique && Object.keys(idx.key).length === 1
        );
        if (emailOnlyIndex) {
            await db.collection("users").dropIndex(emailOnlyIndex.name);
            console.log("Dropped old email-only unique index from users:", emailOnlyIndex.name);
        } else {
            console.log("No old email-only unique index found on users");
        }
    } catch (e) {
        console.log("Users index error:", e.message);
    }

    // Drop old unique index on email for passwordresettokens collection
    try {
        const prtIndexes = await db.collection("passwordresettokens").indexes();
        const emailOnlyPrt = prtIndexes.find(
            (idx) => idx.key && idx.key.email === 1 && idx.unique && Object.keys(idx.key).length === 1
        );
        if (emailOnlyPrt) {
            await db.collection("passwordresettokens").dropIndex(emailOnlyPrt.name);
            console.log("Dropped old email-only unique index from passwordresettokens:", emailOnlyPrt.name);
        } else {
            console.log("No old email-only unique index found on passwordresettokens");
        }
    } catch (e) {
        console.log("PRT index error:", e.message);
    }

    // List final indexes for verification
    try {
        const finalUserIndexes = await db.collection("users").indexes();
        console.log("\nCurrent users indexes:", JSON.stringify(finalUserIndexes, null, 2));
    } catch (e) {
        console.log("Could not list user indexes");
    }

    await mongoose.disconnect();
    console.log("\nMigration complete.");
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});

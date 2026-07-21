// This file MUST be the very first import in server.js.
// ES module imports are hoisted and evaluated in declaration order, each
// fully before the next. Making this the first import guarantees
// process.env is populated before any other module (e.g. emailService.js,
// which reads CLIENT_URL at module load time) gets evaluated.
import dotenv from "dotenv";

dotenv.config();

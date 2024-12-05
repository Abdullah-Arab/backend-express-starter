import { db } from "./index"; // Adjust this path based on your setup
import { users } from "./schema"; // Adjust this path based on your setup
import { v4 as uuidv4 } from "uuid";

async function seed() {
  try {
    // Step 1: Clear existing data (optional but helpful for re-seeding)
    await db.delete(users);


    // Step 2: Insert sample users
    const user1Id = uuidv4();
    const user2Id = uuidv4();

    await db.insert(users).values([
      {
        id: user1Id,
        phone: "1234567890",
      },
      {
        id: user2Id,
        phone: "0987654321",
      },
    ]);

    console.log("Users seeded:", [
      { id: user1Id, phone_number: "1234567890" },
      { id: user2Id, phone_number: "0987654321" },
    ]);

   
    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
  // finally {
  //   await db.end(); // Close database connection if necessary
  // }
}

seed().catch((error) => console.error("Error in seed script:", error));

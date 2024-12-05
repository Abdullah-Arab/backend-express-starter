import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const db = drizzle(process.env.DATABASE_URL!);

const main = async () => {
  try {
    await migrate(db, {
      migrationsFolder: "src/db/migrations",
    });

    console.log("Migration successful");
  } catch (error) {
    console.error(error);
    process.exit(1);
  } 
};

main();

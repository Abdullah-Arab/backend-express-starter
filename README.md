# Backend Express Starter

This is a starter backend app that uses the following tech stack:

- **Node.js**: JavaScript runtime for building server-side applications.
- **TypeScript**: Superset of JavaScript for type safety and better tooling.
- **Express.js**: Web framework for building APIs.
- **PostgreSQL**: Relational database for data storage.
- **Drizzle ORM**: ORM for interacting with the PostgreSQL database.
- **Zod**: Schema validation library for request validation.

## Getting Started

To get started with this project, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/backend-express-starter.git
    cd backend-express-starter
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add your environment variables.

    example .env file:
    ```sh
    PORT=3000
    DATABASE_URL=postgres://username:password@localhost:5432/database
    ```


<!-- add .env example and run database migrations -->
4. Run database migrations:
    ```sh
    npm run generate
    npm run migrate
    ```
5. Start the development server:
    ```sh
    npm run dev
    ```



## Scripts

- `npm run dev`: Run the development server.
- `npm run build`: Build the project.
- `npm start`: Start the production server.

## Future Plans
- Add user authentication
- Add role based access control

## Contributing
i would like to add user authentication, authorization and role based access control to this project. If you like the project and would like to contribute, feel free to fork the repository and submit a pull request, I would be happy to review and merge it.

## License

This project is licensed under the MIT License.
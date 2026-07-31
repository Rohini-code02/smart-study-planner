# Smart Study Planner - Backend Setup

This folder contains the backend infrastructure for the Smart Study Planner application. It is professionally built using **Node.js, Express.js, and MongoDB**.

## 📁 Professional Folder Structure Explained

We use a modular architecture (often called MVC - Model View Controller) to keep our code clean, scalable, and easy to debug.

- **`/config`**: Contains configuration files. For example, `db.js` handles the complex logic of securely connecting to the MongoDB database.
- **`/controllers`**: This is where the actual "brain" or logic of the application lives. Instead of cramming all our logic into the routes, the route just points to a controller function (e.g., `createUser` or `getTasks`).
- **`/models`**: Contains the MongoDB schemas. Since MongoDB is a NoSQL database (it doesn't have rigid tables), we use Mongoose models to define exactly what a "User" or "Task" should look like (e.g., making sure a User always has an email address).
- **`/routes`**: Contains the API endpoints (URLs). These files act as traffic cops, simply directing incoming HTTP requests from the frontend to the appropriate controller.
- **`/middleware`**: Contains helper functions that run *before* a request reaches a controller. For example, `authMiddleware.js` could verify if a user is logged in before letting them see their dashboard data.

## 📦 Installed Packages Explained

We installed several crucial, industry-standard packages using `npm install`:

- **`express`**: The core web framework. It makes setting up a server and handling HTTP requests (GET, POST, PUT, DELETE) incredibly simple compared to raw Node.js.
- **`mongoose`**: An Object Data Modeling (ODM) library for MongoDB. It allows us to write elegant JavaScript code to talk to the database instead of using complex database queries.
- **`cors`**: Stands for Cross-Origin Resource Sharing. Browsers naturally block requests from one port (React on 5173) to another port (Express on 5000) for security. CORS tells the browser it's safe to communicate between them.
- **`dotenv`**: A security tool. It securely loads variables from the `.env` file into our app. This ensures we never accidentally push passwords or API keys to GitHub.
- **`nodemon`**: Installed as a "Dev Dependency". When writing backend code, you normally have to manually stop and restart the server every time you save a file. Nodemon watches for file changes and restarts the server automatically!

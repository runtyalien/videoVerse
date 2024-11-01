# Video Management API

Video Management API built with Node.js, Express, and Sequelize. Provides functionalities to upload, trim, merge, share, and play videos. The API uses dummy token for authentication and stores video metadata in a database.

## Table of Contents

- [Features](#features)
- [Dependencies Used](#dependencies-used)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Running the Tests](#running-the-tests)
- [References](#references)

## Features

- Upload videos with size limitations.
- Trim videos to specified start and end times.
- Merge multiple videos into one.
- Share video links with expiration times.
- Play videos securely with dummy authentication.

## Dependencies Used

- **Node.js**: JavaScript runtime for server-side programming.
- **Express**: Web framework for Node.js.
- **Sequelize**: Promise-based Node.js ORM.
- **Multer**: Middleware for handling file uploads.
- **ffmpeg-static**: FFmpeg binaries for video processing.
- **dotenv**: Module to load environment variables from a ```.env``` file.
- **Jest**: JavaScript testing framework.
- **Postman**: API environment for testing and managing APIs.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/runtyalien/videoVerse.git
    ```
2. Install dependencies:
    ``` 
    npm install 
    ```
3. Change ``` .env``` if needed

## API Endpoints

| Method              | Endpoint | Description |
| :---------------- | :------: | ----: |
| POST        |   /api/videos/upload   | 	Upload a new video |
| POST           |   /api/videos/trim   | Trim an existing video |
| POST    |  /api/videos/merge   | Merge multiple videos |
| POST |  /api/videos/share   | Share a video link with expiration time |
| GET |  /api/videos/:id/play   | Play a shared video |

## Environment Variables
- Edit .env file in the root of your project and change the following(if needed):
    ```
    JWT_SECRET=x9h7g2bqL4p9t2Q3j0R1e6aZ7sV3w8uY
    MAX_SIZE=25000000  # 25 MB
    MIN_DURATION=5     # Minimum duration in seconds
    MAX_DURATION=300   # Maximum duration in seconds
    ```
## Running the Application
1. ``` npm start```
2. The API will run on http://localhost:5000

## Running the Tests
1. ``` npm test ```
2. This will run both e2e and unit tests

## References
1. FFMPEG: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
2. Multer: https://www.tutorialswebsite.com/file-upload-in-node-js-using-multer/
3. Postman Collection JSON: https://github.com/Blazemeter/taurus/blob/master/examples/functional/postman-sample-collection.json
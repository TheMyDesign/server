# MyDesignForAndroid Server

MyDesignForAndroid Server is a server-side component of the MyDesignForAndroid application. It provides the necessary backend functionality to support the application's features.

## Prerequisites

Before running the server, make sure you have the following installed:

- Node.js
- Express.js
- Socket.IO
- Axios
- Jimp
- Firebase Admin SDK

## Installation

1. Clone the repository:
https://github.com/TheMyDesign/server.git


2. Install the dependencies for runing the server

3. Set up Firebase Admin SDK:

- Obtain the Firebase service account credentials (`serviceAccountKey.json`) and place it in the root directory of the server project.

4. Start the server:

npm start


The server will start running on http://localhost:8080.

## API Endpoints

The server exposes the following API endpoints:

- `GET /generatedImage`: Generates a combined image based on the provided prompt and item string.
- Parameters:
 - `prompt`: The prompt for image generation.
 - `itemString`: The item string for image generation.
- Example usage: http://localhost:8080/generatedImage?prompt=fire%20ball&itemString=t-shirt

- `GET /read/UserDesign/:Bid`: Retrieves user designs based on the bid sorting order.
- Parameters:
 - `Bid`: The sorting order ("down" for descending order, "up" for ascending order).
- Example usage: http://localhost:8080/read/UserDesign/down

- `GET /read/UserExistenceDesign/:Price`: Retrieves user existence designs based on the price sorting order.
- Parameters:
 - `Price`: The sorting order ("down" for descending order, "up" for ascending order).
- Example usage: http://localhost:8080/read/UserExistenceDesign/down

- `POST /update/:id/:subject`: Updates the subject of a user design with the provided ID.
- Parameters:
 - `id`: The ID of the user design.
 - `subject`: The new subject for the user design.
- Example usage: http://localhost:8080/update/123456789/subject-example

- `GET /read/UserDesign/:subject`: Retrieves user designs based on the specified subject.
- Parameters:
 - `subject`: The subject to filter the user designs.
- Example usage: http://localhost:8080/read/UserDesign/pants

- `GET /read/UserDesign/filter/:arr`: Retrieves user designs based on the specified filter.
- Parameters:
 - `arr`: The filter parameters (comma-separated).
 - you can learn more about the array, and what each location represent in the code itself
- Example usage: http://localhost:8080/read/UserDesign/filter/1,0,1,0,0,0,1,0,0,10,100,1

- `GET /read/UserExistenceDesign/filter/:arr`: Retrieves user existence designs based on the specified filter.
- Parameters:
 - `arr`: The filter parameters (comma-separated).
- Example usage: http://localhost:8080/read/UserExistenceDesign/filter/1,0,1,0,0,0,1,0,0,10,100,1

## License

This project is licensed under the [MIT License](LICENSE).



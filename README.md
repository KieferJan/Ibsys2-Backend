# Backend

To SetUp the Backend Project follow these steps:

## IDE
Download a IDE like Webstorm or IntelliJ (use your hs-karlsruhe.de Mail to get acces to the student version)

## Git
- Install git
- To get the project from github look for something like VCS on your IDE and than checkout from Version Control
  (it works like this on Webstorm), enter der URL of our github repository (https://github.com/SilverJan/AWPSS17/)
  and enter your credentials.

## Install Node
Download the latest Node Installer from https://nodejs.org/en/

## Install MongoDB
- Download the latest MongoDB Version from https://www.mongodb.com/download-center?jmp=nav#community
- Choose a location for your mongo directory, as u have to find it again for adding mongos /bin directory to your path
variable (my Path looks like this: /Users/jankiefer/Mongo/bin)
- Check if the mongodb starts correctly executing the command: mongod
- Set Endpoint where the data gets stored execute in terminal: mongod --dbpath /Path/to/dbStorage


## NPM-Install
- If you have the project on your local pc, open your command prompt and navigate to the directory where you saved the
project (navigate to the backend directory where the package.json is located)
- execute the command npm install

## How to start node and mongodb:
Open a terminal and execute
- mongod --dbpath /Path/to/dbStorage   : starts the mongodb
(mongod itself is enough normally)
- mongod --dbpath /Path/   : starts the mongodb

## Navigate to the Projects terminal and execute
- gulp build                           : compiles the .ts files from src to .js files in dist
- gulp mongoimport                     : imports the data which is stored in the the mongoimport folder
- nodemon                              : starts the Nodeserver (you can access it on localhost:3000)
- ng serve                             : in the **frontend**: starts the webserver

## Swagger-UI
- execute mongod and nodemon
- open localhost:3000/api-docs in your browser

## yuidoc
To generate the yuidoc
- npm -g install yuidocjs
- in project terminal execute yuidoc . 
- go to ./out/index.html and run this in a browser

## Tests
- Clear DB before starting tests
- Start db with "mongod"
- To execute Test run "mocha test" in src Folder
- If missing install mocha globally with: "npm install --global mocha"

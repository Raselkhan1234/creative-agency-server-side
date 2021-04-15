const express = require("express");
const cors = require("@robertoachar/express-cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const admin = require("firebase-admin");
require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.atcbg.mongodb.net/raselAgency?retryWrites=true&w=majority`;

const app = express();

var serviceAccount = require("./configs/creative-agency-dd389-firebase-adminsdk-o08pi-c2cad5fd11.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("orders"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const orderCollection = client.db("raselAgency").collection("allOrders");

  app.post("/addAllOrders", (req, res) => {
    const file = req.files.file;
    const design = req.body.design;
    const details = req.body.details;
    const name = req.body.name;
    const email = req.body.email;
    const filePath = `${__dirname}/orders/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ message: "failed to upload Image" });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");
      const image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };
      orderCollection
        .insertOne({ name, email, design, details, image })
        .then((result) => {
          fs.remove(filePath, (error) => {
            if (error) {
              console.log(error);
              res.status(500).send({ message: "failed to upload Image" });
            }
          });
          res.send(result.insertedCount > 0);
        });
    });
  });

  app.get("/services", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const uid = decodedToken.uid;
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  const reviewCollection = client.db("raselAgency").collection("allReview");

  app.post("/addReviews", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const destination = req.body.destination;
    const description = req.body.description;
    const filePath = `${__dirname}/review/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ message: "failed to upload Image" });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");
      const image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };
      reviewCollection
        .insertOne({ name, destination, description, image })
        .then((result) => {
          fs.remove(filePath, (error) => {
            if (error) {
              console.log(error);
              res.status(500).send({ message: "failed to upload Image" });
            }
          });
          res.send(result.insertedCount > 0);
        });
    });
  });

  app.get("/reviews", (req, res) => {
            reviewCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
  });

  const adminCollection = client.db("raselAgency").collection("Admin");
  app.post("/addAdmin", (req, res) => {
    const email = req.body.userEmail;
    adminCollection.insertOne({ email }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    console.log(email);
    adminCollection.find({ email: email }).toArray((err, admins) => {
      res.send(admins.length > 0);
    });
  });

  app.get("/allInformation", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const uid = decodedToken.uid;
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection.find({}).toArray((err, documents) => {
              res.send(documents);
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  const serviceCollection = client.db("raselAgency").collection("allServices");
  app.post("/addServices", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const filePath = `${__dirname}/service/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ message: "failed to upload Image" });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");
      const image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };
      serviceCollection
        .insertOne({ title, description, image })
        .then((result) => {
          fs.remove(filePath, (error) => {
            if (error) {
              console.log(error);
              res.status(500).send({ message: "failed to upload Image" });
            }
          });
          res.send(result.insertedCount > 0);
        });
    });
  });

  app.get("/allCourse", (req, res) =>{
            serviceCollection.find({})
            .toArray((err, documents) => {
              res.send(documents);
            });
  });


});

app.listen(process.env.PORT || port);

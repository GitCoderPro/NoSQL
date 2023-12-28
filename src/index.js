require("dotenv").config();

const express = require("express");
const fs = require("fs");
const server = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.Username}:${process.env.Password}@nosqlcluster.wxnnkwa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const collection = client
      .db("NoSQLDatabase")
      .collection("HTTP Status Codes");
    const collection2 = client.db("NoSQLDatabase").collection("data");

    const data = await collection.find({}).toArray();
    const user = await collection2.find({}).toArray();

    server.get("/HTTP", async (req, res) => {
      try {
        const unorderedList = (
          await Promise.all(
            data.map(async (item) => {
              const categories = Object.keys(item.codes);
              const categoryHTML = await Promise.all(
                categories.map(async (category) => {
                  const codesHTML = (
                    await Promise.all(
                      item.codes[category].map(
                        async (code) => `<li>${code}</li>`,
                      ),
                    )
                  ).join("");
                  return `<ul><strong>${category}</strong>${codesHTML}</ul>`;
                }),
              );
              return categoryHTML.join("");
            }),
          )
        ).join("");

        res.send(unorderedList);
      } catch (error) {
        console.clear();
        res.send(error.message);
      }
    });

    server.get("/data", (req, res) => {
      try {
        const userInfo = [];
        for (let i in user[0]) {
          userInfo.push(user[0][i]);
        }
        const list = userInfo.map((item) => {
          return `<li>${item}</li>`;
        });
        res.send(`<ul>${list.join("")}</ul>`);
      } catch (error) {
        console.clear();
        res.send(error.message);
      }
    });

    server.use((req, res) => {
      res
        .status(404)
        .send(
          "Unfortunately i cannot find the site you were looking for. <br><br> Go to <a href='/'>Home</a>",
        );
    });
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

server.get("/", (req, res) => {
  fs.readFile("static/index.html", "utf-8", (err, data) => {
    res.send(data);
  });
});

server.listen(process.env.PORT || 8000);

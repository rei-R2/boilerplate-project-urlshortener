require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
require("mongoose").connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// mongo schema & model
let urlShortSchema = new mongoose.Schema({
  originUrl: {
    type: String,
    require: true,
  },
  shortUrl: {
    type: Number,
    require: true,
  },
});
const UrlShort = mongoose.model("URLS", urlShortSchema);

app.post("/api/shorturl", (req, res) => {
  let url;
  try {
    url = new URL(req.body.url);
  } catch (err) {
    console.log(err);
    return res.json({ error: "invalid url" });
  }
  dns.lookup(url.hostname, (err, address, family) => {
    if (err !== null) {
      return res.json({ error: "invalid url" });
    } else {
      // check url on database
      UrlShort.findOne({
        originUrl: url.href,
      })
        .then((data) => {
          if (data === null) {
            // add new url
            new UrlShort({
              originUrl: url.href,
              shortUrl: Math.round(Math.random() * 10000),
            })
              .save()
              .then((data) => {
                return res.json({
                  original_url: req.body.url,
                  short_url: data.shortUrl,
                });
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            return res.json({
              original_url: req.body.url,
              short_url: data.shortUrl,
            });
          }
        })
        .catch((err) => {
          console.log({ err });
        });
    }
  });
});

app.get("/api/shorturl/:shortUrl", (req, res) => {
  // check shortUrl
  UrlShort.findOne({
    shortUrl: req.params.shortUrl,
  })
    .then((data) => {
      if (data !== null) {
        return res.redirect(data.originUrl);
      } else {
        return res.json({ error: "invalid url" });
      }
    })
    .catch((err) => {
      res.json({ faild: err });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

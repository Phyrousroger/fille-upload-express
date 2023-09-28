const express = require("express");
const env = require("dotenv").config();
const app = express();
const { engine } = require("express-handlebars");
const fileupload = require("express-fileupload");
const mysql = require("mysql2");

const port = process.env.PORT || 5000;

app.use(fileupload());

app.use(express.static("public"));
app.use(express.static("upload"));
//templating engine
app.engine("hbs", engine({ extname: ".hbs" }));
app.set("view engine", "hbs");
app.set("views", "./views");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.HOST_NAME,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

pool.getConnection((err, connection) => {
  if (err) throw err; //not connected
  console.log("mysql database connected!");
});

app.get("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log("connected!");
    connection.query("SELECT * FROM user where id=?", [1], (err, rows) => {
      /**once done release connection */
      connection.release();

      if (!err) {
        res.render("index", { rows });
      }
    });
  });
});

app.post("/", (req, res) => {
  let simplefile;
  let uploadFile;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  /**name of the input is simple file */
  simplefile = req.files.simplefile;
  uploadFile = __dirname + "/upload/" + "cloud.jpg";
  console.log(simplefile);

  /** use mv() to place file on the server */
  simplefile.mv(uploadFile, (err) => {
    if (err) return res.status(500).send(err);
    pool.getConnection((err, connection) => {
      if (err) throw err;
      console.log("connected image!");
      connection.query(
        "UPDATE user SET profile_image=? WHERE id='1'",
        ["cloud.jpg"],
        (err, rows) => {
          connection.release();
          if (!err) {
            res.redirect("/");
          } else {
            console.log(err);
          }
        }
      );
    });
  });
});

app.listen(port, () => {
  console.log("your port is running on port " + port);
});

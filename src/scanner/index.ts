import express from "express";
import NodeClam from "clamscan";
import { writeFileSync } from "fs";
import * as rimraf from 'rimraf';

const app = express();
const port = 80;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({limit: '100mb'}));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.status(200);
  res.send({
    message: "All good!"
  })
})

app.get("/version", async (req, res) => {
  try{
    const clamscan = await new NodeClam().init({});
    const version = await clamscan.getVersion();
  
    res.status(200)
    res.send({
      version,
    });
  } catch (ex) {
    res.status(500);
    res.send({
      message: (ex as Error).message
    })
  }
});

app.post("/scan", async (req, res) => {
  const { body } = req;

  if (
    body &&
    body.s3Object &&
    body.s3Object.file &&
    body.s3Object.file.data &&
    body.s3Object.file.mime &&
    body.s3Object.file.name
  ) {
    const {name, data} = body.s3Object.file;

    const buff = Buffer.from(data, "base64").toString("base64");

    const filename = `${name}`;

    writeFileSync(filename, buff, { encoding: "base64" });

    const clamscan = await new NodeClam().init({});

    const scanResult = await clamscan.scanFile(filename);

    rimraf.sync(filename);

    res.status(200);
    res.send({ message: "Done!", scanResult });
  } else {
    res.status(400);
    res.send("Wrong payload data format!");
  }
});

app.listen(port, () => {
  console.log(`ClamAv API listening on port ${port}`);
});

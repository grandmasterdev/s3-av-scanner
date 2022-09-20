import express from "express";
import NodeClam from "clamscan";
import { writeFileSync } from "fs";

const app = express();
const port = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/version", async (req, res) => {
  const clamscan = await new NodeClam().init({});
  const version = await clamscan.getVersion();

  res.json({
    version,
  });
});

app.post("/scan", async (req, res) => {
  console.log(req.body);
  console.log(req.files);

  const { body } = req;

  if (body && body.file && body.file.data) {
    const buff = Buffer.from(body.file.data, "base64").toString("base64");

    console.log(buff);

    writeFileSync("temp.png", buff, { encoding: "base64" });

    const clamscan = await new NodeClam().init({});

    const scanResult = await clamscan.scanFile("temp.png")

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

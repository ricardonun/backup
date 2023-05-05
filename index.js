const path = require("path");
const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { authorize } = require("./oAuth.js");
const { google } = require("googleapis");
let SftpClient = require("ssh2-sftp-client");
const schedule = require("node-schedule");

const dotenvPath = path.join(__dirname, ".", ".env");
require("dotenv").config({ path: dotenvPath });

const config = {
  host: process.env.HOST,
  username: process.env.USER,
  password: process.env.PASSWORD,
  port: process.env.PORT,
};

let dst = "./";
const src = "/backups";

async function main() {
  const newDate = Date.now();
  if (!fs.existsSync(newDate.toString())) {
    //Efetua a criação do diretório
    fs.mkdirSync(`./backups/${newDate.toString()}`);
  }
  dst = `./backups/${newDate}`;

  const client = new SftpClient("upload-test");
  try {
    await client.connect(config);
    client.on("download", (info) => {
      console.log(`Listener: Download ${info.source}`);
    });
    let rslt = await client.downloadDir(src, dst);
    console.log(`Resultado ${rslt}`);
    return rslt;
  } finally {
    client.end();
    console.log("End program");
  }
}

const job = schedule.scheduleJob("1 0 12 * * *", () => {
  main()
    .then((msg) => {
      console.log(msg);
    })
    .catch((err) => {
      console.log(`main error: ${err.message}`);
    });

  console.log("Backup finalizado com sucesso");
});

const job2 = schedule.scheduleJob("1 0 15 * * *", () => {
  const newDate = Date.now();
  if (!fs.existsSync(newDate.toString())) {
    //Efetua a criação do diretório
    fs.mkdirSync(`./backups/${newDate.toString()}`);
  }
  dst = `./backups/${newDate}`;
  main()
    .then((msg) => {
      console.log(msg);
    })
    .catch((err) => {
      console.log(`main error: ${err.message}`);
    });

  console.log("Backup finalizado com sucesso");
});

const job3 = schedule.scheduleJob("1 0 20 * * *", () => {
  const newDate = Date.now();
  if (!fs.existsSync(newDate.toString())) {
    //Efetua a criação do diretório
    fs.mkdirSync(`./backups/${newDate.toString()}`);
  }
  dst = `./backups/${newDate}`;
  main()
    .then((msg) => {
      console.log(msg);
    })
    .catch((err) => {
      console.log(`main error: ${err.message}`);
    });

  console.log("Backup finalizado com sucesso");
});

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({ version: "v3", auth: authClient });

  console.log(drive.files.create);
  main();
  // const files = res.data.files;
  // if (files.length === 0) {
  //   console.log("No files found.");
  //   return;
  // }

  // console.log("Files:");
  // files.map((file) => {
  //   console.log(`${file.name} (${file.id})`);
  // });
}

authorize().then(listFiles).catch(console.error);

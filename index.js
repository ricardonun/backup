const path = require("path");
const fsPromises = require("fs").promises;
const fs = require("fs");
const { GoogleAuth, auth } = require("google-auth-library");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");
let SftpClient = require("ssh2-sftp-client");
const schedule = require("node-schedule");

const SCOPES = [
  "https://www.googleapis.com/auth/docs",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.apps.readonly",
  "https://www.googleapis.com/auth/drive.file",
];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

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

async function main(authClient) {
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
      // console.log(`Listener: Download ${info.source}`);
    });
    let rslt = await client.downloadDir(src, dst);

    const files = fs.readdirSync(`./backups/${newDate}`);
    const drive = google.drive({ version: "v3", auth: authClient });

    try {
      files.map(async (file) => {
        console.log(file);
        const uploads = await drive.files.create({
          requestBody: {
            name: file,
            fields: ["id"],
          },
          media: {
            mimiType: "*/*",
            body: fs.createReadStream(`./backups/${newDate}/${file}`),
          },
        });

        console.log(uploads);
      });
    } catch (err) {
      console.log(err);
    }

    return "ok";
  } finally {
    client.end();
    console.log("End program");
  }
}

const job = schedule.scheduleJob("1 0 12 * * *", async () => {
  await authorize().then(listFiles).catch(console.error);
  console.log("Backup finalizado com sucesso");
});

const job2 = schedule.scheduleJob("1 0 15 * * *", async () => {
  await authorize().then(listFiles).catch(console.error);

  console.log("Backup finalizado com sucesso");
});

const job3 = schedule.scheduleJob("1 0 20 * * *", async () => {
  await authorize().then(listFiles).catch(console.error);
  console.log("Backup finalizado com sucesso");
});

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  await main(authClient);
}

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fsPromises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fsPromises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fsPromises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

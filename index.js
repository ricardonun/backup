const path = require("path");
const fs = require("fs");
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

// let rule = new schedule.RecurrenceRule();
// rule.minute = 5;
// rule.tz = "BR";

async function main() {
  const client = new SftpClient("upload-test");

  try {
    await client.connect(config);
    client.on("download", (info) => {
      console.log(`Listener: Download ${info.source}`);
    });
    let rslt = await client.downloadDir(src, dst);
    return rslt;
  } finally {
    client.end();
    console.log("End program");
  }
}
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

import fetch from "node-fetch";

async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/settings");
    console.log(res.status);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error(err);
  }
}
run();

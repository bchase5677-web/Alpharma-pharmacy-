import fs from 'fs';

const testSave = async () => {
  try {
    // Generate a 20KB string
    const largeBase64 = "data:image/jpeg;base64," + "A".repeat(20000);
    const res = await fetch("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteName: "Test Name", logo: largeBase64 })
    });
    console.log("Status:", res.status);
    console.log("Response text:", await res.text());
  } catch (err) {
    console.error("Fetch failed:", err);
  }
};
testSave();

const testSave = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteName: "Test Name", logo: "data:image/jpeg;base64,12345" })
    });
    console.log("Status:", res.status);
    console.log("Response text:", await res.text());
  } catch (err) {
    console.error("Fetch failed:", err);
  }
};
testSave();

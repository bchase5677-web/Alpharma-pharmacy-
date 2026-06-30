import fetch from "node-fetch";

async function testAddProduct() {
  const product = {
    name: "Test Product",
    category: "Test Category",
    price: 100,
    description: "A test product",
    image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    availability: "In Stock",
    rating: 5.0,
    reviewsCount: 1
  };

  try {
    const res = await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testAddProduct();

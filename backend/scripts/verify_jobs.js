import jwt from "jsonwebtoken";

const secret = "hrise_super_secure_jwt_token_secret_key_2026";
const candidateToken = jwt.sign({ id: "mock_candidate_id", email: "candidate@test.com", role: "candidate" }, secret, { expiresIn: "1h" });

async function verify() {
  console.log("Testing with Candidate Token...");
  const res = await fetch("http://localhost:5000/api/jobs", {
    headers: { Authorization: `Bearer ${candidateToken}` }
  });
  console.log("Candidate HTTP Status:", res.status);
  if (res.status === 200) {
    const data = await res.json();
    console.log(`Candidate Jobs Returned: ${Array.isArray(data) ? data.length : "Not an array"}`);
  }

  console.log("Testing unauthorized POST with Candidate Token...");
  const postRes = await fetch("http://localhost:5000/api/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${candidateToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hacked Job" })
  });
  console.log("Candidate POST HTTP Status:", postRes.status);
}

verify().catch(console.error);

const https = require("https");
const http = require("http");

console.log("🔍 Testing connection to Telegram servers...\n");

// Test 1: Basic HTTPS connection
function testHttpsConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: "/",
      method: "GET",
      timeout: 10000,
    };

    console.log("📡 Testing HTTPS connection to api.telegram.org...");

    const req = https.request(options, (res) => {
      console.log("✅ HTTPS Connection successful!");
      console.log("   Status:", res.statusCode);
      console.log(
        "   Headers:",
        Object.keys(res.headers).length,
        "headers received"
      );
      resolve(true);
    });

    req.on("error", (e) => {
      console.log("❌ HTTPS Connection failed:", e.message);
      reject(e);
    });

    req.on("timeout", () => {
      console.log("⏰ HTTPS Connection timed out");
      req.destroy();
      reject(new Error("Timeout"));
    });

    req.end();
  });
}

// Test 2: DNS resolution
function testDNS() {
  return new Promise((resolve, reject) => {
    const dns = require("dns");

    console.log("🌐 Testing DNS resolution...");

    dns.resolve4("api.telegram.org", (err, addresses) => {
      if (err) {
        console.log("❌ DNS resolution failed:", err.message);
        reject(err);
      } else {
        console.log("✅ DNS resolution successful!");
        console.log("   IP addresses:", addresses.join(", "));
        resolve(addresses);
      }
    });
  });
}

// Test 3: Ping test (simplified)
function testPing() {
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");

    console.log("🏓 Testing ping to api.telegram.org...");

    // Try different ping commands for different OS
    const pingCommand =
      process.platform === "win32"
        ? "ping -n 1 api.telegram.org"
        : "ping -c 1 api.telegram.org";

    exec(pingCommand, (error, stdout, stderr) => {
      if (error) {
        console.log("❌ Ping failed:", error.message);
        console.log("   This might be due to firewall blocking ICMP packets");
        console.log("   Let's continue with HTTPS test...");
        resolve(true); // Don't fail the entire test for ping
      } else {
        console.log("✅ Ping successful!");
        console.log("   Response received");
        resolve(true);
      }
    });
  });
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting connection tests...\n");

  try {
    await testDNS();
    console.log("");

    await testPing();
    console.log("");

    await testHttpsConnection();
    console.log("");

    console.log(
      "🎉 All tests passed! Your network should be able to connect to Telegram."
    );
    console.log("💡 If the bot still doesn't work, try:");
    console.log("   1. Disable VPN/proxy");
    console.log("   2. Check Windows Firewall");
    console.log("   3. Try a different network");
  } catch (error) {
    console.log("");
    console.log(
      "❌ Some tests failed. This explains why the bot can't connect."
    );
    console.log("💡 Try these solutions:");
    console.log("   1. Check your internet connection");
    console.log("   2. Disable VPN/proxy services");
    console.log("   3. Allow Node.js through Windows Firewall");
    console.log("   4. Try using mobile hotspot");
    console.log("   5. Contact your network administrator");
  }
}

// Run the tests
runTests();

import { useState } from "react";
import { supabase } from "./supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login successful!");
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#101820",
      fontFamily: "Arial",
      padding: "20px"
    }}>
      <form onSubmit={handleLogin} style={{
        background: "#ffffff",
        padding: "30px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "380px"
      }}>
        <h2>The Daily Brief</h2>
        <h3>Admin Login</h3>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", boxSizing: "border-box" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "12px", marginBottom: "15px", boxSizing: "border-box" }}
        />

        <button type="submit" disabled={loading} style={{
          width: "100%",
          padding: "12px",
          background: "#172033",
          color: "white",
          border: "none",
          borderRadius: "6px"
        }}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>{message}</p>
      </form>
    </div>
  );
}

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "20s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = "http://localhost:8081/api";

// On authentifie une seule fois au setup pour récupérer le token
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: "admin@clinique.com",
      password: "admin123",
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  // On vérifie que le login a fonctionné
  check(loginRes, { "login status is 200": (r) => r.status === 200 });

  return { token: loginRes.json("token") }; // Retourne le token récupéré
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json",
  };

  // Appel authentifié
  const res = http.get(`${BASE_URL}/appointments`, { headers });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}

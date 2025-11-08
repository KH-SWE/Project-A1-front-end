import { api } from "./api";

export async function fetchMe() {
  const { data } = await api.get("/api/users/me");
  return data; // { id, username, email }
}
export function getVoterId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  let id = window.localStorage.getItem("voter_id");

  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("voter_id", id);
  }

  return id;
}

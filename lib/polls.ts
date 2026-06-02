import { supabase } from "./supabase";

export async function getPolls() {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*)
    `);

  if (error) throw error;

  return data;
}
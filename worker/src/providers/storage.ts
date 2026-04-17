export async function uploadExportPayload(input: {
  fileName: string;
  payload: unknown;
}) {
  const json = JSON.stringify(input.payload, null, 2);
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  }

  const path = `exports/${input.fileName}`;
  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: json,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar arquivo para o storage: ${body}`);
  }

  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${path}`;
}

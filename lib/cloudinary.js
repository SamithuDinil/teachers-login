const CLOUD_NAME = "drmmn0xp3";
const UPLOAD_PRESET = "teachers login";

export async function uploadPhoto(blob) {
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  body.append("upload_preset", UPLOAD_PRESET);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body,
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return { url: data.secure_url, publicId: data.public_id };
  } catch (err) {
    if (err.name === "AbortError") throw new Error("timeout");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

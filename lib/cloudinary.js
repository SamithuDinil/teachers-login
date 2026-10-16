const CLOUD_NAME = "drmmn0xp3";
const UPLOAD_PRESET = "teachers login";

export async function uploadPhoto(blob) {
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  body.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body });
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error?.message || "upload failed");

  return { url: data.secure_url, publicId: data.public_id };
}

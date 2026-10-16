export const emptyTransfer = () => ({ place: "", from: "", to: "" });

export const emptyForm = () => ({
  photo: "",
  fullName: "",
  salaryName: "",
  salaryNumber: "",
  gender: "",
  dob: "",
  nic: "",
  permanentAddress: "",
  temporaryAddress: "",
  phone: "",
  whatsapp: "",
  email: "",
  firstAppointmentDate: "",
  appointmentNumber: "",
  appointmentSubject: "",
  teachingSubject: "",
  firstAppointmentPlace: "",
  previousTransfers: [emptyTransfer()],
  newServicePlace: "",
  newTransferLetterNo: "",
  newTransferDate: "",
  released: false,
  releaseLetterNo: "",
  releaseDate: "",
  releasePlace: "",
  zonalOffice: "",
  retirementDate: ""
});

const nicPattern = /^(\d{9}[vVxX]|\d{12})$/;
const phonePattern = /^0\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = "සම්පූර්ණ නම ඇතුළත් කරන්න";
  if (!f.gender) e.gender = "ස්ත්‍රී / පුරුෂ භාවය තෝරන්න";
  if (!f.nic.trim()) e.nic = "ජාතික හැඳුනුම්පත් අංකය ඇතුළත් කරන්න";
  else if (!nicPattern.test(f.nic.trim())) e.nic = "අංකය වලංගු නොවේ (9 ඉලක්කම් + V/X හෝ ඉලක්කම් 12)";
  if (!f.phone.trim()) e.phone = "දුරකථන අංකය ඇතුළත් කරන්න";
  else if (!phonePattern.test(f.phone.replace(/\s/g, ""))) e.phone = "අංකය ඉලක්කම් 10ක් විය යුතුය (0771234567)";
  if (f.whatsapp.trim() && !phonePattern.test(f.whatsapp.replace(/\s/g, ""))) e.whatsapp = "අංකය ඉලක්කම් 10ක් විය යුතුය";
  if (f.email.trim() && !emailPattern.test(f.email.trim())) e.email = "ඊමේල් ලිපිනය වලංගු නොවේ";
  return e;
}

export function resizeImage(file, max = 900) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

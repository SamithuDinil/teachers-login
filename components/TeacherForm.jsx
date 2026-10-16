"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { push, ref, serverTimestamp, set as dbSet } from "firebase/database";
import { db } from "@/lib/firebase";
import { uploadPhoto } from "@/lib/cloudinary";
import { emptyForm, emptyTransfer, resizeImage, validate } from "@/lib/form";

const services = ["පරිපාලන සේවය", "විදුහල්පති සේවය", "ශ්‍රී ලං. ගු. සේවය", "අනධ්‍යයන සේවය"];

const sections = [
  { id: "service", title: "සේවා වර්ගය හා ශ්‍රේණිය" },
  { id: "personal", title: "පෞද්ගලික තොරතුරු" },
  { id: "contact", title: "සම්බන්ධතා" },
  { id: "appointment", title: "පත්වීම් විස්තර" },
  { id: "transfers", title: "පෙර ස්ථාන මාරු", heading: "පෙර ස්ථාන මාරු ලැබූ ස්ථානය හා වර්ෂය" },
  { id: "current", title: "නව සේවා ස්ථානය" }
];

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

function Brand({ compact }) {
  return (
    <div className={`brand${compact ? " compact" : ""}`}>
      <Image src="/logo.png" alt="ශ්‍රී සුමංගල විද්‍යාලයේ ලාංඡනය" width={1037} height={1011} className="logo" priority />
      <div>
        <p className="school">ශ්‍රී සුමංගල විද්‍යාලය</p>
        <p className="school-en">Sri Sumangala College</p>
      </div>
    </div>
  );
}

function Section({ id, children }) {
  const index = sections.findIndex((s) => s.id === id);
  return (
    <section id={id} className="block">
      <header className="block-head">
        <span className="num">{index + 1}</span>
        <h2>{sections[index].heading || sections[index].title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ name, label, error, wide, children }) {
  return (
    <div className={`field${wide ? " wide" : ""}`} data-error={error ? "true" : undefined}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export default function TeacherForm() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [active, setActive] = useState(sections[0].id);
  const [saved, setSaved] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);
  const recordRef = useRef(null);
  const uploadedRef = useRef(null);

  const requiredFields = [form.serviceType, form.grade.trim(), form.fullName.trim(), form.gender, form.nic.trim(), form.phone.trim()];
  const requiredDone = requiredFields.filter(Boolean).length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [status]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const bind = (name, extra = {}) => ({
    id: name,
    name,
    value: form[name],
    onChange: (e) => set(name, e.target.value),
    ...extra
  });

  const setTransfer = (index, key, value) =>
    setForm((f) => ({
      ...f,
      previousTransfers: f.previousTransfers.map((t, i) => (i === index ? { ...t, [key]: value } : t))
    }));

  const addTransfer = () => setForm((f) => ({ ...f, previousTransfers: [...f.previousTransfers, emptyTransfer()] }));

  const removeTransfer = (index) =>
    setForm((f) => ({
      ...f,
      previousTransfers: f.previousTransfers.length === 1 ? [emptyTransfer()] : f.previousTransfers.filter((_, i) => i !== index)
    }));

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blob = await resizeImage(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      setErrors((x) => ({ ...x, photo: undefined }));
    } catch {
      setErrors((x) => ({ ...x, photo: "ඡායාරූපය කියවීමට නොහැකි විය" }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "saving") return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    try {
      let photo = { url: "", publicId: "" };
      if (photoFile) {
        try {
          if (uploadedRef.current?.file !== photoFile) {
            uploadedRef.current = { file: photoFile, data: await uploadPhoto(photoFile) };
          }
          photo = uploadedRef.current.data;
        } catch (err) {
          setErrorMsg(`ඡායාරූපය උඩුගත කිරීමට නොහැකි විය: ${err.message}`);
          setStatus("error");
          return;
        }
      }
      const payload = {
        ...form,
        photo: photo.url,
        photoPublicId: photo.publicId,
        phone: form.phone.replace(/\s/g, ""),
        whatsapp: form.whatsapp.replace(/\s/g, ""),
        nic: form.nic.trim().toUpperCase(),
        previousTransfers: form.previousTransfers.filter((t) => t.place || t.from || t.to),
        createdAt: serverTimestamp()
      };
      if (!recordRef.current) recordRef.current = push(ref(db, "teachers"));
      await withTimeout(dbSet(recordRef.current, payload), 20000);
      recordRef.current = null;
      uploadedRef.current = null;
      setSaved(form.fullName);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const text = String(err?.code || err?.message || "").toLowerCase();
      setErrorMsg(
        text.includes("permission")
          ? "දත්ත ගබඩාවට ලිවීමට අවසර නැත. Firebase Realtime Database rules පරීක්ෂා කරන්න."
          : text.includes("timeout")
            ? "සම්බන්ධතාව ප්‍රමාද විය. අන්තර්ජාලය පරීක්ෂා කර නැවත සුරකින්න."
            : ""
      );
      setStatus("error");
    }
  }

  function reset() {
    setForm(emptyForm());
    setErrors({});
    setStatus("idle");
    setSaved("");
    setErrorMsg("");
    recordRef.current = null;
    uploadedRef.current = null;
    clearPhoto();
  }

  if (status === "done") {
    return (
      <main className="done">
        <div className="done-card" role="status">
          <Image src="/logo.png" alt="ශ්‍රී සුමංගල විද්‍යාලයේ ලාංඡනය" width={1037} height={1011} className="done-logo" />
          <span className="tick" aria-hidden="true">✓</span>
          <h1>සාර්ථකව සුරකින ලදී</h1>
          <p>{saved} මහතා/මහත්මියගේ තොරතුරු දත්ත ගබඩාවට එක් කරන ලදී.</p>
          <button type="button" className="primary" onClick={reset}>තවත් ගුරුවරයෙකු ඇතුළත් කරන්න</button>
        </div>
      </main>
    );
  }

  return (
    <div className="app">
      <aside className="side">
        <Brand />
        <div className="side-title">
          <p>අධ්‍යයන / අනධ්‍යයන තොරතුරු පත්‍රිකාව</p>
          <span>2026</span>
        </div>
        <nav className="toc" aria-label="කොටස්">
          {sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : ""}>
              <span className="dot">{i + 1}</span>
              {s.title}
            </a>
          ))}
        </nav>
        <div className="progress" aria-live="polite">
          <div className="progress-text">
            <span>අනිවාර්ය ක්ෂේත්‍ර</span>
            <b>{requiredDone} / {requiredFields.length}</b>
          </div>
          <div className="track"><div className="fill" style={{ width: `${(requiredDone / requiredFields.length) * 100}%` }} /></div>
        </div>
      </aside>

      <main className="content">
        <header className="page-head">
          <h1>අධ්‍යයන / අනධ්‍යයන තොරතුරු පත්‍රිකාව</h1>
          <p>සියලු විස්තර නිවැරදිව පුරවන්න. <span className="req-mark">*</span> ලකුණ ඇති ක්ෂේත්‍ර අනිවාර්ය වේ.</p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <Section id="service">
            <div className="grid">
              <div className="field wide" data-error={errors.serviceType ? "true" : undefined}>
                <span className="label-text">සේවා වර්ගය <b className="req-mark">*</b></span>
                <div className="options" role="radiogroup" aria-label="සේවා වර්ගය">
                  {services.map((service) => (
                    <label key={service} className={`option${form.serviceType === service ? " on" : ""}`}>
                      <input type="radio" name="serviceType" value={service} checked={form.serviceType === service} onChange={() => set("serviceType", service)} />
                      <span className="box" aria-hidden="true" />
                      {service}
                    </label>
                  ))}
                </div>
                {errors.serviceType && <p className="error" role="alert">{errors.serviceType}</p>}
              </div>
              <Field name="grade" label={<>ශ්‍රේණිය <b className="req-mark">*</b></>} error={errors.grade}>
                <input {...bind("grade")} />
              </Field>
            </div>
          </Section>

          <Section id="personal">
            <div className="personal-grid">
              <div className="photo-col">
                <button type="button" className={`photo${photoPreview ? " has" : ""}`} onClick={() => fileRef.current?.click()} aria-label="ඡායා රූපය තෝරන්න">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="ඡායා රූපය" />
                  ) : (
                    <span><i aria-hidden="true">+</i>ඡායා රූපය<small>තෝරන්න</small></span>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} hidden />
                {photoPreview && (
                  <button type="button" className="link" onClick={clearPhoto}>ඉවත් කරන්න</button>
                )}
                {errors.photo && <p className="error">{errors.photo}</p>}
              </div>

              <div className="grid">
                <Field name="fullName" label={<>සම්පූර්ණ නම <b className="req-mark">*</b></>} error={errors.fullName} wide>
                  <input {...bind("fullName")} autoComplete="name" />
                </Field>
                <Field name="salaryName" label="වැටුප් ලේඛනයේ නම සඳහන් ආකාරය" wide>
                  <input {...bind("salaryName")} />
                </Field>
                <Field name="salaryNumber" label="වැටුප් අංකය">
                  <input {...bind("salaryNumber")} inputMode="numeric" />
                </Field>
                <Field name="dob" label="උපන් දිනය">
                  <input {...bind("dob", { type: "date" })} />
                </Field>
                <div className="field" data-error={errors.gender ? "true" : undefined}>
                  <span className="label-text">ස්ත්‍රී / පුරුෂ <b className="req-mark">*</b></span>
                  <div className="segmented" role="radiogroup" aria-label="ස්ත්‍රී / පුරුෂ">
                    {["ස්ත්‍රී", "පුරුෂ"].map((g) => (
                      <label key={g} className={form.gender === g ? "on" : ""}>
                        <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set("gender", g)} />
                        {g}
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="error" role="alert">{errors.gender}</p>}
                </div>
                <Field name="nic" label={<>ජාතික හැඳුනුම්පත් අංකය <b className="req-mark">*</b></>} error={errors.nic}>
                  <input {...bind("nic")} autoCapitalize="characters" />
                </Field>
              </div>
            </div>
          </Section>

          <Section id="contact">
            <div className="grid">
              <Field name="permanentAddress" label="ස්ථිර ලිපිනය" wide>
                <textarea {...bind("permanentAddress", { rows: 2 })} />
              </Field>
              <Field name="temporaryAddress" label="තාවකාලික ලිපිනය" wide>
                <textarea {...bind("temporaryAddress", { rows: 2 })} />
              </Field>
              <Field name="phone" label={<>දුරකථන අංකය <b className="req-mark">*</b></>} error={errors.phone}>
                <input {...bind("phone", { type: "tel", inputMode: "tel", autoComplete: "tel" })} />
              </Field>
              <Field name="whatsapp" label="WhatsApp අංකය" error={errors.whatsapp}>
                <input {...bind("whatsapp", { type: "tel", inputMode: "tel" })} />
              </Field>
              <Field name="email" label="ඊමේල් ලිපිනය" error={errors.email} wide>
                <input {...bind("email", { type: "email", autoComplete: "email" })} />
              </Field>
            </div>
          </Section>

          <Section id="appointment">
            <div className="grid">
              <Field name="firstAppointmentDate" label="මුල් පත්වීමේ දිනය">
                <input {...bind("firstAppointmentDate", { type: "date" })} />
              </Field>
              <Field name="appointmentNumber" label="පත්වීම් අංකය">
                <input {...bind("appointmentNumber")} />
              </Field>
              <Field name="appointmentSubject" label="පත්වීම් විෂය">
                <input {...bind("appointmentSubject")} />
              </Field>
              <Field name="teachingSubject" label="උගන්වනු ලබන විෂයය">
                <input {...bind("teachingSubject")} />
              </Field>
              <Field name="firstAppointmentPlace" label="මුල් පත්වීම් ලද ස්ථානය" wide>
                <input {...bind("firstAppointmentPlace")} />
              </Field>
            </div>
          </Section>

          <Section id="transfers">
            <div className="transfers">
              {form.previousTransfers.map((t, i) => (
                <div className="transfer" key={i}>
                  <div className="field">
                    <label htmlFor={`t-place-${i}`}>ස්ථානය</label>
                    <input id={`t-place-${i}`} value={t.place} onChange={(e) => setTransfer(i, "place", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`t-from-${i}`}>සිට</label>
                    <input id={`t-from-${i}`} type="date" value={t.from} onChange={(e) => setTransfer(i, "from", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`t-to-${i}`}>දක්වා</label>
                    <input id={`t-to-${i}`} type="date" value={t.to} onChange={(e) => setTransfer(i, "to", e.target.value)} />
                  </div>
                  <button type="button" className="icon" onClick={() => removeTransfer(i)} aria-label="පේළිය ඉවත් කරන්න">×</button>
                </div>
              ))}
              <button type="button" className="ghost" onClick={addTransfer}>+ තවත් ස්ථානයක් එක් කරන්න</button>
            </div>
          </Section>

          <Section id="current">
            <div className="grid">
              <Field name="newServicePlace" label="නව සේවා ස්ථානය" wide>
                <input {...bind("newServicePlace")} />
              </Field>
              <Field name="newTransferLetterNo" label="නව සේවා ස්ථාන මාරු ලිපි අංකය">
                <input {...bind("newTransferLetterNo")} />
              </Field>
              <Field name="newTransferDate" label="දිනය">
                <input {...bind("newTransferDate", { type: "date" })} />
              </Field>
            </div>
          </Section>


          <div className="bar">
            <p className={status === "error" ? "msg bad" : "msg"} role="status">
              {status === "error" && (errorMsg || "සුරැකීමට නොහැකි විය. අන්තර්ජාල සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.")}
              {status === "idle" && Object.values(errors).some(Boolean) && "රතු පැහැයෙන් දැක්වෙන ක්ෂේත්‍ර නිවැරදි කරන්න."}
            </p>
            <button type="submit" className="primary" disabled={status === "saving"}>
              {status === "saving" ? "සුරකිමින්..." : "තොරතුරු සුරකින්න"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

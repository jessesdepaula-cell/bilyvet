import jsPDF from "jspdf";

// ==== Tipos ====
export type ReceitaClinica = {
  name: string;              // nome fantasia (ou razao social)
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  logoUrl?: string | null;   // data URI (base64)
};

export type ReceitaPaciente = {
  name: string;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  color?: string | null;
  microchip?: string | null;
  birthDate?: Date | string | null;
  weightKg?: number | string | null;
};

export type ReceitaTutor = {
  name: string;
  document?: string | null;
  address?: string | null;
  phone?: string | null;
};

export type ReceitaItem = {
  medication: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  guidelines?: string | null;
};

export type ReceitaVet = { name: string; crmv?: string | null };

export type ReceitaInput = {
  clinic: ReceitaClinica;
  pet: ReceitaPaciente;
  tutor: ReceitaTutor;
  vet: ReceitaVet;
  items: ReceitaItem[];
  printedBy: string;
  weightKg?: number | string | null;   // peso aferido na consulta (tem prioridade sobre o do cadastro)
  observations?: string | null;
  recommendReturn?: Date | string | null;
};

// ==== Layout (mm, A4 retrato) ====
const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;                 // margem lateral
const RIGHT = PAGE_W - M;
const BOTTOM = PAGE_H - 20;   // limite antes do rodape
const HEADER_INFO_Y = 46;     // linha "Impresso em / Por / Pag."

// ==== Helpers ====
const s = (v: unknown) => {
  const t = v == null ? "" : String(v).trim();
  return t || "-";
};

/**
 * Datas sem hora (nascimento, retorno) sao gravadas como meia-noite UTC.
 * Lidas com getters locais em fuso negativo elas "voltam" um dia - por isso
 * o calendario e reconstruido a partir das partes UTC.
 */
function dataPura(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const raw = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(raw.getTime())) return null;
  return new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate());
}

export function idadeExtenso(birth: Date | string | null | undefined, hoje = new Date()): string {
  const b = dataPura(birth);
  if (!b || b > hoje) return "-";

  let years = hoje.getFullYear() - b.getFullYear();
  let months = hoje.getMonth() - b.getMonth();
  let days = hoje.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    // dias do mes imediatamente anterior ao atual
    days += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(years + (years === 1 ? " ano" : " anos"));
  if (months > 0) parts.push(months + (months === 1 ? " mes" : " meses"));
  if (days > 0 || parts.length === 0) parts.push(days + (days === 1 ? " dia" : " dias"));
  return parts.join(", ");
}

function sexoExtenso(sex?: string | null) {
  const v = (sex || "").trim().toUpperCase();
  if (v === "M" || v === "MACHO") return "Macho";
  if (v === "F" || v === "FEMEA" || v === "FÊMEA") return "Fêmea";
  return "-";
}

function pesoExtenso(w?: number | string | null) {
  const n = typeof w === "string" ? parseFloat(w.replace(",", ".")) : w;
  if (n == null || Number.isNaN(n) || n <= 0) return "-";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 }) + " kg";
}

function linhaCidade(c: ReceitaClinica) {
  const cidadeUf = [c.city, c.state].filter(Boolean).join("/");
  const cep = c.zipCode ? "CEP: " + c.zipCode : "";
  return [cidadeUf, cep].filter(Boolean).join(" - ");
}

/** Cabecalho da clinica (logo + nome + endereco) + titulo "Receita". */
function drawClinicHeader(doc: jsPDF, c: ReceitaClinica) {
  let textX = M;
  let y = 16;

  if (c.logoUrl && c.logoUrl.startsWith("data:image")) {
    try {
      const fmt = /image\/jpe?g/.test(c.logoUrl) ? "JPEG" : "PNG";
      doc.addImage(c.logoUrl, fmt, M, 12, 24, 24, undefined, "FAST");
      textX = M + 28;
    } catch {
      // logo invalida: emite a receita sem ela
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(s(c.name).toUpperCase(), textX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const linhas = [c.address, linhaCidade(c), c.phone, c.cnpj ? "CNPJ: " + c.cnpj : ""]
    .map((l) => (l || "").trim())
    .filter(Boolean);
  for (const l of linhas) {
    doc.text(l.toUpperCase(), textX, y);
    y += 4;
  }

  const baseY = Math.max(y, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Receita", PAGE_W / 2, baseY, { align: "center" });

  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(M, baseY + 3, RIGHT, baseY + 3);
}

/** Linha "Impresso em / Por". O "Pag. x / y" e carimbado no final. */
function drawPrintLine(doc: jsPDF, printedBy: string) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const now = new Date();
  const agora = now.toLocaleDateString("pt-BR") + " " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  doc.text("Impresso em: " + agora + "   Por: " + printedBy, M, HEADER_INFO_Y);
}

/** Bloco paciente/responsavel em duas colunas. Devolve o Y logo abaixo. */
function drawPatient(doc: jsPDF, pet: ReceitaPaciente, tutor: ReceitaTutor, weight?: number | string | null) {
  const colL = M;
  const colR = M + 92;
  let y = HEADER_INFO_Y + 7;

  const label = (t: string, v: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(t, x, yy);
    const w = doc.getTextWidth(t);
    doc.setFont("helvetica", "normal");
    doc.text(v, x + w + 1.5, yy);
  };

  label("Animal:", s(pet.name), colL, y);
  label("Peso:", pesoExtenso(weight ?? pet.weightKg), colR, y);
  y += 4.6;

  label("Espécie:", s(pet.species), colL, y);
  label("Sexo:", sexoExtenso(pet.sex), colR, y);
  y += 4.6;

  label("Raça:", s(pet.breed), colL, y);
  label("Idade:", idadeExtenso(pet.birthDate), colR, y);
  y += 4.6;

  label("Pelagem:", s(pet.color), colL, y);
  label("Chip:", s(pet.microchip), colR, y);
  y += 4.6;

  label("Responsável:", s(tutor.name), colL, y);
  label("CPF:", s(tutor.document), colR, y);
  y += 4.6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Endereço:", colL, y);
  const endX = colL + doc.getTextWidth("Endereço:") + 1.5;
  doc.setFont("helvetica", "normal");
  const endLines: string[] = doc.splitTextToSize(s(tutor.address), RIGHT - endX);
  doc.text(endLines, endX, y);
  y += 4.6 * endLines.length;

  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(M, y - 1, RIGHT, y - 1);

  return y + 5;
}

/** Monta o PDF da receita. Devolve o doc jsPDF (o caller decide salvar/abrir). */
export function montarReceitaPDF(input: ReceitaInput): jsPDF {
  const { clinic, pet, tutor, vet, items, printedBy } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawClinicHeader(doc, clinic);
  drawPrintLine(doc, printedBy);
  let y = drawPatient(doc, pet, tutor, input.weightKg);

  // Paginas seguintes repetem o cabecalho da clinica, sem o bloco do paciente.
  const ensure = (needed: number) => {
    if (y + needed <= BOTTOM) return;
    doc.addPage();
    drawClinicHeader(doc, clinic);
    drawPrintLine(doc, printedBy);
    y = HEADER_INFO_Y + 8;
  };

  const usados = items.filter((i) => (i.medication || "").trim());

  usados.forEach((item, idx) => {
    ensure(16);

    const titulo = idx + 1 + ") " + item.medication.trim();
    const dose = (item.dosage || "").trim();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(titulo, M, y);
    const tituloW = doc.getTextWidth(titulo);

    // "____ uso veterinário ____" preenchendo o vao entre o nome e a dose
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const usoTxt = " uso veterinário ";
    const usoW = doc.getTextWidth(usoTxt);
    const doseW = dose ? doc.getTextWidth(dose) + 2 : 0;
    const livre = RIGHT - (M + tituloW) - doseW - usoW;
    if (livre > 4) {
      const tracoW = doc.getTextWidth("_");
      const fill = "_".repeat(Math.max(1, Math.floor(livre / 2 / tracoW)));
      const fillW = doc.getTextWidth(fill);
      doc.setTextColor(130);
      doc.text(fill, M + tituloW, y);
      doc.setTextColor(0);
      doc.text(usoTxt, M + tituloW + fillW, y);
      doc.setTextColor(130);
      doc.text(fill, M + tituloW + fillW + usoW, y);
      doc.setTextColor(0);
    } else {
      doc.setTextColor(130);
      doc.text(usoTxt, M + tituloW, y);
      doc.setTextColor(0);
    }
    if (dose) {
      doc.setFont("helvetica", "bold");
      doc.text(dose, RIGHT, y, { align: "right" });
    }
    y += 5;

    // Posologia: frequencia + duracao + orientacoes do item
    const posologia = [item.frequency, item.duration].map((v) => (v || "").trim()).filter(Boolean).join(", ");
    const corpo = [posologia, (item.guidelines || "").trim()].filter(Boolean).join(". ");
    if (corpo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines: string[] = doc.splitTextToSize(corpo, RIGHT - M);
      for (const l of lines) {
        ensure(6);
        doc.text(l, M, y);
        y += 4.4;
      }
    }
    y += 3.5;
  });

  // Orientacoes gerais (texto livre da ficha)
  const obs = (input.observations || "").trim();
  if (obs) {
    ensure(12);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Orientações", M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const raw of obs.split("\n")) {
      const lines: string[] = doc.splitTextToSize(raw.trim() || " ", RIGHT - M);
      for (const l of lines) {
        ensure(6);
        doc.text(l, M, y);
        y += 4.4;
      }
    }
    y += 3;
  }

  const retorno = dataPura(input.recommendReturn);
  if (retorno) {
    {
      const d = retorno;
      ensure(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Retornar em " + d.toLocaleDateString("pt-BR") + ".", M, y);
      y += 8;
    }
  }

  // ==== Assinatura ====
  ensure(34);
  y += 6;
  const cidadeUf = [clinic.city, clinic.state].filter(Boolean).join(", ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    (cidadeUf ? cidadeUf.toUpperCase() + ", " : "") + new Date().toLocaleDateString("pt-BR"),
    M,
    y
  );
  y += 18;

  const cx = PAGE_W / 2;
  doc.setDrawColor(60);
  doc.setLineWidth(0.3);
  doc.line(cx - 35, y, cx + 35, y);
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(s(vet.name), cx, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(vet.crmv ? "CRMV: " + vet.crmv : "Médico(a) Veterinário(a)", cx, y, { align: "center" });

  // ==== Carimbo "Pag. x / y" em todas as paginas ====
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(90);
    doc.text("Pág. " + p + " / " + total, RIGHT, HEADER_INFO_Y, { align: "right" });
    doc.setTextColor(0);
  }

  return doc;
}

export function gerarReceitaPDF(input: ReceitaInput, fileName?: string) {
  const doc = montarReceitaPDF(input);
  const slug = (input.pet.name || "paciente")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  doc.save(fileName || "receita-" + (slug || "paciente") + ".pdf");
}

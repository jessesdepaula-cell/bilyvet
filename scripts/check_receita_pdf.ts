// Auto-checagem da receita: npx tsx scripts/check_receita_pdf.ts
import assert from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { idadeExtenso, montarReceitaPDF } from "../src/lib/receita-pdf";

// ---- idade em anos, meses e dias ----
const hoje = new Date(2026, 7, 1); // 01/08/2026
assert.strictEqual(idadeExtenso("2021-10-19", hoje), "4 anos, 9 meses, 13 dias");
assert.strictEqual(idadeExtenso(new Date(2026, 7, 1), hoje), "0 dias");
assert.strictEqual(idadeExtenso(new Date(2026, 6, 1), hoje), "1 mes");
assert.strictEqual(idadeExtenso(new Date(2025, 7, 1), hoje), "1 ano");
// virada de mes com dia negativo (31/03 -> 01/08 nao pode dar dias negativos)
assert.ok(!idadeExtenso(new Date(2026, 2, 31), hoje).includes("-"));
assert.strictEqual(idadeExtenso(null), "-");
assert.strictEqual(idadeExtenso(new Date(2027, 0, 1), hoje), "-", "nascimento no futuro nao tem idade");

// ---- receita renderiza com e sem logo, e pagina quando estoura ----
const base = {
  clinic: {
    name: "VETZ",
    address: "Estrada Cachamorra 350, bloco 3, loja 133",
    city: "Rio de Janeiro", state: "RJ", zipCode: "23040-150",
    phone: "(21) 98186-1032", cnpj: null, logoUrl: null,
  },
  pet: {
    name: "Belinha", species: "Canina", breed: "Lhasa Apso", sex: "F",
    color: null, microchip: null, birthDate: "2021-10-19", weightKg: 8.5,
  },
  tutor: {
    name: "Anderlucia Ana da Silva", document: "099.147.427-93",
    address: "Estrada do Moinho 712, Rua 4 QD D n29 - Campo Grande - Rio de Janeiro/RJ",
    phone: null,
  },
  vet: { name: "Bruna Coutinho", crmv: "RJ 17.412" },
  printedBy: "Bruna",
};

const um = montarReceitaPDF({
  ...base,
  items: [
    { medication: "Alergovet", dosage: "1,4mg", frequency: "1 comprimido a cada 24 horas", duration: "por 7 dias" },
    { medication: "Simparic", dosage: "5,1-10 kg", frequency: "1 comprimido via oral, dose unica", duration: "repetir a cada 35 dias" },
  ],
  observations: "Banhos de 7 em 7 dias.",
  recommendReturn: "2026-08-11",
});
assert.strictEqual(um.getNumberOfPages(), 1, "receita curta cabe em 1 pagina");

const muitos = montarReceitaPDF({
  ...base,
  items: Array.from({ length: 40 }, (_, i) => ({
    medication: `Medicamento ${i + 1}`,
    dosage: "500mg",
    frequency: "1 comprimido a cada 12 horas",
    duration: "por 10 dias",
    guidelines: "Administrar sempre apos a refeicao, com o animal contido e supervisionado pelo tutor.",
  })),
});
assert.ok(muitos.getNumberOfPages() > 1, "receita longa precisa paginar");

// logo valida TEM que ser desenhada - o catch do addImage ja engoliu um erro
// em silencio e o cabecalho saiu sem logo sem ninguem perceber
const LOGO_OK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGMUqYhiwAaYsIoOWgkAuKYA9oPkEv4AAAAASUVORK5CYII=";
const comLogo = montarReceitaPDF({
  ...base,
  clinic: { ...base.clinic, logoUrl: LOGO_OK },
  items: [{ medication: "Alergovet", dosage: "1,4mg" }],
});
assert.ok(
  Buffer.from(comLogo.output("arraybuffer")).toString("latin1").includes("/Subtype /Image"),
  "logo valida precisa virar imagem no PDF"
);

// logo invalida nao pode derrubar a emissao
const comLogoQuebrada = montarReceitaPDF({
  ...base,
  clinic: { ...base.clinic, logoUrl: "data:image/png;base64,NAO-E-UMA-IMAGEM" },
  items: [{ medication: "Alergovet", dosage: "1,4mg" }],
});
assert.strictEqual(comLogoQuebrada.getNumberOfPages(), 1);
assert.ok(
  !Buffer.from(comLogoQuebrada.output("arraybuffer")).toString("latin1").includes("/Subtype /Image"),
  "sem imagem quando a logo e invalida - prova que o assert acima tem valor"
);

// retorno tambem e data-pura: 11/08 tem que sair 11/08, nao 10/08
const texto = Buffer.from(um.output("arraybuffer")).toString("latin1");
assert.ok(texto.includes("Retornar em 11/08/2026"), "retorno nao pode escorregar um dia");
assert.ok(texto.includes("Belinha") && texto.includes("VETZ"), "paciente e clinica no PDF");

// ---- NOVO: receita com texto livre (espaco unico e amplo) ----
const comTextoLivre = montarReceitaPDF({
  ...base,
  prescriptionText: `1) Amoxicilina + Clavulanato 250mg
   Administrar 1 comprimido a cada 12 horas por 10 dias.
   Orientacao: Sempre fornecer apos alimentacao.

2) Meloxicam 0,5mg
   Administrar 1 comprimido ao dia por 3 dias.`,
  vet: { name: "", crmv: "" }, // sem nome preenchido: deixa linha limpa para carimbo
});
const txtLivre = Buffer.from(comTextoLivre.output("arraybuffer")).toString("latin1");
assert.ok(txtLivre.includes("Amoxicilina"), "medicamento em texto livre presente no PDF");
assert.ok(txtLivre.includes("Meloxicam"), "segundo medicamento presente no PDF");
assert.ok(!txtLivre.includes("\n-\n"), "assinatura sem nome nao imprime tracinho solitario");

// ---- NOVO: veterinario especialista volante que acessa com a conta da clinica ----
const comEspecialista = montarReceitaPDF({
  ...base,
  prescriptionText: "1) Colirio Tobramicina - 1 gota em ambos os olhos a cada 8h por 7 dias.",
  vet: { name: "Dr. Marcelo Oftalmologista", crmv: "SP 99.888" },
});
const txtEsp = Buffer.from(comEspecialista.output("arraybuffer")).toString("latin1");
assert.ok(txtEsp.includes("Dr. Marcelo Oftalmologista"), "nome do especialista volante sai na assinatura");
assert.ok(txtEsp.includes("CRMV: SP 99.888"), "crmv do especialista volante sai na assinatura");


if (process.argv.includes("--pdf")) {
  // amostra visual com logo, pra conferir o encaixe do cabecalho
  const logoDeTeste = existsSync("scripts/.logo-teste.txt")
    ? readFileSync("scripts/.logo-teste.txt", "utf8").trim()
    : null;
  const amostra = montarReceitaPDF({
    ...base,
    clinic: { ...base.clinic, logoUrl: logoDeTeste },
    items: [
      { medication: "Alergovet", dosage: "1,4mg", frequency: "Administrar 1 comprimido a cada 24 horas", duration: "por 7 dias" },
      { medication: "Simparic", dosage: "5,1-10 kg", frequency: "Administrar 1 comprimido por via oral, dose unica", duration: "repetir a cada 35 dias" },
      { medication: "Sec Lac", dosage: "0,5mg", frequency: "Administrar 1 comprimido via oral a cada 12 horas", duration: "por 5 dias" },
    ],
    observations: "Banho Terapeutico\nHypcare Shampoo Extra Suave: molhar completamente o animal, aplicar o shampoo massageando toda a pele. Deixar agir por 10 minutos e enxaguar abundantemente.\nBanhos de 7 em 7 dias ou de 15 em 15 dias.",
    recommendReturn: "2026-08-11",
  });
  writeFileSync("receita-exemplo.pdf", Buffer.from(amostra.output("arraybuffer")));
  console.log("receita-exemplo.pdf gravada");
}

// Formatacao do cabecalho: o cadastro guarda so digitos, o papel precisa pontuado.
import { formatarTelefone, formatarCep, formatarCnpj } from "../src/lib/receita-pdf";
assert.strictEqual(formatarTelefone("21981861038"), "(21) 98186-1038", "celular com DDD");
assert.strictEqual(formatarTelefone("2132631032"), "(21) 3263-1032", "fixo com DDD");
assert.strictEqual(formatarCep("23040150"), "23040-150", "CEP");
assert.strictEqual(formatarCnpj("58153569000177"), "58.153.569/0001-77", "CNPJ");
// valor fora do padrao nao pode ser mutilado
assert.strictEqual(formatarTelefone("123"), "123", "telefone curto sai intacto");
assert.strictEqual(formatarCep(""), "", "vazio continua vazio");

console.log("OK - receita-pdf");

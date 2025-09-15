import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------- Funções utilitárias ----------
function exportCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]).join(",");
  const csv = [
    header,
    ...rows.map(r =>
      Object.values(r)
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPDF(title: string, rows: any[]) {
  const doc = new jsPDF();
  doc.text(title, 14, 16);
  const table = rows.map(r => [
    r.nome, r.idade, r.sexo, r.bairro, r.tecnico
  ]);
  (doc as any).autoTable({
    head: [["Nome", "Idade", "Sexo", "Bairro", "Técnico"]],
    body: table,
    startY: 20,
  });
  doc.save(`${title}.pdf`);
}

// ---------- Tipagem ----------
type Caso = {
  id?: string;
  nome?: string;
  idade?: string;
  sexo?: string;
  bairro?: string;
  tecnico?: string;
  dataCad?: string;
  confirmacaoViolencia?: string;
  encerrado?: string; // "Sim"/"Não"
  reincidente?: string; // "Sim"/"Não"
  vitimaPCD?: string; // "Sim"/"Não"
};

const STORAGE = "vigilancia_cases_v1";
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b", "#0ea5e9"];

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.valueOf());
}

export default function PainelVigilancia() {
  const [list, setList] = useState<Caso[]>([]);
  const [modalData, setModalData] = useState<{ title: string; items: Caso[] } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      try {
        setList(JSON.parse(raw));
      } catch {
        setList([]);
      }
    }
  }, []);

  const now = new Date();

  // ---------- ALERTAS ----------
  // Últimos 30 dias
  const last30 = list.filter(c => {
    if (!c.dataCad) return false;
    const d = new Date(c.dataCad);
    return isValidDate(d) && (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  });

  const reincidentes = list.filter(c => c.reincidente === "Sim");
  const pcd = list.filter(c => c.vitimaPCD === "Sim");

  // Casos acima de 60 dias sem encerramento
  const acima60 = list.filter(c => {
    if (!c.dataCad || c.encerrado === "Sim") return false;
    const d = new Date(c.dataCad);
    return isValidDate(d) && (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) > 60;
  });

  // Casos por bairro críticos (>= 5 casos)
  const bairroCount: Record<string, Caso[]> = {};
  for (const c of list) {
    const b = c.bairro || "Não informado";
    bairroCount[b] = bairroCount[b] || [];
    bairroCount[b].push(c);
  }
  const bairrosCriticos = Object.entries(bairroCount)
    .filter(([_, arr]) => arr.length >= 5)
    .flatMap(([_, arr]) => arr);

  // ---------- GRÁFICOS ----------
// Efetividade: gera dados para gráfico de pizza
const efetividadeData = useMemo(() => {
  const total = list.length;
  const encerrados = list.filter(c => c.encerrado === "Sim").length;
  const pendentes = total - encerrados;

  if (total === 0) {
    return [
      { name: "Efetivos", value: 0 },
      { name: "Pendentes", value: 1 } // evita gráfico vazio
    ];
  }

  return [
    { name: "Efetivos", value: encerrados },
    { name: "Pendentes", value: pendentes }
  ];
}, [list]);

// Soma total para tooltip
const efetividadeTotal = useMemo(
  () => efetividadeData.reduce((acc, cur) => acc + (cur.value || 0), 0),
  [efetividadeData]
);

// Percentual pronto (para exibir em texto abaixo do gráfico)
const efetividadePercent = useMemo(() => {
  if (list.length === 0) return 0;
  const encerrados = list.filter(c => c.encerrado === "Sim").length;
  return Math.round((encerrados / list.length) * 100);
}, [list]);


  // Faixa etária
  const idadeBuckets = useMemo(() => {
    const buckets: Record<string, number> = {
      "<1": 0, "1-4": 0, "5-9": 0, "10-17": 0, "18-24": 0, "25-34": 0,
      "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0, "Não informado": 0
    };
    for (const c of list) {
      const raw = (c.idade || "").toString().trim();
      const n = parseInt(raw.replace(/\D/g, ""), 10);
      if (!raw || isNaN(n)) {
        buckets["Não informado"]++;
        continue;
      }
      if (n < 1) buckets["<1"]++;
      else if (n <= 4) buckets["1-4"]++;
      else if (n <= 9) buckets["5-9"]++;
      else if (n <= 17) buckets["10-17"]++;
      else if (n <= 24) buckets["18-24"]++;
      else if (n <= 34) buckets["25-34"]++;
      else if (n <= 44) buckets["35-44"]++;
      else if (n <= 54) buckets["45-54"]++;
      else if (n <= 64) buckets["55-64"]++;
      else buckets["65+"]++;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [list]);

  // Evolução temporal (confirmados)
  const evolucaoConfirmados = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of list) {
      if (!c.dataCad || c.confirmacaoViolencia !== "Confirmada") continue;
      const d = new Date(c.dataCad);
      if (!isValidDate(d)) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m[key] = (m[key] || 0) + 1;
    }
    return Object.entries(m).map(([k, v]) => ({ name: k, value: v }));
  }, [list]);

  // Confirmados x Reincidentes
  const confVsReinc = useMemo(() => {
    const confirmados = list.filter(c => c.confirmacaoViolencia === "Confirmada").length;
    const reinc = reincidentes.length;
    return [
      { name: "Confirmados", value: confirmados },
      { name: "Reincidentes", value: reinc }
    ];
  }, [list, reincidentes]);

  // Casos por bairro
  const casosPorBairro = useMemo(() => {
    return Object.entries(bairroCount).map(([name, arr]) => ({ name, value: arr.length }));
  }, [list]);

  // Tempo em acompanhamento
  const tempoAcompanhamento = useMemo(() => {
    const buckets: Record<string, number> = {
      "<30 dias": 0, "30-60 dias": 0, ">60 dias": 0
    };
    for (const c of list) {
      if (!c.dataCad || c.encerrado === "Sim") continue;
      const d = new Date(c.dataCad);
      if (!isValidDate(d)) continue;
      const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 30) buckets["<30 dias"]++;
      else if (diff <= 60) buckets["30-60 dias"]++;
      else buckets[">60 dias"]++;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [list]);

  // ---------- Modal ----------
  function openModal(title: string, items: Caso[]) {
    setModalData({ title, items });
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-purple-700">🛡️ Painel de Vigilância PAEFI</h1>
      <p className="text-gray-600">Monitoramento crítico dos casos e territórios</p>

      {/* ALERTAS (estilo original, mas clicáveis) */}
      <div className="space-y-3">
        <p
          className="cursor-pointer text-blue-700 hover:underline"
          onClick={() => openModal("Casos últimos 30 dias", last30)}
        >
          📈 {last30.length} casos registrados nos últimos 30 dias
        </p>
        <p
          className="cursor-pointer text-red-700 hover:underline"
          onClick={() => openModal("Reincidentes", reincidentes)}
        >
          🔁 {reincidentes.length} casos reincidentes
        </p>
        <p
          className="cursor-pointer text-pink-700 hover:underline"
          onClick={() => openModal("Vítimas PCD", pcd)}
        >
          ♿ {pcd.length} vítimas com deficiência
        </p>
        <p
          className="cursor-pointer text-yellow-700 hover:underline"
          onClick={() => openModal(">60 dias sem encerramento", acima60)}
        >
          ⚠️ {acima60.length} casos com acompanhamento acima de 60 dias sem encerramento
        </p>
        <p
          className="cursor-pointer text-indigo-700 hover:underline"
          onClick={() => openModal("Bairros Críticos", bairrosCriticos)}
        >
          🏘️ {bairrosCriticos.length} casos em bairros críticos (≥5 casos)
        </p>
      </div>

      {/* GRÁFICOS */}
      <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">🏘️ Casos por Bairro</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={casosPorBairro} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow">
  <h2 className="text-xl font-semibold mb-4">✅ Efetividade do PAEFI</h2>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={efetividadeData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={90}
        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
      >
        {efetividadeData.map((entry, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        formatter={(value: number, name: string) => {
          const pct =
            efetividadeTotal === 0 ? 0 : (value / efetividadeTotal) * 100;
          return [`${value}`, `${pct.toFixed(1)}%`];
        }}
      />
    </PieChart>
  </ResponsiveContainer>
  <div className="mt-3 text-center">
    <span className="text-sm text-gray-500">Efetividade</span>
    <div className="text-2xl font-bold">{efetividadePercent}%</div>
  </div>
</div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">📊 Distribuição por Faixa Etária</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={idadeBuckets}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow col-span-2">
          <h2 className="text-xl font-semibold mb-4">📈 Evolução Temporal (Confirmados)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoConfirmados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#9333ea" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">⚖️ Confirmados x Reincidentes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confVsReinc}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">⏳ Tempo em Acompanhamento</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tempoAcompanhamento}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-3/4 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-semibold mb-4">{modalData.title}</h3>
            <div className="flex gap-4 mb-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => exportCSV(`${modalData.title}.csv`, modalData.items)}
              >
                Exportar CSV
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => exportPDF(modalData.title, modalData.items)}
              >
                Exportar PDF
              </button>
            </div>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Nome</th>
                  <th className="p-2 border">Idade</th>
                  <th className="p-2 border">Sexo</th>
                  <th className="p-2 border">Bairro</th>
                  <th className="p-2 border">Técnico</th>
                </tr>
              </thead>
              <tbody>
                {modalData.items.map((c, i) => (
                  <tr key={i} className="text-center border-t">
                    <td className="p-2 border">{c.nome}</td>
                    <td className="p-2 border">{c.idade}</td>
                    <td className="p-2 border">{c.sexo}</td>
                    <td className="p-2 border">{c.bairro}</td>
                    <td className="p-2 border">{c.tecnico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setModalData(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




import { useState, useEffect } from "react";

type Caso = {
  id?: string;
  dataCad: string;
  tecRef: string;
  nome: string;
  cpf: string;
  nis: string;
  tipoViolencia: string;
  sexo: string;
  corEtnia: string;
  idade: string;
  escolaridade: string;
  bairro: string;
  tipoMoradia: string;
  rendaFamiliar: string;
  agressor?: string;
};

const STORAGE = "vigilancia_cases_v1";

export default function Consulta() {
  const [list, setList] = useState<Caso[]>([]);
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Caso | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE);
    if (raw) setList(JSON.parse(raw));
  }, []);

  function handleBuscar() {
    const encontrado = list.find(
      (c) =>
        c.nis === busca ||
        c.cpf === busca ||
        (c.nome && c.nome.toLowerCase().includes(busca.toLowerCase()))
    );
    if (encontrado) {
      setResultado(encontrado);
    } else {
      setResultado(null);
      alert("❌ Nenhum registro encontrado!");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-700">
          🔍 Consultar Vítima
        </h1>

        {/* Campo de busca */}
        <div className="bg-white p-6 rounded-xl shadow-md flex gap-4">
          <input
            type="text"
            placeholder="Digite NIS, CPF ou Nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleBuscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📋 Ficha da Vítima
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <p><b>Nome:</b> {resultado.nome}</p>
              <p><b>CPF:</b> {resultado.cpf}</p>
              <p><b>NIS:</b> {resultado.nis}</p>
              <p><b>Idade:</b> {resultado.idade}</p>
              <p><b>Sexo:</b> {resultado.sexo}</p>
              <p><b>Cor/Etnia:</b> {resultado.corEtnia}</p>
              <p><b>Escolaridade:</b> {resultado.escolaridade}</p>
              <p><b>Bairro:</b> {resultado.bairro}</p>
              <p><b>Tipo de Moradia:</b> {resultado.tipoMoradia}</p>
              <p><b>Renda Familiar:</b> {resultado.rendaFamiliar}</p>
              <p><b>Tipo de Violência:</b> {resultado.tipoViolencia}</p>
              <p><b>Agressor:</b> {resultado.agressor || "Não informado"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

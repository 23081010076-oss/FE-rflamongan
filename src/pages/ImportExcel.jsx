import { useState, useEffect, useRef } from "react";
import { paketService, opdService } from "../services";

const SUMBER_DANA_LIST = ["APBD", "APBN", "DAU", "DAK", "BLUD", "BK", "BANTUAN PROVINSI", "LAINNYA"];

export default function ImportExcel() {
  const [opds, setOpds] = useState([]);
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    opdId: "",
    sumberDana: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [opdSearch, setOpdSearch] = useState("");
  const [showOpdDropdown, setShowOpdDropdown] = useState(false);
  const opdRef = useRef(null);
  const fileRef = useRef(null);

  const years = Array.from(
    { length: new Date().getFullYear() - 2010 + 1 },
    (_, i) => new Date().getFullYear() - i,
  );

  useEffect(() => {
    opdService.getAll({}).then((data) => {
      setOpds(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (opdRef.current && !opdRef.current.contains(e.target)) {
        setShowOpdDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOpds = opds.filter(
    (o) =>
      o.name.toLowerCase().includes(opdSearch.toLowerCase()) ||
      o.code.toLowerCase().includes(opdSearch.toLowerCase()),
  );

  const selectedOpd = opds.find((o) => o.id === formData.opdId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Pilih file Excel terlebih dahulu");
    try {
      setLoading(true);
      setResult(null);
      const res = await paketService.importExcel(file, formData);
      setResult(res);
      if (res.success > 0) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Gagal mengimport data");
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    {
      no: 1,
      label: "TAHUN ANGGARAN",
      input: (
        <select
          value={formData.tahun}
          onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      ),
    },
    {
      no: 2,
      label: "OPD / INSTANSI",
      input: (
        <div ref={opdRef} className="relative">
          <input
            type="text"
            placeholder="- Pilih Instansi -"
            value={selectedOpd ? `${selectedOpd.code} - ${selectedOpd.name}` : opdSearch}
            onFocus={() => { setShowOpdDropdown(true); setOpdSearch(""); }}
            onChange={(e) => {
              setOpdSearch(e.target.value);
              setFormData({ ...formData, opdId: "" });
              setShowOpdDropdown(true);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          {showOpdDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
              <div
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-b"
                onClick={() => {
                  setFormData({ ...formData, opdId: "" });
                  setOpdSearch("");
                  setShowOpdDropdown(false);
                }}
              >
                - Semua / Dari Excel -
              </div>
              {filteredOpds.map((o) => (
                <div
                  key={o.id}
                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    setFormData({ ...formData, opdId: o.id });
                    setOpdSearch("");
                    setShowOpdDropdown(false);
                  }}
                >
                  <span className="font-semibold text-blue-700">{o.code}</span>
                  <span className="text-gray-600 ml-2">{o.name}</span>
                </div>
              ))}
              {filteredOpds.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      no: 3,
      label: "DANA",
      input: (
        <select
          value={formData.sumberDana}
          onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">- Pilih Sumber Dana -</option>
          {SUMBER_DANA_LIST.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      ),
    },
    {
      no: 4,
      label: "UPLOAD FILE (UNGGAH FILE EXCEL)",
      input: (
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0] || null)}
          className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-gray-50 file:cursor-pointer hover:file:bg-gray-100"
        />
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-gray-100 border border-gray-300 rounded-t px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">Import Data Dari Excel</span>
        </div>

        {/* Form table */}
        <table className="w-full border-collapse border border-t-0 border-gray-300 bg-white">
          <tbody>
            {rows.map((row) => (
              <tr key={row.no} className="border-b border-gray-200">
                <td className="w-10 border-r border-gray-200 px-3 py-3 text-sm text-gray-500 text-center align-middle bg-gray-50">
                  {row.no}.
                </td>
                <td className="w-56 border-r border-gray-200 px-4 py-3 text-xs font-semibold text-gray-600 uppercase align-middle bg-gray-50">
                  {row.label}
                </td>
                <td className="px-4 py-3 align-middle">{row.input}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Simpan button */}
        <div className="flex justify-center mt-5">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded shadow"
          >
            {loading ? "Memproses..." : "SIMPAN"}
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className={`mt-5 rounded border p-4 text-sm ${result.failed === 0 ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300"}`}>
          <p className="font-semibold mb-2">{result.message}</p>
          <div className="flex gap-6">
            <span className="text-green-700">✓ Berhasil: <strong>{result.success}</strong></span>
            {result.failed > 0 && <span className="text-red-600">✗ Gagal: <strong>{result.failed}</strong></span>}
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto">
              <p className="font-semibold text-amber-700 mb-1">Detail error:</p>
              <ul className="space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-red-600 text-xs">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

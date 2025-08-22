import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users, Search, CalendarDays, MapPin, BadgeCheck, ArrowRight,
  Factory, Globe, ChevronLeft, ChevronRight, Landmark, Store, Star
} from "lucide-react";
import { http } from '../lib/api'

const DETAIL_BASE = "/producers";
const PAGE_SIZE = 12;

type RegionLite = { code: string; name: string };
type DepartmentLite = { code: string; name: string; region?: RegionLite };

type City = {
  name: string;
  postal_code: string;
  department?: number | DepartmentLite;
  department_data?: DepartmentLite;
  region_data?: RegionLite;
};
type Address = {
  street_number?: string | null;
  street_name?: string | null;
  city?: City | null;
};
type Certification = { code: string; label?: string };
type Company = {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: Address | null;
  siret?: string | null;
  siret_number?: string | null;
  certifications?: Array<string | Certification>;
  region_data?: RegionLite | null;
  department_data?: DepartmentLite | null;
  is_active?: boolean;
  avg_rating?: string | number | null;
  ratings_count?: number | null;
};
type Producer = {
  id: number;
  public_display_name?: string | null;
  years_of_experience?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  description?: string | null;
  description_utilisateur?: string | null;
  joined_at?: string | null;
  commerces?: Company[];
  main_address?: Address | null;
  main_region_data?: RegionLite | null;
  main_department_data?: DepartmentLite | null;
  avg_rating?: string | number | null;
  ratings_count?: number | null;
};

type SortKey =
  | "recent"
  | "name"
  | "commerces"
  | "region"
  | "department"
  | "rating_desc"
  | "rating_asc";
type SortKeyCommerce =
  | "name"
  | "producer"
  | "region"
  | "department"
  | "rating_desc"
  | "rating_asc";
type ViewMode = "producer" | "commerce";



function producerName(p: Producer) {
  const disp = (p.public_display_name || "").trim();
  if (disp) return disp;
  return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Producteur";
}

function normalizeCerts(arr: Array<string | Certification> | undefined): Certification[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => (typeof c === "string" ? { code: c, label: c } : c));
}

function formatCityName(raw?: string | null) {
  if (!raw) return "";
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  const keepLower = new Set(["de", "du", "des", "la", "le", "les", "en", "sur", "sous", "aux", "au", "et"]);
  return s
    .split(" ")
    .map((word, idx) => {
      if (/^[a-z]’/.test(word) || /^[a-z]'/.test(word)) return word[0].toUpperCase() + word.slice(1);
      if (keepLower.has(word) && idx !== 0) return word;
      return word.split("-").map(seg => (seg ? seg[0].toUpperCase() + seg.slice(1) : seg)).join("-");
    })
    .join(" ");
}

function joinedText(iso?: string | null) {
  if (!iso) return "Membre récent";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Membre récent";
  return `Membre depuis ${d.toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}`;
}

function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }

function companyRegionName(c?: Company | null): string {
  if (!c) return "";
  return (
    c.region_data?.name ||
    (typeof c.address?.city?.department === "object" ? c.address?.city?.department?.region?.name || "" : "") ||
    c.address?.city?.region_data?.name ||
    ""
  );
}

function companyDepartmentName(c?: Company | null): string {
  if (!c) return "";
  return (
    c.department_data?.name ||
    (typeof c.address?.city?.department === "object" ? c.address?.city?.department?.name || "" : "") ||
    c.address?.city?.department_data?.name ||
    ""
  );
}

function producerRegionName(p: Producer): string {
  return p.main_region_data?.name || (p.commerces || []).map(companyRegionName).find(Boolean) || "";
}

function producerDepartmentName(p: Producer): string {
  return p.main_department_data?.name || (p.commerces || []).map(companyDepartmentName).find(Boolean) || "";
}

function producerCityName(p: Producer): string {
  return formatCityName(p.main_address?.city?.name) || formatCityName(p.commerces?.[0]?.address?.city?.name || "");
}

function StarsDisplay({ value = 0, size = 16 }: { value?: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const pct = (v / 5) * 100;
  const s: React.CSSProperties = { width: size, height: size };
  return (
    <span className="relative inline-block align-middle" style={{ lineHeight: 0 }}>
      <span className="flex text-gray-300 select-none">
        {Array.from({ length: 5 }).map((_, i) => <Star key={`o-${i}`} style={s} className="shrink-0" />)}
      </span>
      <span className="pointer-events-none absolute top-0 left-0 overflow-hidden text-yellow-500" style={{ width: `${pct}%` }} aria-hidden>
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => <Star key={`f-${i}`} style={s} className="shrink-0" fill="currentColor" />)}
        </span>
      </span>
    </span>
  );
}

type CommerceRow = {
  key: string;
  company: Company;
  producer: Producer;
};

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Tous les départements',
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (vals: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const buttonText =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? options.find(o => o.value === value[0])?.label || placeholder
      : `${options.find(o => o.value === value[0])?.label || ''} +${value.length - 1}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white rounded-xl border px-3 py-2.5 shadow-sm flex items-center justify-between text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{buttonText}</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto bg-white border rounded-xl shadow">
          <ul className="py-1" role="listbox" aria-multiselectable="true">
            {options.map(opt => (
              <li key={opt.value}>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={value.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  <span className="truncate">{opt.label}</span>
                </label>
              </li>
            ))}
          </ul>
          {value.length > 0 && (
            <div className="border-t p-2 text-right">
              <button
                className="text-sm text-dark-green hover:underline"
                onClick={() => onChange([])}
              >
                Effacer la sélection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function ProducersCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = (searchParams.get("view") as ViewMode) || "producer";
  const [view, setView] = useState<ViewMode>(viewParam);

  const listTopRef = React.useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [qInput, setQInput] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setQuery(qInput), 250);
    return () => clearTimeout(h);
  }, [qInput]);

  const [sort, setSort] = useState<SortKey>("recent");
  const [sortCommerce, setSortCommerce] = useState<SortKeyCommerce>("name");
  const [region, setRegion] = useState<string>("");
  const [departmentsSel, setDepartmentsSel] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await http.get<any[]>('/api/public/producers/');
        if (!alive) return;
        setProducers(Array.isArray(data) ? data : []);
      } catch {
        setError("Impossible de charger les producteurs.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const producerRegions = useMemo(() => {
    const all = producers.map(producerRegionName).filter(Boolean);
    return uniq(all).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [producers]);

  const commerceRegions = useMemo(() => {
    const all = producers.flatMap(p => (p.commerces || []).map(companyRegionName)).filter(Boolean);
    return uniq(all).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [producers]);

  const producerDepartments = useMemo(() => {
    const all = producers.map(producerDepartmentName).filter(Boolean);
    return uniq(all).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [producers]);

  const commerceDepartments = useMemo(() => {
    const all = producers.flatMap(p => (p.commerces || []).map(companyDepartmentName)).filter(Boolean);
    return uniq(all).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [producers]);

  const regions = view === "producer" ? producerRegions : commerceRegions;
  const departments = view === "producer" ? producerDepartments : commerceDepartments;

  const stats = useMemo(() => {
    const totalCommerces = producers.reduce((n, p) => n + (p.commerces?.length || 0), 0);
    const allRegions = uniq([...producerRegions, ...commerceRegions]).length;
    const allDepartments = uniq([...producerDepartments, ...commerceDepartments]).length;
    return { producers: producers.length, commerces: totalCommerces, regions: allRegions, departments: allDepartments };
  }, [producers, producerRegions, commerceRegions, producerDepartments, commerceDepartments]);

  const allCommercesRows = useMemo<CommerceRow[]>(() => {
    const rows: CommerceRow[] = [];
    producers.forEach(p => {
      (p.commerces || []).forEach(c => {
        if (c && (c.is_active ?? true)) {
          rows.push({ key: `${p.id}-${c.id}`, producer: p, company: c });
        }
      });
    });
    return rows;
  }, [producers]);

  const filteredProducers = useMemo(() => {
    let arr = [...producers];

    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter((p) => {
        const name = producerName(p).toLowerCase();
        const inName = name.includes(q);
        const inPlace =
          producerCityName(p).toLowerCase().includes(q) ||
          producerRegionName(p).toLowerCase().includes(q) ||
          producerDepartmentName(p).toLowerCase().includes(q);
        return inName || inPlace;
      });
    }

    if (region) arr = arr.filter((p) => producerRegionName(p) === region);

    if (departmentsSel.length > 0) {
      const set = new Set(departmentsSel);
      arr = arr.filter((p) => set.has(producerDepartmentName(p)));
    }

    switch (sort) {
      case "name":
        arr.sort((a, b) =>
          producerName(a).localeCompare(producerName(b), "fr", { sensitivity: "base" })
        );
        break;
      case "commerces":
        arr.sort((a, b) => (b.commerces?.length || 0) - (a.commerces?.length || 0));
        break;
      case "region":
        arr.sort((a, b) => {
          const ra = producerRegionName(a) || "~";
          const rb = producerRegionName(b) || "~";
          const cmp = ra.localeCompare(rb, "fr", { sensitivity: "base" });
          return cmp !== 0 ? cmp : producerName(a).localeCompare(producerName(b), "fr", { sensitivity: "base" });
        });
        break;
      case "department":
        arr.sort((a, b) => {
          const da = producerDepartmentName(a) || "~";
          const db = producerDepartmentName(b) || "~";
          const cmp = da.localeCompare(db, "fr", { sensitivity: "base" });
          return cmp !== 0 ? cmp : producerName(a).localeCompare(producerName(b), "fr", { sensitivity: "base" });
        });
        break;
      case "rating_desc":
        arr.sort((a, b) => {
          const av = (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
          if (av !== 0) return av;
          const cnt = (Number(b.ratings_count) || 0) - (Number(a.ratings_count) || 0);
          if (cnt !== 0) return cnt;
          return producerName(a).localeCompare(producerName(b), "fr", { sensitivity: "base" });
        });
        break;
      case "rating_asc":
        arr.sort((a, b) => {
          const av = (Number(a.avg_rating) || 0) - (Number(b.avg_rating) || 0);
          if (av !== 0) return av;
          const cnt = (Number(a.ratings_count) || 0) - (Number(b.ratings_count) || 0);
          if (cnt !== 0) return cnt;
          return producerName(a).localeCompare(producerName(b), "fr", { sensitivity: "base" });
        });
        break;
      case "recent":
      default:
        arr.sort((a, b) => Date.parse(b.joined_at || "") - Date.parse(a.joined_at || ""));
        break;
    }
    return arr;
  }, [producers, query, sort, region, departmentsSel]);

  const filteredCommerces = useMemo(() => {
    let arr = [...allCommercesRows];

    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(({ company, producer }) => {
        const cName = (company.name || "").toLowerCase();
        const city = (company.address?.city?.name || "").toLowerCase();
        const reg = companyRegionName(company).toLowerCase();
        const dep = companyDepartmentName(company).toLowerCase();
        const prod = producerName(producer).toLowerCase();
        return cName.includes(q) || city.includes(q) || reg.includes(q) || dep.includes(q) || prod.includes(q);
      });
    }

    if (region) arr = arr.filter(({ company }) => companyRegionName(company) === region);

    if (departmentsSel.length > 0) {
      const set = new Set(departmentsSel);
      arr = arr.filter(({ company }) => set.has(companyDepartmentName(company)));
    }

    switch (sortCommerce) {
      case "name":
        arr.sort((a, b) =>
          (a.company.name || "").localeCompare(b.company.name || "", "fr", { sensitivity: "base" })
        );
        break;
      case "producer":
        arr.sort((a, b) =>
          producerName(a.producer).localeCompare(producerName(b.producer), "fr", { sensitivity: "base" })
        );
        break;
      case "region":
        arr.sort((a, b) => {
          const ra = companyRegionName(a.company) || "~";
          const rb = companyRegionName(b.company) || "~";
          const cmp = ra.localeCompare(rb, "fr", { sensitivity: "base" });
          return cmp !== 0 ? cmp : (a.company.name || "").localeCompare(b.company.name || "", "fr", { sensitivity: "base" });
        });
        break;
      case "department":
        arr.sort((a, b) => {
          const da = companyDepartmentName(a.company) || "~";
          const db = companyDepartmentName(b.company) || "~";
          const cmp = da.localeCompare(db, "fr", { sensitivity: "base" });
          return cmp !== 0 ? cmp : (a.company.name || "").localeCompare(b.company.name || "", "fr", { sensitivity: "base" });
        });
        break;
      case "rating_desc":
        arr.sort((a, b) => {
          const av = (Number(b.company.avg_rating) || 0) - (Number(a.company.avg_rating) || 0);
          if (av !== 0) return av;
          const cnt = (Number(b.company.ratings_count) || 0) - (Number(a.company.ratings_count) || 0);
          if (cnt !== 0) return cnt;
          return (a.company.name || "").localeCompare(b.company.name || "", "fr", { sensitivity: "base" });
        });
        break;
      case "rating_asc":
        arr.sort((a, b) => {
          const av = (Number(a.company.avg_rating) || 0) - (Number(b.company.avg_rating) || 0);
          if (av !== 0) return av;
          const cnt = (Number(a.company.ratings_count) || 0) - (Number(b.company.ratings_count) || 0);
          if (cnt !== 0) return cnt;
          return (a.company.name || "").localeCompare(b.company.name || "", "fr", { sensitivity: "base" });
        });
        break;
      default:
        break;
    }

    return arr;
  }, [allCommercesRows, query, sortCommerce, region, departmentsSel]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("view", view);
    setSearchParams(next, { replace: true });
    setRegion("");
    setDepartmentsSel([]);
    setPage(1);
  }, [view]);

  useEffect(() => { setPage(1); }, [query, sort, sortCommerce, region, departmentsSel]);


  const departmentsForView = useMemo(() => {
    if (!region) {
      return (view === "producer" ? producerDepartments : commerceDepartments);
    }

    if (view === "producer") {
      const arr = producers
        .filter(p => producerRegionName(p) === region)
        .map(p => producerDepartmentName(p))
        .filter(Boolean) as string[];
      return uniq(arr).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    } else {
      const arr = allCommercesRows
        .filter(row => companyRegionName(row.company) === region)
        .map(row => companyDepartmentName(row.company))
        .filter(Boolean) as string[];
      return uniq(arr).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    }
  }, [region, view, producers, allCommercesRows, producerDepartments, commerceDepartments]);


  useEffect(() => {
    setDepartmentsSel(prev => prev.filter(d => departmentsForView.includes(d)));
  }, [region, departmentsForView]);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [page])

  const totalProducers = filteredProducers.length;
  const totalCommerces = filteredCommerces.length;

  const pageProducers = React.useMemo(
    () => filteredProducers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProducers, page]
  );
  const pageCommerces = React.useMemo(
    () => filteredCommerces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCommerces, page]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(((view === "producer" ? totalProducers : totalCommerces) || 0) / PAGE_SIZE)
  );

  if (error) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-red-200 text-red-700">
            {error}
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-3">
                  {view === "producer" ? <Users className="w-8 h-8" /> : <Store className="w-8 h-8" />}
                  {view === "producer" ? "Nos producteurs" : "Nos commerces"}
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Découvrez {view === "producer" ? "des producteurs engagés près de chez vous" : "les points de vente/fermes associés aux producteurs"} et soutenez une agriculture durable.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 overflow-hidden rounded-2xl bg-[#F7FAF4] text-dark-green divide-y sm:divide-y-0 sm:divide-x">
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold">{stats.producers}</div>
                  <div className="text-xs uppercase tracking-wide">Producteurs</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Factory className="w-5 h-5" /> {stats.commerces}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Commerces</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Globe className="w-5 h-5" /> {stats.regions}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Régions (commerce)</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Landmark className="w-5 h-5" /> {stats.departments}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Départements (commerce)</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border bg-white p-1">
                <button
                  onClick={() => setView("producer")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${view === "producer" ? "bg-dark-green text-pale-yellow" : "text-dark-green hover:bg-dark-green/10"}`}
                >
                  Voir par producteur
                </button>
                <button
                  onClick={() => setView("commerce")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${view === "commerce" ? "bg-dark-green text-pale-yellow" : "text-dark-green hover:bg-dark-green/10"}`}
                >
                  Voir par commerce
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 py-1">
                <button
                  onClick={() => setRegion("")}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    region === ""
                      ? "bg-dark-green text-pale-yellow border-dark-green"
                      : "bg-white text-dark-green hover:bg-dark-green/10 border-gray-200"
                  }`}
                >
                  Toutes les régions
                </button>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      region === r
                        ? "bg-dark-green text-pale-yellow border-dark-green"
                        : "bg-white text-dark-green hover:bg-dark-green/10 border-gray-200"
                    }`}
                    title={r}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="relative w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={view === "producer"
                    ? "Rechercher un producteur, une région, un département…"
                    : "Rechercher un commerce, un producteur, une région, un département…"}
                  aria-label="Recherche"
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="sm:w-56">
                  <label className="block text-xs text-gray-500 mb-1">Département</label>
                  <MultiSelect
                    options={departmentsForView.map(d => ({ value: d, label: d }))}
                    value={departmentsSel}
                    onChange={setDepartmentsSel}
                    placeholder="Tous les départements"
                  />
                </div>

                {view === "producer" ? (
                  <div className="sm:w-64">
                    <label className="block text-xs text-gray-500 mb-1">Trier par</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="w-full bg-white rounded-xl border px-3 py-2.5 shadow-sm"
                      aria-label="Trier par"
                    >
                      <option value="recent">Plus récents</option>
                      <option value="name">Nom (A → Z)</option>
                      <option value="commerces">Nb. de commerces</option>
                      <option value="region">Région (A → Z)</option>
                      <option value="department">Département (A → Z)</option>
                      <option value="rating_desc">Note (haute → basse)</option>
                      <option value="rating_asc">Note (basse → haute)</option>
                    </select>
                  </div>
                ) : (
                  <div className="sm:w-64">
                    <label className="block text-xs text-gray-500 mb-1">Trier par</label>
                    <select
                      value={sortCommerce}
                      onChange={(e) => setSortCommerce(e.target.value as SortKeyCommerce)}
                      className="w-full bg-white rounded-xl border px-3 py-2.5 shadow-sm"
                      aria-label="Trier par"
                    >
                      <option value="name">Nom du commerce (A → Z)</option>
                      <option value="producer">Producteur (A → Z)</option>
                      <option value="region">Région (A → Z)</option>
                      <option value="department">Département (A → Z)</option>
                      <option value="rating_desc">Note (haute → basse)</option>
                      <option value="rating_asc">Note (basse → haute)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <p className="text-sm text-gray-600 mb-6">
          {view === "producer" ? (
            <>
              {filteredProducers.length} producteur{filteredProducers.length > 1 ? "s" : ""} trouvé{filteredProducers.length > 1 ? "s" : ""}.
            </>
          ) : (
            <>
              {filteredCommerces.length} commerce{filteredCommerces.length > 1 ? "s" : ""} trouvé{filteredCommerces.length > 1 ? "s" : ""}.
            </>
          )}
        </p>

        <div ref={listTopRef}></div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ProducerCardSkeleton key={i} />)}
          </div>
        ) : (view === "producer" ? (
          filteredProducers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5 text-gray-600">
              Aucun producteur ne correspond à vos critères. Essayez un autre terme ou réinitialisez les filtres.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {pageProducers.map((p) => {
                  const name = producerName(p);
                  const city = producerCityName(p);
                  const joined = joinedText(p.joined_at);
                  const regionName = producerRegionName(p);
                  const deptName = producerDepartmentName(p);
                  const avg = Number(p.avg_rating);
                  const cnt = Number(p.ratings_count || 0);
                  const has = Number.isFinite(avg) && cnt > 0;

                  const desc =
                    p.description_utilisateur?.trim() ||
                    p.bio?.trim() ||
                    p.description?.trim() ||
                    "Producteur local engagé dans la réduction du gaspillage.";

                  const certCodes = uniq(
                    (p.commerces || []).flatMap((c) => normalizeCerts(c.certifications).map((x) => x.code || ""))
                  ).filter(Boolean);
                  const previewCerts = certCodes.slice(0, 4);
                  const more = certCodes.length - previewCerts.length;

                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start gap-4">
                        {p.avatar ? (
                          <img src={p.avatar} alt={name} className="w-16 h-16 rounded-full object-cover border" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-dark-green/10 flex items-center justify-center text-dark-green font-bold">
                            {name.slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-dark-green leading-snug">{name}</h2>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <StarsDisplay value={has ? avg : 0} />
                              {has ? (
                                <>
                                  <span className="text-gray-700 font-medium">{avg.toFixed(2)}/5</span>
                                  <span className="text-xs text-gray-500">({cnt}{cnt > 1 ? "avis" : "avis"})</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">Non noté (0)</span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" /> {joined}
                            </span>
                            {city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {city}
                              </span>
                            )}
                            {regionName && (
                              <span className="inline-flex items-center gap-1">
                                <Globe className="w-4 h-4" /> {regionName}
                              </span>
                            )}
                            {deptName && (
                              <span className="inline-flex items-center gap-1">
                                <Landmark className="w-4 h-4" /> {deptName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-gray-700 line-clamp-3">{desc}</p>

                      {previewCerts.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {previewCerts.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 rounded-full bg-dark-green text-pale-yellow px-2.5 py-1 text-xs font-medium shadow-sm"
                            >
                              <BadgeCheck className="w-3 h-3" />
                              {code}
                            </span>
                          ))}
                          {more > 0 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium">
                              +{more}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to={`${DETAIL_BASE}/${p.id}`}
                          className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-4 py-2 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                        >
                          Voir la fiche producteur <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/shop?producteur=${encodeURIComponent(name)}&sortField=created_at&order=desc`}
                          className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-4 py-2 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                        >
                          Voir les offres <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-dark-green disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-dark-green disabled:opacity-40"
                  >
                    Suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          filteredCommerces.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5 text-gray-600">
              Aucun commerce ne correspond à vos critères. Essayez un autre terme ou réinitialisez les filtres.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {pageCommerces.map(({ company, producer }) => {
                  const name = company.name || "Commerce";
                  const prodName = producerName(producer);
                  const city = formatCityName(company.address?.city?.name);
                  const regionName = companyRegionName(company);
                  const deptName = companyDepartmentName(company);
                  const certCodes = uniq(normalizeCerts(company.certifications).map(c => c.code || "")).filter(Boolean);
                  const previewCerts = certCodes.slice(0, 4);
                  const more = certCodes.length - previewCerts.length;
                  const avg = Number(company.avg_rating);
                  const cnt = Number(company.ratings_count || 0);
                  const has = Number.isFinite(avg) && cnt > 0;

                  return (
                    <div
                      key={`${producer.id}-${company.id}`}
                      className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start gap-4">
                        {company.logo ? (
                          <img src={company.logo} alt={name} className="w-16 h-16 rounded-full object-cover border" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-dark-green/10 flex items-center justify-center text-dark-green font-bold">
                            {name.slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-dark-green leading-snug">{name}</h2>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <StarsDisplay value={has ? avg : 0} />
                              {has ? (
                                <>
                                  <span className="text-gray-700 font-medium">{avg.toFixed(2)}/5</span>
                                  <span className="text-xs text-gray-500">({cnt} {cnt > 1 ? "avis" : "avis"})</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">Non noté (0)</span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-4 h-4" /> {prodName}
                            </span>
                            {city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {city}
                              </span>
                            )}
                            {regionName && (
                              <span className="inline-flex items-center gap-1">
                                <Globe className="w-4 h-4" /> {regionName}
                              </span>
                            )}
                            {deptName && (
                              <span className="inline-flex items-center gap-1">
                                <Landmark className="w-4 h-4" /> {deptName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {company.description && (
                        <p className="mt-4 text-gray-700 line-clamp-3">{company.description}</p>
                      )}

                      {previewCerts.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {previewCerts.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 rounded-full bg-dark-green text-pale-yellow px-2.5 py-1 text-xs font-medium shadow-sm"
                            >
                              <BadgeCheck className="w-3 h-3" />
                              {code}
                            </span>
                          ))}
                          {more > 0 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium">
                              +{more}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to={`${DETAIL_BASE}/${producer.id}`}
                          className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-4 py-2 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                        >
                          Voir la fiche producteur <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/shop?commerce=${encodeURIComponent(name)}&sortField=created_at&order=desc`}
                          className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-4 py-2 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                        >
                          Voir les offres <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-dark-green disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-dark-green disabled:opacity-40"
                  >
                    Suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )
        ))}
      </div>
    </div>
  );
}

function ProducerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-4 h-3 bg-gray-100 rounded w-full" />
      <div className="mt-2 h-3 bg-gray-100 rounded w-5/6" />
      <div className="mt-6 flex gap-3">
        <div className="h-9 bg-gray-100 rounded-full w-40" />
        <div className="h-9 bg-gray-100 rounded-full w-28" />
      </div>
    </div>
  );
}

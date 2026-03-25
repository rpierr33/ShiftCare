"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface LocationResult {
  display: string; // Full display text
  city: string;
  state: string;
  zipCode?: string;
  county?: string;
  fullAddress?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (location: LocationResult) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

// Use Google Places if key is available, otherwise OSM Nominatim
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const USE_GOOGLE = GOOGLE_API_KEY.length > 0;

// ─── OSM Nominatim (free fallback) ──────────────────────────────

async function searchNominatim(query: string): Promise<LocationResult[]> {
  if (query.length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      countrycodes: "us",
      limit: "6",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { "User-Agent": "ShiftCare/1.0" },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return data
      .filter((item: Record<string, unknown>) => {
        const type = item.type as string;
        const cls = item.class as string;
        // Only return meaningful location types
        return (
          cls === "place" ||
          cls === "boundary" ||
          type === "postcode" ||
          type === "city" ||
          type === "town" ||
          type === "village" ||
          type === "county" ||
          type === "state" ||
          type === "residential" ||
          type === "house"
        );
      })
      .map((item: Record<string, Record<string, string>>) => {
        const addr = item.address || {};
        const city =
          addr.city || addr.town || addr.village || addr.hamlet || "";
        const state = addr.state || "";
        const zipCode = addr.postcode || "";
        const county = addr.county || "";

        return {
          display: item.display_name as unknown as string,
          city,
          state: getStateAbbreviation(state),
          zipCode,
          county,
          fullAddress: item.display_name as unknown as string,
        };
      });
  } catch {
    return [];
  }
}

// ─── Google Places Autocomplete ─────────────────────────────────

async function searchGooglePlaces(
  query: string
): Promise<LocationResult[]> {
  if (query.length < 2) return [];

  try {
    // Use the Places Autocomplete API via a proxy route to avoid CORS
    const params = new URLSearchParams({
      input: query,
      types: "(regions)",
      components: "country:us",
      key: GOOGLE_API_KEY,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.predictions || []).map(
      (p: { description: string; structured_formatting?: { main_text: string } }) => {
        const parts = p.description.split(", ");
        return {
          display: p.description,
          city: parts[0] || "",
          state: getStateAbbreviation(parts[1] || ""),
          fullAddress: p.description,
        };
      }
    );
  } catch {
    // Fall back to Nominatim
    return searchNominatim(query);
  }
}

// ─── State abbreviation helper ──────────────────────────────────

const STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

function getStateAbbreviation(state: string): string {
  if (!state) return "";
  if (state.length === 2) return state.toUpperCase();
  return STATE_MAP[state.toLowerCase()] || state;
}

// ─── Component ──────────────────────────────────────────────────

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search city, zip code, or address...",
  label,
  required,
  className = "",
  id,
}: LocationAutocompleteProps) {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const fn = USE_GOOGLE ? searchGooglePlaces : searchNominatim;
    const items = await fn(query);
    setResults(items);
    setIsOpen(items.length > 0);
    setHighlightIndex(-1);
    setLoading(false);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(result: LocationResult) {
    onChange(result.display);
    onSelect?.(result);
    setIsOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleClear() {
    onChange("");
    setResults([]);
    setIsOpen(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-slate-300 hover:text-slate-500" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                i === highlightIndex
                  ? "bg-cyan-50"
                  : "hover:bg-slate-50"
              } ${i !== results.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {result.city}
                  {result.state ? `, ${result.state}` : ""}
                  {result.zipCode ? ` ${result.zipCode}` : ""}
                </p>
                {result.county && (
                  <p className="text-xs text-slate-400">{result.county}</p>
                )}
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {result.display}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-[10px] text-slate-300 text-right border-t border-slate-100">
            {USE_GOOGLE ? "Powered by Google Maps" : "Powered by OpenStreetMap"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-location picker for work areas ───────────────────────

interface WorkAreaPickerProps {
  areas: string[];
  onChange: (areas: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function WorkAreaPicker({
  areas,
  onChange,
  label = "Work Areas",
  placeholder = "Add cities where you want to work...",
}: WorkAreaPickerProps) {
  const [inputValue, setInputValue] = useState("");

  function handleSelect(result: LocationResult) {
    const areaName = result.city
      ? `${result.city}, ${result.state}`
      : result.display.split(",").slice(0, 2).join(",").trim();

    if (!areas.includes(areaName)) {
      onChange([...areas, areaName]);
    }
    setInputValue("");
  }

  function removeArea(area: string) {
    onChange(areas.filter((a) => a !== area));
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Selected areas */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {areas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium"
            >
              <MapPin className="h-3 w-3" />
              {area}
              <button
                type="button"
                onClick={() => removeArea(area)}
                className="ml-0.5 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <LocationAutocomplete
        value={inputValue}
        onChange={setInputValue}
        onSelect={handleSelect}
        placeholder={placeholder}
      />
      <p className="text-xs text-slate-400 mt-1">
        Search and select cities. You&apos;ll only see shifts in these areas.
      </p>
    </div>
  );
}

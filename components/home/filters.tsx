"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface FiltersProps {
  filters: {
    genres: string[];
    conditions: string[];
    locations: string[];
    dateRange: string;
  };
  setFilters: (filters: any) => void;
}

const genres = [
  "Fantasy",
  "Sci-Fi",
  "Romance",
  "Thriller",
  "Mystery",
  "Horror",
  "Non-Fiction",
];
const conditions = ["new", "used", "damaged"];
const locations = ["Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań"];

export function Filters({ filters, setFilters }: FiltersProps) {
  const handleReset = () => {
    setFilters({
      genres: [],
      conditions: [],
      locations: [],
      dateRange: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filtry</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Wyczyść
        </Button>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="genres">
          <AccordionTrigger>Gatunki</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {genres.map((g) => (
                <div key={g} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${g}`}
                    checked={filters.genres.includes(g)}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters,
                        genres: checked
                          ? [...filters.genres, g]
                          : filters.genres.filter((x) => x !== g),
                      });
                    }}
                  />
                  <label
                    htmlFor={`genre-${g}`}
                    className="text-sm cursor-pointer"
                  >
                    {g}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="condition">
          <AccordionTrigger>Stan książki</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {conditions.map((c) => (
                <div key={c} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${c}`}
                    checked={filters.conditions.includes(c)}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters,
                        conditions: checked
                          ? [...filters.conditions, c]
                          : filters.conditions.filter((x) => x !== c),
                      });
                    }}
                  />
                  <label
                    htmlFor={`condition-${c}`}
                    className="text-sm cursor-pointer"
                  >
                    {c === "new"
                      ? "Nowy"
                      : c === "used"
                        ? "Używany"
                        : "Uszkodzony"}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger>Lokalizacja</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {locations.map((l) => (
                <div key={l} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${l}`}
                    checked={filters.locations.includes(l)}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters,
                        locations: checked
                          ? [...filters.locations, l]
                          : filters.locations.filter((x) => x !== l),
                      });
                    }}
                  />
                  <label
                    htmlFor={`location-${l}`}
                    className="text-sm cursor-pointer"
                  >
                    {l}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="date">
          <AccordionTrigger>Data dodania</AccordionTrigger>
          <AccordionContent>
            <Select
              value={filters.dateRange}
              onValueChange={(v) => setFilters({ ...filters, dateRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz zakres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Ostatnie 7 dni</SelectItem>
                <SelectItem value="30">Ostatnie 30 dni</SelectItem>
                <SelectItem value="90">Ostatnie 90 dni</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

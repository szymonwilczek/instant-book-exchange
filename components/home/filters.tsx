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
    status: string[];
    location: string[];
    dateRange: string;
  };
  setFilters: (filters: any) => void;
}

const genres = ["Fantasy", "Sci-Fi", "Romance", "Thriller"];
const statuses = ["new", "used", "damaged"];
const locations = ["Warszawa", "Kraków", "Gdańsk"];

export function Filters({ filters, setFilters }: FiltersProps) {
  const handleApply = () => {
    // TODO: filtry do api
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="genres">
          <AccordionTrigger>Gatunki</AccordionTrigger>
          <AccordionContent>
            {genres.map((g) => (
              <div key={g} className="flex items-center space-x-2">
                <Checkbox
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
                <label>{g}</label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="status">
          <AccordionTrigger>Stan książki</AccordionTrigger>
          <AccordionContent>
            {statuses.map((s) => (
              <div key={s} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.status.includes(s)}
                  onCheckedChange={(checked) => {
                    setFilters({
                      ...filters,
                      status: checked
                        ? [...filters.status, s]
                        : filters.status.filter((x) => x !== s),
                    });
                  }}
                />
                <label>{s}</label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger>Lokalizacja</AccordionTrigger>
          <AccordionContent>
            {locations.map((l) => (
              <div key={l} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.location.includes(l)}
                  onCheckedChange={(checked) => {
                    setFilters({
                      ...filters,
                      location: checked
                        ? [...filters.location, l]
                        : filters.location.filter((x) => x !== l),
                    });
                  }}
                />
                <label>{l}</label>
              </div>
            ))}
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
      <Button onClick={handleApply} className="w-full">
        Zastosuj filtry
      </Button>
    </div>
  );
}

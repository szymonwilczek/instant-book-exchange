"use client";
import { useState, useEffect } from "react";
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

const conditions = ["new", "used", "damaged"];
const locations = ["Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań"];

export function Filters({ filters, setFilters }: FiltersProps) {
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/books/genres")
      .then((res) => res.json())
      .then((data) => setAvailableGenres(data.genres || []))
      .catch(console.error);
  }, []);

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
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Clear
        </Button>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="genres">
          <AccordionTrigger>Genres</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {availableGenres.map((g) => (
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
          <AccordionTrigger>Book condition</AccordionTrigger>
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
                    {c === "new" ? "New" : c === "used" ? "Used" : "Damaged"}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger>Location</AccordionTrigger>
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
          <AccordionTrigger>Date added</AccordionTrigger>
          <AccordionContent>
            <Select
              value={filters.dateRange}
              onValueChange={(v) => setFilters({ ...filters, dateRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

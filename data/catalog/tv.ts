import { hasLicensedPhoto, licensedPhotoFor } from "@/data/catalog/licensedPhotos";
import { type CatalogItem } from "@/data/catalog/types";

function show(name: string, year: number): CatalogItem {
  return {
    name,
    categories: ["top-tv-shows"],
    image: licensedPhotoFor(name),
    metadata: { year },
  };
}

const TV_SHOW_ENTRIES: { name: string; year: number }[] = [
  { name: "Friends", year: 1994 },
  { name: "Breaking Bad", year: 2008 },
  { name: "Game of Thrones", year: 2011 },
  { name: "The Simpsons", year: 1989 },
  { name: "The Office", year: 2005 },
  { name: "Stranger Things", year: 2016 },
  { name: "The Sopranos", year: 1999 },
  { name: "The Big Bang Theory", year: 2007 },
  { name: "Sherlock", year: 2010 },
  { name: "Peaky Blinders", year: 2013 },
  { name: "The Walking Dead", year: 2010 },
  { name: "Wednesday", year: 2022 },
  { name: "The Crown", year: 2016 },
  { name: "Black Mirror", year: 2011 },
  { name: "Seinfeld", year: 1989 },
  { name: "The Wire", year: 2002 },
  { name: "Mad Men", year: 2007 },
  { name: "Lost", year: 2004 },
  { name: "Grey's Anatomy", year: 2005 },
  { name: "Law & Order", year: 1990 },
  { name: "Doctor Who", year: 1963 },
  { name: "Star Trek", year: 1966 },
  { name: "The Mandalorian", year: 2019 },
  { name: "Succession", year: 2018 },
  { name: "The Bear", year: 2022 },
  { name: "Squid Game", year: 2021 },
  { name: "Bridgerton", year: 2020 },
  { name: "House of the Dragon", year: 2022 },
  { name: "Better Call Saul", year: 2015 },
  { name: "True Detective", year: 2014 },
  { name: "Westworld", year: 2016 },
  { name: "The Handmaid's Tale", year: 2017 },
  { name: "Fargo", year: 2014 },
  { name: "Chernobyl", year: 2019 },
  { name: "Band of Brothers", year: 2001 },
  { name: "Planet Earth", year: 2006 },
  { name: "Only Fools and Horses", year: 1981 },
  { name: "Downton Abbey", year: 2010 },
  { name: "I Love Lucy", year: 1951 },
  { name: "South Park", year: 1997 },
  { name: "Family Guy", year: 1999 },
  { name: "Rick and Morty", year: 2013 },
  { name: "The Boys", year: 2019 },
  { name: "House", year: 2004 },
  { name: "Narcos", year: 2015 },
  { name: "Money Heist", year: 2017 },
  { name: "Ted Lasso", year: 2020 },
  { name: "The Last of Us", year: 2023 },
  { name: "Brooklyn Nine-Nine", year: 2013 },
  { name: "Parks and Recreation", year: 2009 },
];

export const TV_SHOW_ITEMS: CatalogItem[] = TV_SHOW_ENTRIES.filter((entry) =>
  hasLicensedPhoto(entry.name),
).map((entry) => show(entry.name, entry.year));

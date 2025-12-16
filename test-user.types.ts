export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  city: string;
  country: string;
  coordinates: Coordinates;
}

export interface Company {
  name: string;
  industry: string;
}

export interface User {
  name: string;
  age: number;
  location: Location;
  company: Company;
}

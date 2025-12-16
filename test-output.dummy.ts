/**
 * Dummy data for User
 * Generated from: test-user.json
 * 
 * This file is auto-generated. Do not edit manually.
 */

import { Coordinates, Location, Company, User } from './test-user.types';

const dummyUser: User = {
  name: 'John Doe',
  age: 30,
  location: {
    city: 'New York',
    country: 'USA',
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    } as Coordinates,
  } as Location,
  company: {
    name: 'Tech Corp',
    industry: 'Technology',
  } as Company,
};

/**
 * Get dummy User data
 * @returns Promise with User
 */
export async function getDummyUser(): Promise<User> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dummyUser);
    }, 500);
  });
}

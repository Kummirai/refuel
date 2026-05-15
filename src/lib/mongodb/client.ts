// Re-exports from the shared connection module to keep a single pool
export { connectToDatabase, getUsersCollection, getDriverProfilesCollection, getServiceRequestsCollection } from "@/lib/db";

// src/app/api/admin/requests/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const serviceRequestsCollection = db.collection('serviceRequests');
    const usersCollection = db.collection('user');

    // Get all service requests sorted by date
    const requests = await serviceRequestsCollection
      .find({})
      .sort({ requestDate: -1 })
      .toArray();

    // Get driver details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const driver = await usersCollection.findOne({ _id: request.userId });
        return {
          id: request._id.toString().slice(-6).toUpperCase(),
          type: request.type,
          amount: request.amount,
          driver: driver?.name || 'Unknown',
          driverId: request.userId,
          driverEmail: driver?.email,
          driverPhone: driver?.phone,
          carRegistration: request.carNumber,
          location: request.location,
          fuelType: request.fuelType,
          phoneNumber: request.phoneNumber,
          interest: request.interest,
          totalRepayable: request.totalRepayable,
          repaymentDays: request.repaymentDays,
          date: request.requestDate,
          status: request.status,
          otp: request.otp,
        };
      })
    );

    // Get recent pending requests (last 5)
    const recentPending = requestsWithDetails
      .filter(r => r.status === 'pending')
      .slice(0, 5);

    // Calculate stats
    const total = requestsWithDetails.length;
    const pending = requestsWithDetails.filter(r => r.status === 'pending').length;
    const completed = requestsWithDetails.filter(r => r.status === 'completed').length;
    const totalRevenue = requestsWithDetails
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return NextResponse.json({
      requests: requestsWithDetails,
      recent: recentPending,
      total,
      pending,
      completed,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
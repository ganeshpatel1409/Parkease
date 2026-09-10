import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.parkingImage.deleteMany();
  await prisma.parkingSpace.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Create Users
  const driver = await prisma.user.create({
    data: {
      email: 'demo.driver@parkease.com',
      name: 'Rohan Sharma',
      password: passwordHash,
      role: 'DRIVER',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'demo.owner@parkease.com',
      name: 'Amit Patel',
      password: passwordHash,
      role: 'OWNER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@parkease.com',
      name: 'ParkEase Admin',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Users seeded successfully:', { driver: driver.email, owner: owner.email, admin: admin.email });

  // 2. Create Events (Near ABES Engineering College, Lat: 28.6360, Lng: 77.4475)
  const techFest = await prisma.event.create({
    data: {
      name: 'ABES College Annual Tech Fest',
      location: 'ABES Campus Auditorium',
      latitude: 28.6360,
      longitude: 77.4475,
      startTime: new Date(Date.now() - 3600000 * 2), // Started 2 hours ago
      endTime: new Date(Date.now() + 3600000 * 8),   // Ending in 8 hours
      estimatedDemand: 'VERY_HIGH',
      demandReductionPercentage: 75.0, // 75% reduction in available parking capacity nearby
    },
  });

  const concert = await prisma.event.create({
    data: {
      name: 'Vijay Nagar Live Music Night',
      location: 'Vijay Nagar Community Ground',
      latitude: 28.6410,
      longitude: 77.4390,
      startTime: new Date(Date.now() + 3600000 * 24), // Starts tomorrow
      endTime: new Date(Date.now() + 3600000 * 30),
      estimatedDemand: 'HIGH',
      demandReductionPercentage: 50.0,
    },
  });

  console.log('Events seeded successfully');

  // 3. Create Parking Spaces
  // Space 1: ABES Residential Driveway (Very close, Verified, Good score)
  const space1 = await prisma.parkingSpace.create({
    data: {
      ownerId: owner.id,
      name: 'ABES Front Gate Driveway',
      description: 'Secured residential driveway right across the ABES front gate. Ideal for hatchback and sedans.',
      address: 'Plot 42, Sector 11, Lal Kuan, Ghaziabad, UP',
      latitude: 28.6365,
      longitude: 77.4485,
      pricePerHour: 40.0,
      capacity: 2,
      vehicleType: 'BOTH',
      status: 'VERIFIED',
      verificationScore: 94,
      availabilityStatus: 'AVAILABLE',
    },
  });

  await prisma.parkingImage.create({
    data: {
      parkingSpaceId: space1.id,
      url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=400',
      isVerificationPhoto: true,
    },
  });

  await prisma.verification.create({
    data: {
      parkingSpaceId: space1.id,
      status: 'VERIFIED',
      confidence: 94.0,
      details: JSON.stringify({
        parkingAreaDetected: 'YES',
        imageRelevance: 'HIGH',
        spaceAssessment: 'SUFFICIENT_FOR_SEDAN',
        potentialIssues: 'NONE',
      }),
    },
  });

  // Space 2: NH-24 Commercial Lot (Medium Distance, Verified, Good Score, Dynamic pricing recommendation)
  const space2 = await prisma.parkingSpace.create({
    data: {
      ownerId: owner.id,
      name: 'NH-24 Commercial Safe Lot',
      description: 'Fully guarded office basement parking space located on NH-24. CCTV operational 24/7.',
      address: 'Pinnacle Tower, Sector 62 Link Road, Ghaziabad',
      latitude: 28.6340,
      longitude: 77.4430,
      pricePerHour: 60.0,
      capacity: 5,
      vehicleType: 'FOUR_WHEELER',
      status: 'VERIFIED',
      verificationScore: 91,
      availabilityStatus: 'AVAILABLE',
    },
  });

  await prisma.parkingImage.create({
    data: {
      parkingSpaceId: space2.id,
      url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=400',
      isVerificationPhoto: true,
    },
  });

  await prisma.verification.create({
    data: {
      parkingSpaceId: space2.id,
      status: 'VERIFIED',
      confidence: 91.0,
      details: JSON.stringify({
        parkingAreaDetected: 'YES',
        imageRelevance: 'HIGH',
        spaceAssessment: 'SUFFICIENT_FOR_SUV',
        potentialIssues: 'NONE',
      }),
    },
  });

  // Space 3: Crossings Republik Covered Garage (Further away, high rating, Verified)
  const space3 = await prisma.parkingSpace.create({
    data: {
      ownerId: owner.id,
      name: 'Crossings Republik Basement Garage',
      description: 'Private parking slot in a luxury society basement. Lift access available.',
      address: 'A-102, Paramount Symphony, Crossings Republik, Ghaziabad',
      latitude: 28.6290,
      longitude: 77.4520,
      pricePerHour: 30.0,
      capacity: 1,
      vehicleType: 'FOUR_WHEELER',
      status: 'VERIFIED',
      verificationScore: 89,
      availabilityStatus: 'AVAILABLE',
    },
  });

  await prisma.parkingImage.create({
    data: {
      parkingSpaceId: space3.id,
      url: 'https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400',
      isVerificationPhoto: true,
    },
  });

  await prisma.verification.create({
    data: {
      parkingSpaceId: space3.id,
      status: 'VERIFIED',
      confidence: 89.0,
      details: JSON.stringify({
        parkingAreaDetected: 'YES',
        imageRelevance: 'HIGH',
        spaceAssessment: 'SUFFICIENT_FOR_SEDAN',
        potentialIssues: 'NONE',
      }),
    },
  });

  // Space 4: Lal Kuan Two-Wheeler Hub (Very cheap, Two-Wheeler only, verified)
  const space4 = await prisma.parkingSpace.create({
    data: {
      ownerId: owner.id,
      name: 'Lal Kuan Quick Bike Park',
      description: 'Convenient paved plot specifically designated for two-wheelers. Safe and gated.',
      address: 'Gali 3, Lal Kuan Chowk, Ghaziabad',
      latitude: 28.6380,
      longitude: 77.4560,
      pricePerHour: 15.0,
      capacity: 10,
      vehicleType: 'TWO_WHEELER',
      status: 'VERIFIED',
      verificationScore: 96,
      availabilityStatus: 'AVAILABLE',
    },
  });

  await prisma.parkingImage.create({
    data: {
      parkingSpaceId: space4.id,
      url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400',
      isVerificationPhoto: true,
    },
  });

  await prisma.verification.create({
    data: {
      parkingSpaceId: space4.id,
      status: 'VERIFIED',
      confidence: 96.0,
      details: JSON.stringify({
        parkingAreaDetected: 'YES',
        imageRelevance: 'HIGH',
        spaceAssessment: 'SUFFICIENT_FOR_MULTIPLE_BIKES',
        potentialIssues: 'NONE',
      }),
    },
  });

  // Space 5: Unverified New Listing (Pending admin approval)
  const space5 = await prisma.parkingSpace.create({
    data: {
      ownerId: owner.id,
      name: 'Vijay Nagar Residential Courtyard',
      description: 'Large open courtyard suitable for parking. Newly registered listing awaiting verification.',
      address: 'H.No 124, Sector 9, Vijay Nagar, Ghaziabad',
      latitude: 28.6400,
      longitude: 77.4420,
      pricePerHour: 35.0,
      capacity: 3,
      vehicleType: 'BOTH',
      status: 'PENDING',
      verificationScore: 0,
      availabilityStatus: 'AVAILABLE',
    },
  });

  await prisma.parkingImage.create({
    data: {
      parkingSpaceId: space5.id,
      url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=400',
      isVerificationPhoto: true,
    },
  });

  // 4. Create historical bookings & reviews
  // Past Booking (Completed) for Space 1 by Rohan Driver
  const booking1 = await prisma.booking.create({
    data: {
      driverId: driver.id,
      parkingSpaceId: space1.id,
      startTime: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
      endTime: new Date(Date.now() - 3600000 * 24 * 3 + 3600000 * 2), // 2 hours duration
      durationHours: 2.0,
      totalAmount: 80.0,
      platformFee: 12.0,
      status: 'COMPLETED',
      qrCode: 'QR_BOOKING_COMPLETED_123',
      checkInTime: new Date(Date.now() - 3600000 * 24 * 3 + 300000), // checked in 5 mins late
      checkOutTime: new Date(Date.now() - 3600000 * 24 * 3 + 3600000 * 2 - 100000), // checked out 2 mins early
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      userId: driver.id,
      orderId: 'pay_order_sim_111',
      paymentId: 'pay_id_sim_111',
      amount: 92.0,
      status: 'SUCCESS',
      provider: 'SIMULATOR',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      driverId: driver.id,
      parkingSpaceId: space1.id,
      rating: 5,
      comment: 'Extremely close to the college gate, very friendly owner. Safe driveway!',
    },
  });

  // Past Booking (Completed) for Space 2 by Rohan Driver
  const booking2 = await prisma.booking.create({
    data: {
      driverId: driver.id,
      parkingSpaceId: space2.id,
      startTime: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
      endTime: new Date(Date.now() - 3600000 * 24 * 1 + 3600000 * 4), // 4 hours duration
      durationHours: 4.0,
      totalAmount: 240.0,
      platformFee: 20.0,
      status: 'COMPLETED',
      qrCode: 'QR_BOOKING_COMPLETED_456',
      checkInTime: new Date(Date.now() - 3600000 * 24 * 1 + 100000),
      checkOutTime: new Date(Date.now() - 3600000 * 24 * 1 + 3600000 * 4),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      userId: driver.id,
      orderId: 'pay_order_sim_222',
      paymentId: 'pay_id_sim_222',
      amount: 260.0,
      status: 'SUCCESS',
      provider: 'SIMULATOR',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      driverId: driver.id,
      parkingSpaceId: space2.id,
      rating: 4,
      comment: 'Very professional parking space, but driving down the NH-24 traffic took some time.',
    },
  });

  console.log('Seed database completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "@/app/lib/prisma";
import { Prisma, SeatClass, SeatStatus } from "@prisma/client";

export async function generateSeats(scheduleId: string) {
  const schedule = await prisma.flightSchedule.findUnique({
    where: {
      id: scheduleId,
    },
    include: {
      aircraft: true,
    },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const seats: Prisma.SeatCreateManyInput[] = [];

  //
  // BUSINESS CLASS
  //
  let row = 1;

  for (let i = 0; i < schedule.aircraft.businessSeats; i++) {
    if (i !== 0 && i % 4 === 0) {
      row++;
    }

    const letter = ["A", "B", "C", "D"][i % 4];

    seats.push({
      scheduleId: schedule.id,
      seatNumber: `${row}${letter}`,
      seatClass: SeatClass.BUSINESS,
      status: SeatStatus.AVAILABLE,
      price: new Prisma.Decimal(Number(schedule.baseFare) * 2),
    });
  }

  //
  // ECONOMY CLASS
  //
  row++;

  for (let i = 0; i < schedule.aircraft.economySeats; i++) {
    if (i !== 0 && i % 6 === 0) {
      row++;
    }

    const letter = ["A", "B", "C", "D", "E", "F"][i % 6];

    seats.push({
      scheduleId: schedule.id,
      seatNumber: `${row}${letter}`,
      seatClass: SeatClass.ECONOMY,
      status: SeatStatus.AVAILABLE,
      price: new Prisma.Decimal(Number(schedule.baseFare)),
    });
  }

  //
  // FIRST CLASS
  //
  if (schedule.aircraft.firstClassSeats > 0) {
    row++;

    for (let i = 0; i < schedule.aircraft.firstClassSeats; i++) {
      if (i !== 0 && i % 4 === 0) {
        row++;
      }

      const letter = ["A", "B", "C", "D"][i % 4];

      seats.push({
        scheduleId: schedule.id,
        seatNumber: `${row}${letter}`,
        seatClass: SeatClass.FIRST,
        status: SeatStatus.AVAILABLE,
        price: new Prisma.Decimal(Number(schedule.baseFare) * 3),
      });
    }
  }

  if (seats.length > 0) {
    await prisma.seat.createMany({
      data: seats,
    });
  }

  return seats.length;
}
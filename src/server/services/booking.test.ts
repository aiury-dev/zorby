import assert from "node:assert/strict";
import { generateSlots, intervalsOverlap } from "./booking";

function runBookingTests() {
  const overlapping = intervalsOverlap(
    {
      startsAtUtc: new Date("2026-04-17T13:00:00.000Z"),
      endsAtUtc: new Date("2026-04-17T14:00:00.000Z"),
    },
    {
      startsAtUtc: new Date("2026-04-17T13:30:00.000Z"),
      endsAtUtc: new Date("2026-04-17T14:30:00.000Z"),
    },
  );

  assert.equal(overlapping, true, "deveria detectar sobreposicao real");

  const touching = intervalsOverlap(
    {
      startsAtUtc: new Date("2026-04-17T13:00:00.000Z"),
      endsAtUtc: new Date("2026-04-17T14:00:00.000Z"),
    },
    {
      startsAtUtc: new Date("2026-04-17T14:00:00.000Z"),
      endsAtUtc: new Date("2026-04-17T15:00:00.000Z"),
    },
  );

  assert.equal(touching, false, "blocos encostados nao devem conflitar");

  const slots = generateSlots({
    date: "2099-10-01",
    timezone: "America/Sao_Paulo",
    durationMinutes: 60,
    availabilities: [
      {
        startMinutes: 540,
        endMinutes: 720,
        slotIntervalMinutes: 30,
      },
    ],
    occupiedIntervals: [
      {
        startsAtUtc: new Date("2099-10-01T13:00:00.000Z"),
        endsAtUtc: new Date("2099-10-01T14:00:00.000Z"),
      },
    ],
    blockedIntervals: [
      {
        startsAtUtc: new Date("2099-10-01T15:00:00.000Z"),
        endsAtUtc: new Date("2099-10-01T16:00:00.000Z"),
      },
    ],
  });

  assert.deepEqual(
    slots.map((slot) => slot.label),
    ["09:00", "11:00"],
    "deveria remover horarios ocupados e bloqueados",
  );

  console.log("booking.test.ts: todos os testes passaram");
}

runBookingTests();

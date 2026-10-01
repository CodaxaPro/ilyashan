import {
  createInitialCustomerInput,
  type CustomerInput,
} from "./types";
import { redistributeFloors, redistributeSubAreas } from "./area-sync";

function syncedAreas(total: number, officeShare = 0.55): CustomerInput["subAreas"] {
  return redistributeSubAreas(total, {
    office: total * officeShare,
    meeting: total * 0.12,
    kitchen: total * 0.08,
    sanitary: total * 0.08,
    corridors: total * 0.1,
    reception: total * 0.05,
    other: total * 0.02,
  });
}

function syncedFloors(total: number): CustomerInput["floors"] {
  return redistributeFloors(total, {
    carpet: total * 0.4,
    hard: total * 0.45,
    wet: total * 0.1,
    other: total * 0.05,
  });
}

/** Spec §39 scenario fixtures */
export const FIXTURE_A_SMALL: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 100,
  frequency: "1_PER_WEEK",
  subAreas: syncedAreas(100, 0.7),
  floors: syncedFloors(100),
  office: {
    workstations: 4,
    officeBins: 4,
    officeBinsAutoSuggested: true,
    meetingRooms: 0,
    meetingChairs: 0,
    cabinetExterior: false,
    shelving: false,
    windowSills: false,
    phoneMonitorExterior: false,
    whiteboards: false,
  },
  sanitary: {
    toilets: 1,
    urinals: 0,
    washbasins: 1,
    mirrors: 1,
    sanitaryBins: 1,
    showers: 0,
    cubicles: 0,
  },
  kitchen: {
    kitchens: 0,
    tables: 0,
    chairs: 0,
    sinks: 0,
    countertopUnits: 0,
    bins: 0,
    applianceExteriors: 0,
    microwaveInside: false,
    refrigeratorInside: false,
    dishwasher: false,
    cabinetFronts: false,
    dishes: false,
  },
});

export const FIXTURE_B_NORMAL: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 200,
  frequency: "2_PER_WEEK",
  subAreas: syncedAreas(200),
  floors: syncedFloors(200),
  office: {
    workstations: 10,
    officeBins: 10,
    officeBinsAutoSuggested: true,
    meetingRooms: 1,
    meetingChairs: 8,
    cabinetExterior: false,
    shelving: false,
    windowSills: false,
    phoneMonitorExterior: false,
    whiteboards: false,
  },
  sanitary: {
    toilets: 2,
    urinals: 1,
    washbasins: 2,
    mirrors: 2,
    sanitaryBins: 2,
    showers: 0,
    cubicles: 0,
  },
  kitchen: {
    kitchens: 1,
    tables: 1,
    chairs: 4,
    sinks: 1,
    countertopUnits: 2,
    bins: 1,
    applianceExteriors: 2,
    microwaveInside: false,
    refrigeratorInside: false,
    dishwasher: false,
    cabinetFronts: false,
    dishes: false,
  },
});

export const FIXTURE_C_500: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 500,
  frequency: "2_PER_WEEK",
  usageIntensity: "NORMAL",
  subAreas: syncedAreas(500),
  floors: syncedFloors(500),
  office: {
    workstations: 25,
    officeBins: 25,
    officeBinsAutoSuggested: true,
    meetingRooms: 3,
    meetingChairs: 24,
    cabinetExterior: true,
    shelving: false,
    windowSills: true,
    phoneMonitorExterior: false,
    whiteboards: true,
  },
  sanitary: {
    toilets: 6,
    urinals: 2,
    washbasins: 6,
    mirrors: 6,
    sanitaryBins: 6,
    showers: 0,
    cubicles: 4,
  },
  kitchen: {
    kitchens: 2,
    tables: 2,
    chairs: 8,
    sinks: 2,
    countertopUnits: 4,
    bins: 2,
    applianceExteriors: 4,
    microwaveInside: false,
    refrigeratorInside: false,
    dishwasher: false,
    cabinetFronts: true,
    dishes: false,
  },
  additional: {
    stairFloors: 2,
    elevator: true,
    glassEntranceDoors: 2,
    receptionDetail: true,
    highTouchAreas: false,
  },
});

export const FIXTURE_D_1000: CustomerInput = createInitialCustomerInput({
  ...FIXTURE_C_500,
  totalAreaM2: 1000,
  frequency: "5_PER_WEEK",
  subAreas: syncedAreas(1000),
  floors: syncedFloors(1000),
  office: {
    ...FIXTURE_C_500.office,
    workstations: 50,
    officeBins: 50,
  },
});

export const FIXTURE_E_INTENSIVE: CustomerInput = createInitialCustomerInput({
  ...FIXTURE_C_500,
  condition: "INITIAL_INTENSIVE",
  frequency: "ONE_TIME",
});

export const FIXTURE_F_INCONSISTENT: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 500,
  subAreas: {
    office: 400,
    meeting: 100,
    kitchen: 50,
    sanitary: 50,
    corridors: 50,
    reception: 30,
    other: 20,
  },
  floors: syncedFloors(500),
});

export const FIXTURE_G_DENSITY: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 20,
  subAreas: syncedAreas(20, 0.8),
  floors: syncedFloors(20),
  office: {
    workstations: 80,
    officeBins: 80,
    officeBinsAutoSuggested: true,
    meetingRooms: 0,
    meetingChairs: 0,
    cabinetExterior: false,
    shelving: false,
    windowSills: false,
    phoneMonitorExterior: false,
    whiteboards: false,
  },
});

export const FIXTURE_H_MINIMUM: CustomerInput = createInitialCustomerInput({
  totalAreaM2: 30,
  frequency: "ONE_TIME",
  condition: "MAINTAINED",
  usageIntensity: "LOW",
  subAreas: syncedAreas(30, 0.85),
  floors: redistributeFloors(30, {
    carpet: 0,
    hard: 30,
    wet: 0,
    other: 0,
  }),
  office: {
    workstations: 2,
    officeBins: 2,
    officeBinsAutoSuggested: true,
    meetingRooms: 0,
    meetingChairs: 0,
    cabinetExterior: false,
    shelving: false,
    windowSills: false,
    phoneMonitorExterior: false,
    whiteboards: false,
  },
  sanitary: {
    toilets: 1,
    urinals: 0,
    washbasins: 1,
    mirrors: 1,
    sanitaryBins: 1,
    showers: 0,
    cubicles: 0,
  },
});

export const FIXTURE_I_MANUAL: CustomerInput = createInitialCustomerInput({
  ...FIXTURE_D_1000,
  totalAreaM2: 2500,
  subAreas: syncedAreas(2500),
  floors: syncedFloors(2500),
});

export const FIXTURE_J_LANG: CustomerInput = createInitialCustomerInput({
  ...FIXTURE_C_500,
  language: "tr",
});

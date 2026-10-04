/**
 * Canonical map: every priced CustomerInput field → workload task id(s).
 * Used by proof tests so UI/engine drift is caught.
 */

export type FormFieldPath =
  | "totalAreaM2"
  | "usageIntensity"
  | "condition"
  | "frequency"
  | "subAreas.office"
  | "subAreas.meeting"
  | "subAreas.kitchen"
  | "subAreas.sanitary"
  | "subAreas.corridors"
  | "subAreas.reception"
  | "subAreas.other"
  | "floors.carpet"
  | "floors.hard"
  | "floors.wet"
  | "floors.other"
  | "office.workstations"
  | "office.officeBins"
  | "office.meetingRooms"
  | "office.meetingChairs"
  | "office.cabinetExterior"
  | "office.shelving"
  | "office.windowSills"
  | "office.phoneMonitorExterior"
  | "office.whiteboards"
  | "sanitary.toilets"
  | "sanitary.urinals"
  | "sanitary.washbasins"
  | "sanitary.mirrors"
  | "sanitary.sanitaryBins"
  | "sanitary.showers"
  | "sanitary.cubicles"
  | "kitchen.kitchens"
  | "kitchen.tables"
  | "kitchen.chairs"
  | "kitchen.sinks"
  | "kitchen.countertopUnits"
  | "kitchen.bins"
  | "kitchen.applianceExteriors"
  | "kitchen.microwaveInside"
  | "kitchen.refrigeratorInside"
  | "kitchen.dishwasher"
  | "kitchen.cabinetFronts"
  | "kitchen.dishes"
  | "additional.stairFloors"
  | "additional.elevator"
  | "additional.glassEntranceDoors"
  | "additional.receptionDetail"
  | "additional.highTouchAreas";

export interface FormFieldCoverage {
  path: FormFieldPath;
  /** Task ids that must receive quantity/minutes when field is active */
  taskIds: string[];
  /** How the field affects time */
  effect: "ROOM_M2" | "FLOOR_MODIFIER" | "COUNT" | "BOOLEAN_COUNT" | "FACTOR";
  /** Shown in customer calculator UI */
  inCustomerUi: boolean;
}

export const FORM_FIELD_COVERAGE: FormFieldCoverage[] = [
  { path: "totalAreaM2", taskIds: ["setup_travel"], effect: "FACTOR", inCustomerUi: true },
  { path: "usageIntensity", taskIds: ["*"], effect: "FACTOR", inCustomerUi: true },
  { path: "condition", taskIds: ["*"], effect: "FACTOR", inCustomerUi: true },
  { path: "frequency", taskIds: ["*"], effect: "FACTOR", inCustomerUi: true },
  { path: "subAreas.office", taskIds: ["room_office"], effect: "ROOM_M2", inCustomerUi: true },
  { path: "subAreas.meeting", taskIds: ["room_meeting"], effect: "ROOM_M2", inCustomerUi: true },
  { path: "subAreas.kitchen", taskIds: ["room_kitchen"], effect: "ROOM_M2", inCustomerUi: true },
  { path: "subAreas.sanitary", taskIds: ["room_sanitary"], effect: "ROOM_M2", inCustomerUi: true },
  {
    path: "subAreas.corridors",
    taskIds: ["room_corridors"],
    effect: "ROOM_M2",
    inCustomerUi: true,
  },
  {
    path: "subAreas.reception",
    taskIds: ["room_reception"],
    effect: "ROOM_M2",
    inCustomerUi: true,
  },
  { path: "subAreas.other", taskIds: ["room_other"], effect: "ROOM_M2", inCustomerUi: true },
  {
    path: "floors.carpet",
    taskIds: ["carpet_surcharge"],
    effect: "FLOOR_MODIFIER",
    inCustomerUi: true,
  },
  {
    path: "floors.hard",
    taskIds: ["room_office", "room_meeting", "room_corridors"],
    effect: "FLOOR_MODIFIER",
    inCustomerUi: true,
  },
  {
    path: "floors.wet",
    taskIds: ["wet_floor_clean"],
    effect: "FLOOR_MODIFIER",
    inCustomerUi: true,
  },
  {
    path: "floors.other",
    taskIds: ["room_other"],
    effect: "FLOOR_MODIFIER",
    inCustomerUi: true,
  },
  { path: "office.workstations", taskIds: ["desk_surfaces"], effect: "COUNT", inCustomerUi: true },
  { path: "office.officeBins", taskIds: ["office_bin_empty"], effect: "COUNT", inCustomerUi: true },
  {
    path: "office.meetingRooms",
    taskIds: ["whiteboard_wipe", "window_sill_wipe"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.meetingChairs",
    taskIds: ["meeting_chair_wipe"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.cabinetExterior",
    taskIds: ["cabinet_exterior"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.shelving",
    taskIds: ["shelving_wipe"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.windowSills",
    taskIds: ["window_sill_wipe"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.phoneMonitorExterior",
    taskIds: ["phone_monitor_exterior"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "office.whiteboards",
    taskIds: ["whiteboard_wipe"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  { path: "sanitary.toilets", taskIds: ["toilet_fixture"], effect: "COUNT", inCustomerUi: true },
  { path: "sanitary.urinals", taskIds: ["urinal_fixture"], effect: "COUNT", inCustomerUi: true },
  {
    path: "sanitary.washbasins",
    taskIds: ["washbasin_fixture"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  { path: "sanitary.mirrors", taskIds: ["mirror_clean"], effect: "COUNT", inCustomerUi: true },
  {
    path: "sanitary.sanitaryBins",
    taskIds: ["sanitary_bin_empty"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  { path: "sanitary.showers", taskIds: ["shower_fixture"], effect: "COUNT", inCustomerUi: true },
  { path: "sanitary.cubicles", taskIds: ["cubicle_wipe"], effect: "COUNT", inCustomerUi: true },
  { path: "kitchen.kitchens", taskIds: ["kitchen_base"], effect: "COUNT", inCustomerUi: true },
  { path: "kitchen.tables", taskIds: ["kitchen_table"], effect: "COUNT", inCustomerUi: true },
  { path: "kitchen.chairs", taskIds: ["kitchen_chair"], effect: "COUNT", inCustomerUi: true },
  { path: "kitchen.sinks", taskIds: ["kitchen_sink"], effect: "COUNT", inCustomerUi: true },
  {
    path: "kitchen.countertopUnits",
    taskIds: ["kitchen_counter"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  { path: "kitchen.bins", taskIds: ["kitchen_bin_empty"], effect: "COUNT", inCustomerUi: true },
  {
    path: "kitchen.applianceExteriors",
    taskIds: ["appliance_exterior"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  {
    path: "kitchen.microwaveInside",
    taskIds: ["microwave_inside"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "kitchen.refrigeratorInside",
    taskIds: ["refrigerator_inside"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "kitchen.dishwasher",
    taskIds: ["dishwasher_exterior"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "kitchen.cabinetFronts",
    taskIds: ["kitchen_cabinet_fronts"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  { path: "kitchen.dishes", taskIds: ["dishes_wash"], effect: "BOOLEAN_COUNT", inCustomerUi: true },
  {
    path: "additional.stairFloors",
    taskIds: ["stair_flight"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  {
    path: "additional.elevator",
    taskIds: ["elevator_cabin"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "additional.glassEntranceDoors",
    taskIds: ["glass_entrance_door"],
    effect: "COUNT",
    inCustomerUi: true,
  },
  {
    path: "additional.receptionDetail",
    taskIds: ["reception_detail"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
  {
    path: "additional.highTouchAreas",
    taskIds: ["high_touch_areas"],
    effect: "BOOLEAN_COUNT",
    inCustomerUi: true,
  },
];

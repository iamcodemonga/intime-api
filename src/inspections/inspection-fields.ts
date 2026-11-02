export const CHECK_FIELD_IDS = [
  'vehicleLicence',
  'roadworthinessCertificate',
  'vehicleInsurance',
  'driversLicence',
  'airConditionerFunctional',
  'radioFunctional',
  'hornFunctional',
  'seatCoveringIntegrity',
  'windowControlFunctional',
  'doorLocksFunctional',
  'doorHandlesFunctional',
  'cigaretteOdourSmellCheck',
  'tyreTreadDepth',
  'tyreCondition',
  'freeOfScratches',
  'freeOfDents',
  'noWindshieldWindowCracks',
  'noExternalMirrorCracks',
  'bodyPanelColoursConsistent',
  'carShocksCondition',
  'parkingBrakesEngage',
  'noGrindingNoise',
  'jackAndAccessories',
  'fireExtinguisher',
  'spareTyre',
  'hazardWarningTriangle',
  'headlightsWorking',
  'brakeLightsWorking',
  'indicatorsWorking',
] as const;

export const GRADE_FIELD_IDS = [
  'interiorGrade',
  'exteriorGrade',
  'cleanlinessGrade',
  'generalFunctionalityGrade',
] as const;

export const PHOTO_SLOT_KEYS = [
  'exteriorFront',
  'exteriorBack',
  'exteriorLeftSide',
  'exteriorRightSide',
  'interiorFront',
  'interiorBack',
  'doorHandleFrontLeft',
  'doorHandleFrontRight',
  'doorHandleBackLeft',
  'doorHandleBackRight',
  'chassisDocument',
  'chassisOnCar',
] as const;

export type CheckFieldId = (typeof CHECK_FIELD_IDS)[number];
export type GradeFieldId = (typeof GRADE_FIELD_IDS)[number];
export type PhotoSlotKey = (typeof PHOTO_SLOT_KEYS)[number];

export type CheckGroupDef = {
  id: string;
  title: string;
  fields: { id: CheckFieldId; label: string }[];
};

export const DETAILED_RESULT_GROUPS: CheckGroupDef[] = [
  {
    id: 'legalCompliance',
    title: 'Legal & Compliance Documents',
    fields: [
      { id: 'vehicleLicence', label: 'Vehicle licence' },
      { id: 'roadworthinessCertificate', label: 'Roadworthiness certificate' },
      { id: 'vehicleInsurance', label: 'Vehicle insurance' },
      { id: 'driversLicence', label: "Driver's licence" },
    ],
  },
  {
    id: 'interiorAmenities',
    title: 'Interior Amenities',
    fields: [
      { id: 'airConditionerFunctional', label: 'Air conditioner functional' },
      { id: 'radioFunctional', label: 'Radio functional' },
      { id: 'hornFunctional', label: 'Horn functional' },
      { id: 'seatCoveringIntegrity', label: 'Seat covering integrity' },
      { id: 'windowControlFunctional', label: 'Window control functional' },
      { id: 'doorLocksFunctional', label: 'Door locks functional' },
      { id: 'doorHandlesFunctional', label: 'Door handles functional' },
      { id: 'cigaretteOdourSmellCheck', label: 'Cigarette / odour smell check' },
    ],
  },
  {
    id: 'tyres',
    title: 'Tyres',
    fields: [
      { id: 'tyreTreadDepth', label: 'Tyre tread depth' },
      { id: 'tyreCondition', label: 'Tyre condition' },
    ],
  },
  {
    id: 'vehicleBody',
    title: 'Vehicle Body',
    fields: [
      { id: 'freeOfScratches', label: 'Free of scratches' },
      { id: 'freeOfDents', label: 'Free of dents' },
      { id: 'noWindshieldWindowCracks', label: 'No windshield / window cracks' },
      { id: 'noExternalMirrorCracks', label: 'No external mirror cracks' },
      { id: 'bodyPanelColoursConsistent', label: 'Body panel colours consistent' },
    ],
  },
  {
    id: 'brakesSuspension',
    title: 'Brakes & Suspension',
    fields: [
      { id: 'carShocksCondition', label: 'Car shocks condition' },
      { id: 'parkingBrakesEngage', label: 'Parking brakes engage' },
      { id: 'noGrindingNoise', label: 'No grinding noise' },
    ],
  },
  {
    id: 'emergencyEquipment',
    title: 'Emergency Equipment',
    fields: [
      { id: 'jackAndAccessories', label: 'Jack and accessories' },
      { id: 'fireExtinguisher', label: 'Fire extinguisher' },
      { id: 'spareTyre', label: 'Spare tyre' },
      { id: 'hazardWarningTriangle', label: 'Hazard warning triangle' },
    ],
  },
  {
    id: 'electronics',
    title: 'Electronics',
    fields: [
      { id: 'headlightsWorking', label: 'Headlights working' },
      { id: 'brakeLightsWorking', label: 'Brake lights working' },
      { id: 'indicatorsWorking', label: 'Indicators working' },
    ],
  },
];

export const SUMMARY_GRADE_FIELDS: { id: GradeFieldId; label: string }[] = [
  { id: 'interiorGrade', label: 'Interior grade' },
  { id: 'exteriorGrade', label: 'Exterior grade' },
  { id: 'cleanlinessGrade', label: 'Cleanliness grade' },
  { id: 'generalFunctionalityGrade', label: 'General functionality grade' },
];

export const PHOTO_SLOT_LABELS: Record<PhotoSlotKey, string> = {
  exteriorFront: 'Exterior front',
  exteriorBack: 'Exterior back',
  exteriorLeftSide: 'Exterior left side',
  exteriorRightSide: 'Exterior right side',
  interiorFront: 'Interior front',
  interiorBack: 'Interior back',
  doorHandleFrontLeft: 'Door handle front-left',
  doorHandleFrontRight: 'Door handle front-right',
  doorHandleBackLeft: 'Door handle back-left',
  doorHandleBackRight: 'Door handle back-right',
  chassisDocument: 'Chassis document',
  chassisOnCar: 'Chassis on car',
};

export const GRADE_DISPLAY: Record<string, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
};

export const REQUIRED_PHOTO_COUNT = PHOTO_SLOT_KEYS.length;
export const INSPECTION_PHOTOS_BUCKET = 'centers';
export const DEFAULT_PASS_MARK = 67;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

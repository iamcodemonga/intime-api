import {
  DETAILED_RESULT_GROUPS,
  GRADE_DISPLAY,
  PHOTO_SLOT_KEYS,
  PHOTO_SLOT_LABELS,
  SUMMARY_GRADE_FIELDS,
  type CheckFieldId,
  type GradeFieldId,
  type PhotoSlotKey,
} from '../inspections/inspection-fields.js';

export type ReportCheckItem = {
  id: CheckFieldId;
  label: string;
  passed: boolean;
  resultLabel: string;
};

export type ReportCheckGroup = {
  id: string;
  title: string;
  items: ReportCheckItem[];
};

export type ReportGradeItem = {
  id: GradeFieldId;
  label: string;
  value: string;
};

export type ReportPhotoItem = {
  slotKey: PhotoSlotKey;
  label: string;
  dataUrl: string | null;
};

export type FleetComfortReportViewModel = {
  documentTitle: string;
  passed: boolean;
  statusEyebrow: string;
  statusHeadline: string;
  statusSubtitle: string;
  vehicleNumber: string;
  vehicleSummary: string;
  locationLine: string;
  inspectionDateLabel: string;
  nextAppointmentLabel: string;
  compositeScore: number;
  passMark: number;
  scoreMarkerPercent: number;
  passMarkMarkerPercent: number;
  /** Full HTML attrs so the template avoids Handlebars inside style="…". */
  scoreMarkerStyleAttr: string;
  passMarkMarkerStyleAttr: string;
  checksPassed: number;
  checksFailed: number;
  checksTotal: number;
  photosCaptured: number;
  photosTotal: number;
  vehicleParticulars: { label: string; value: string }[];
  driverName: string;
  phoneNumber: string;
  emailAddress: string;
  /** Groups excluding electronics (shown on later page with grades). */
  detailedGroups: ReportCheckGroup[];
  electronicsGroup: ReportCheckGroup | null;
  grades: ReportGradeItem[];
  officerName: string;
  reportGeneratedLabel: string;
  photos: ReportPhotoItem[];
  footerBrand: string;
};

type InspectionLike = {
  vehicleNumber: string;
  mileageKm: number;
  year: number;
  make: string;
  model: string;
  exteriorColour: string;
  engineNumber: string;
  chassisNumber: string;
  driverFirstName: string;
  driverLastName: string;
  phoneNumber: string;
  emailAddress: string;
  checks: unknown;
  grades: unknown;
  checksPassed: number;
  checksFailed: number;
  photosCaptured: number;
  passMark: number;
  compositeScore: number;
  createdAt: Date;
  center: { name: string; address: string | null };
  createdBy: { firstName: string | null; lastName: string | null };
  photos: { slotKey: string; storagePath: string; mimeType: string }[];
};

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string') out[key] = raw;
  }
  return out;
}

function officerDisplayName(
  profile: InspectionLike['createdBy'],
): string {
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  return name || 'Inspector';
}

function locationLine(center: InspectionLike['center']): string {
  const parts = [center.name, center.address].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.join(', ') || '—';
}

export function buildFleetComfortReportViewModel(
  inspection: InspectionLike,
  photoDataUrls: Partial<Record<PhotoSlotKey, string>>,
): FleetComfortReportViewModel {
  const checks = asRecord(inspection.checks);
  const gradesRaw = asRecord(inspection.grades);
  const passed = inspection.compositeScore >= inspection.passMark;
  const checksTotal = inspection.checksPassed + inspection.checksFailed;
  const photosTotal = PHOTO_SLOT_KEYS.length;
  const nextAppointment = new Date(inspection.createdAt);
  nextAppointment.setDate(nextAppointment.getDate() + 90);

  const allGroups: ReportCheckGroup[] = DETAILED_RESULT_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    items: group.fields.map((field) => {
      const result = checks[field.id] === 'pass' ? 'pass' : 'fail';
      return {
        id: field.id,
        label: field.label,
        passed: result === 'pass',
        resultLabel: result === 'pass' ? 'Pass' : 'Fail',
      };
    }),
  }));

  const electronicsGroup =
    allGroups.find((group) => group.id === 'electronics') ?? null;
  const detailedGroups = allGroups.filter((group) => group.id !== 'electronics');

  const grades: ReportGradeItem[] = SUMMARY_GRADE_FIELDS.map((field) => {
    const raw = gradesRaw[field.id] ?? '';
    return {
      id: field.id,
      label: field.label,
      value: GRADE_DISPLAY[raw] ?? (raw ? raw : '—'),
    };
  });

  const photos: ReportPhotoItem[] = PHOTO_SLOT_KEYS.map((slotKey) => ({
    slotKey,
    label: PHOTO_SLOT_LABELS[slotKey],
    dataUrl: photoDataUrls[slotKey] ?? null,
  }));

  const scoreMarkerPercent = Math.min(100, Math.max(0, inspection.compositeScore));
  const passMarkMarkerPercent = Math.min(100, Math.max(0, inspection.passMark));

  return {
    documentTitle: 'Fleet Comfort Inspection',
    passed,
    statusEyebrow: passed ? 'INSPECTION PASSED' : 'INSPECTION FAILED',
    statusHeadline: passed
      ? `PASS · ${inspection.compositeScore}%`
      : `FAIL · ${inspection.compositeScore}%`,
    statusSubtitle: passed
      ? `Composite score ${inspection.compositeScore}% meets the ${inspection.passMark}% fleet pass mark.`
      : `Composite score ${inspection.compositeScore}% is below the ${inspection.passMark}% fleet pass mark.`,
    vehicleNumber: inspection.vehicleNumber,
    vehicleSummary: `${inspection.make} ${inspection.model} ${inspection.year}`,
    locationLine: locationLine(inspection.center),
    inspectionDateLabel: formatDateLabel(inspection.createdAt),
    nextAppointmentLabel: formatDateLabel(nextAppointment),
    compositeScore: inspection.compositeScore,
    passMark: inspection.passMark,
    scoreMarkerPercent,
    passMarkMarkerPercent,
    scoreMarkerStyleAttr: `style="left: ${scoreMarkerPercent}%"`,
    passMarkMarkerStyleAttr: `style="left: ${passMarkMarkerPercent}%"`,
    checksPassed: inspection.checksPassed,
    checksFailed: inspection.checksFailed,
    checksTotal,
    photosCaptured: inspection.photosCaptured,
    photosTotal,
    vehicleParticulars: [
      { label: 'VEHICLE NUMBER', value: inspection.vehicleNumber },
      { label: 'MILEAGE (KM)', value: String(inspection.mileageKm) },
      { label: 'YEAR', value: String(inspection.year) },
      { label: 'MAKE', value: inspection.make },
      { label: 'MODEL', value: inspection.model },
      { label: 'EXTERIOR COLOUR', value: inspection.exteriorColour },
      { label: 'ENGINE NUMBER', value: inspection.engineNumber },
      { label: 'CHASSIS NUMBER', value: inspection.chassisNumber },
    ],
    driverName:
      `${inspection.driverFirstName} ${inspection.driverLastName}`.trim() ||
      '—',
    phoneNumber: inspection.phoneNumber || '—',
    emailAddress: inspection.emailAddress || '—',
    detailedGroups,
    electronicsGroup,
    grades,
    officerName: officerDisplayName(inspection.createdBy),
    reportGeneratedLabel: formatDateLabel(inspection.createdAt),
    photos,
    footerBrand:
      'Powered by: Intime Mobility Africa · FleetPulse Africa · Indrive Mobility',
  };
}

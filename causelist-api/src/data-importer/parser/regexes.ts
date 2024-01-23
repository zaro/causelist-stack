// order matters
export const SECTION_NAMES = [
  'MENTION DATE FOR COMPLIANCE',
  /MENTIONS?/,
  /JUDGMENTS?/,
  'WRITTEN SUBMISSIONS',
  /SUBMISSIONS?/,
  'COMMERCIAL SUIT DIVISION',
  'DEFENSE HEARING',
  'DIRECTIONS',
  'PLEA',
  'SUMMONS FOR CONFIRMATION',
  'RECTIFICATION OF GRANT',
  /RULINGS?/,
  'CHILDREN’S SERVICE MONTH',
  'ASSESSMENT OF COSTS',
  'FORMAL PROOF HEARING',
  'FRESH HEARING',
  'INTER PARTE HEARING',
  /PART HEARD HEARINGS?/,
  'DEFENSE HEARING',
  /HEARING(?:\s+OF\s+|\s*-\s*)(?:\w+\s*)+/i,
  /HEARINGS?/,
  'MITIGATION',
  'CASE MANAGEMENT CONFERENCE',
  'CERTIFICATE OF URGENCY',
  'PLEA AND DUTY COURT',
  'SENTENCING',
  'DISMISSAL FOR WANT OF PROSECUTIONS',
  'DISMISSAL',
  'REGISTRATION/FILING',
  'SUMMONS',
  'TAXATION',
  'MENTION DATE FOR COMPLIANCE',
  'MEDIATION ADOPTION',
  'GAZETTEMENT',
  'CHILDREN CASES FOR DIRECTION',
  'WITHDRAWAL',
  'SCENE VISITS',
  'ENTRY OF CONSENTS',
  'PRE-TRIAL CONFERENCE',
  'INTERLOCUTORY APPLICATION',
  'FILING APPLICATION',
  'NOTICE TO SHOW CAUSE',
  'NOTICE OF MOTION',
  'RULINGS AND JUDGEMENTS',
  'ORDERS',
  'SITE VISIT',
  'SETTLEMENT OF TERMS',
  'ENTERING INTERLOCUTORY JUDGMENTS',
  'FILING DEFENCE',
  'PRELIMINARY OBJECTION',
  'TRIAL',
  'DIRECTIONS',
  'HIGHLIGHTING OF SUBMISSIONS',
  /PART\s*-\s*HEARD/,
  /\w+ OF APPEAL/,
  /APPLICATIONS?/,
];

export const SECTION_NAMES_AS_GROUP = new RegExp(
  '(?<typeOfCause>' +
    SECTION_NAMES.map((e) => (typeof e === 'string' ? e : e.source)).join('|') +
    ')',
);

export const JUDGE_HON_RE = /^\s*HON\.\s*.*/i;

export const CAUSE_LIST_NUM_RE = /(?<num>[1-9]\d*)\s*\.?\s*(?:\.\s*)?/;
export const CAUSE_LIST_ADDITIONAL_NUMBER_RE =
  /(?:(?<additionalNumber>\w+)\s+)/;
export const CAUSE_LIST_CASE_NUMBER_RE =
  /(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])/;
export const CAUSE_LIST_PARTIES_RE =
  /(?:(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?))/i;
export const CAUSE_LIST_DESCRIPTION_RE = /(?<description>.*?)/;

export const CAUSE_LIST_RE = [
  new RegExp(
    `^\\s*${CAUSE_LIST_NUM_RE.source}${CAUSE_LIST_ADDITIONAL_NUMBER_RE.source}?${CAUSE_LIST_CASE_NUMBER_RE.source}\\s*${CAUSE_LIST_PARTIES_RE.source}\\s*$`,
    'i',
  ),
  new RegExp(
    `^\\s*${CAUSE_LIST_NUM_RE.source}${CAUSE_LIST_ADDITIONAL_NUMBER_RE.source}?${CAUSE_LIST_CASE_NUMBER_RE.source}\\s*${CAUSE_LIST_DESCRIPTION_RE.source}\\s*$`,
    'i',
  ),
  new RegExp(
    `^\\s*${CAUSE_LIST_NUM_RE.source}${CAUSE_LIST_PARTIES_RE.source}\\s*$`,
    'i',
  ),
  new RegExp(
    `^\\s*${CAUSE_LIST_NUM_RE.source}(?<description>In\\s+The\\s+Estate\\s+Of.*?)\\s*$`,
    'i',
  ),
];

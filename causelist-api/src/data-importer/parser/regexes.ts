import { escapeForRegex } from './util.js';

export const EMAIL_RE =
  /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

export const PHONE_RE = /^(:?TEL:|TELEPHONE\s+NO\.)?\s*[\d\s-]+\s*$/;

// order matters
export const SECTION_NAMES = [
  /APPOINTMENTS?\s+OF\s+MEDIATOR/,
  'MENTION DATE FOR COMPLIANCE',
  /VIRTUAL (MENTIONS|RULINGS\/JUDGEMENTS|RULINGS|JUDGEMENTS)/,
  /MENTIONS?/,
  /JUDGMENTS?/,
  'WRITTEN SUBMISSIONS',
  /SUBMISSIONS?/,
  'COMMERCIAL SUIT DIVISION',
  'DEFENSE HEARING',
  'DIRECTIONS',
  'ENTRY OF CONSENTS',
  'PLEA',
  'REACTIVATION',
  'SIGNING OF THE DECREE',
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
  'HEARING DATE',
  /FOR\s+HEARING.*/,
  /HEARING(?:\s+OF\s+|\s*-\s*)(?:\w+\s*)+/i,
  /HEARINGS?/,
  'HEARING-APPLICATION',
  'JUDGMENT AND RULINGS VIA EMAIL',
  'MITIGATION',
  'PRISON MENTIONS',
  'CASE MANAGEMENT CONFERENCE',
  'CERTIFICATE OF URGENCY',
  'PLEA AND DUTY COURT',
  'SENTENCING',
  'DISMISSAL FOR WANT OF PROSECUTIONS',
  'DISMISSAL',
  'REGISTRATION/FILING',
  'SUMMONS',
  'BAIL/BOND',
  'BOND APPROVAL',
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
  /APPROVAL\s+BY\s+\w+/,
  'FILING APPLICATION',
  'NOTICE TO SHOW CAUSE',
  'NOTICE OF MOTION',
  'RULINGS AND JUDGEMENTS',
  // 'JUDGEMENTS',
  'ORDERS',
  'SITE VISIT',
  'SETTLEMENT OF TERMS',
  'ENTERING INTERLOCUTORY JUDGMENTS',
  'FILING DEFENCE',
  'FILLING BILL OF COST',
  'EXECUTION PROCEEDINGS',
  'OBJECTION PROCEEDINGS',
  'PRELIMINARY OBJECTION',
  'TRIAL',
  'DIRECTIONS',
  'HIGHLIGHTING OF SUBMISSIONS',
  'NOTICE TO SHOW CAUSE (NTSC)',
  'PART-HEARD',
  'CRIMINAL MATTERS',
  /JUDGMENT\s+IN\s+.*/,
  /PART(?:\s*-\s*|\s+)HEARD(?:\s+HEARING)/,
  /\w+ OF APPEAL/,
  /APPLICATIONS?/,
];

export const SECTION_NAMES_AS_GROUP = new RegExp(
  '(?<typeOfCause>' +
    SECTION_NAMES.map((e) =>
      typeof e === 'string' ? escapeForRegex(e) : e.source,
    ).join('|') +
    ')',
);

export const CAUSELIST_TYPE_RE = [
  /CIVIL\s*CAUSELIST/,
  /CRIMINAL\s*CAUSELIST/,
  /NAIROBI\s+ CAUSELIST/,
  /CIVIL\s+MATTER/,
  /MIGWANI MATTERS/,
  /All matters are handled virtual/,
  /[ab]\s*\.\s*(?:New|Old)/i,
  /(?:KIAMBU|LANGATA|NAIROBI)\s+REMAND/,
];

export const JUDGE_HON_RE = /^\s*HON\.\s*.*/i;

export const CAUSE_LIST_NUM_RE = /(?<num>[1-9]\d*)\s*\.?\s*(?:\.\s*)?/;
export const CAUSE_LIST_ADDITIONAL_NUMBER_RE =
  /(?:(?<additionalNumber>(?!ac|hc|mc|el)\w+)\s+)/;
export const CAUSE_LIST_CASE_NUMBER_RE =
  /(?<caseNumber>(?:\/\w+|\w+\/\w+|[a-z]\w+|\w+\s*[\w()]+\s*\/\w[\w\.&\s]*[\w()]+\s*|\w[\w\.&\s]*(?:\s*\/\s*|\s+)[\w()]+\s*)\/\s*[21][09][0126789][0123456789])/;
export const CAUSE_LIST_PARTIES_RE =
  /(?:(?<partyA>.*?)\s+-?(?:Vs\.?|Versus)-?\s+(?<partyB>.*?))/i;
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

export const CAUSELIST_ADV_RE = /(?<advocates>.*(?:ADV|PRISON))/i;

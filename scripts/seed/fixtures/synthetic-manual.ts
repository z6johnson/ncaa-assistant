// SYNTHETIC fixture manual. This is NOT real NCAA rule text. It exists only to
// exercise the parser, retrieval, and evals offline (no network, no real manual).
// It is clearly labeled in the manifest (academicYear: "FIXTURE") and must NEVER
// be presented as authoritative. The real index is built from the official
// Division I Manual via the url source.
//
// The text below imitates the manual's heading + body layout so parseManualText
// can extract sections. Wording is invented placeholder content.

export const SYNTHETIC_ACADEMIC_YEAR = "FIXTURE (synthetic, not real NCAA rules)";

export const SYNTHETIC_MANUAL_TEXT = `
11.1.1.1 Responsibility of Head Coach. [SYNTHETIC TEST TEXT] A head coach is
presumed to be responsible for the actions of all assistant coaches and staff
members who report, directly or indirectly, to the head coach. A head coach may
rebut this presumption by demonstrating that the head coach promoted an
atmosphere of compliance and monitored those who report to the head coach. See
Bylaw 11.1.1.2 for monitoring expectations.

11.1.1.2 Monitoring Expectations. [SYNTHETIC TEST TEXT] An institution shall
expect a head coach to take steps to confirm that staff members follow the
rules, including periodic review and documentation of compliance activities.

10.3 Sports Wagering Activities. [SYNTHETIC TEST TEXT] Staff members of an
athletics department and student-athletes shall not knowingly participate in
sports wagering activities or provide information to individuals involved in
organized gambling regarding intercollegiate, amateur, or professional athletics
competition. This prohibition includes wagering on professional sports.

13.2.1 General Regulation on Offers and Inducements. [SYNTHETIC TEST TEXT] An
institution's staff member or a representative of its athletics interests shall
not be involved, directly or indirectly, in making arrangements for or giving a
prospective student-athlete or anyone associated with the prospect any financial
aid or other benefits not expressly permitted.

11.2.2 Athletically Related Income. [SYNTHETIC TEST TEXT] Contractual agreements
between a coach and an institution shall include a stipulation that the coach
report annually all athletically related income and benefits from sources
outside the institution. A representative of athletics interests, sometimes
called a booster, may not provide compensation toward a coach's salary outside
the institution's control.

11.4.2 Countable Coach Employed at a Local High School. [SYNTHETIC TEST TEXT] An
individual who holds a coaching position at a local educational institution and
also serves on an institution's athletics staff is subject to applicable limits
on countable coaches and shall not use the high school position to circumvent
recruiting rules. Confirm status under Bylaw 11.4.1.
`.trim();

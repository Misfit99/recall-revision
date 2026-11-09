/*
 * Content registry. Subject files call Revision.addSubject(...) and
 * unit files call Revision.addUnit(...). Nothing here needs editing
 * when you add new material — see README.md.
 */
window.Revision = {
  subjects: [],
  units: {},
  addSubject(subject) {
    this.subjects.push(subject);
  },
  addUnit(unit) {
    this.units[unit.subject + "/" + unit.id] = unit;
  },
};

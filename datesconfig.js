class DatesConfig {
  constructor() {
    this.departure = {
      minDate: 0,
      maxDate: 365,
      validDaysOfWeek: [],
      includedDates: [],
      excludedDates: [],
      excludedDateRanges: [],
    };
    this.return = {
      minDate: 0,
      maxDate: 365,
      validDaysOfWeek: [],
      includedDates: [],
      excludedDates: [],
      excludedDateRanges: [],
    }
  }
};

export default DatesConfig;

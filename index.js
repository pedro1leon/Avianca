const urlAPI = 'https://avianca-dev.azure-api.net/flightsschedule-dev/calendar/';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {

  const url = new URL(request.url);
  const pathname = url.pathname.substring(1).toUpperCase().split('-');
  const origin = pathname[0];
  const destination = pathname.length > 1 ? pathname[1] : "";

  const requestOptions = {
    method: 'GET',
    headers: {
      "Ocp-Apim-Subscription-Key": "724e64c340644502bc7a966f94307c77",
    },
  };

  const [resDeparture, resReturn] = await Promise.all([
    fetch(urlAPI + origin+'-'+destination, requestOptions).catch(error => error),
    fetch(urlAPI + destination+'-'+origin, requestOptions).catch(error => error)
  ]);
  
  const datesConfig = {
    datesConfig: {
      departure: {
        minDate: 0,
        maxDate: 365,
        validDaysOfWeek: [],
        includedDates: [],
        excludedDates: [],
        excludedDateRanges: [],
        validFrom: '',
        validTo: ''  
      },
      return: {
        minDate: 14,
        maxDate: 372,
        validDaysOfWeek: [],
        includedDates: [],
        excludedDates: [],
        excludedDateRanges: [],
        validFrom: '',
        validTo: ''  
      }  
    }
  };

  const fullRangeDates = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const aDates = [];
    for(var dt=start; dt<=end; dt.setDate(dt.getDate()+1)){
      aDates.push(dt.toISOString().slice(0,10));
    }
    return aDates;
  }

  function getDaysFromToday(toDate) {
    const tDate = new Date(toDate);
    const todayD = new Date((new Date()).toISOString().slice(0,10));
    const diffInTime = tDate.getTime() - todayD.getTime();
    return Math.round(diffInTime / (1000 * 60 * 60 * 24));
  }

  let dateFrom = '';

  const getRouteDates = (data, route) => {
    let validDates = [];
    Object.keys(data.dateYears).forEach(year => {
      Object.keys(data.dateYears[year]).forEach(month => {
        const vdays = data.dateYears[year][month].map(day => year+'-'+month.padStart(2,0)+'-'+String(day).padStart(2,0));
        validDates = [...validDates, ...vdays];
      });
    });
    validDates = validDates.sort();
    dateFrom = (route === 'departure') ? validDates[0] : dateFrom;
    const allDates = fullRangeDates(dateFrom, validDates[validDates.length-1]);
    datesConfig.datesConfig[route].excludedDates = allDates.filter(d=>!validDates.includes(d));
    datesConfig.datesConfig[route].validFrom = dateFrom;
    datesConfig.datesConfig[route].validTo = validDates[validDates.length-1];
    datesConfig.datesConfig[route].minDate = getDaysFromToday(dateFrom);
    datesConfig.datesConfig[route].maxDate = getDaysFromToday(validDates[validDates.length-1]);
  }

  const getDatesConfig = async () => {
    if (resDeparture.status === 200) getRouteDates(await resDeparture.json(), 'departure');
    if (resReturn.status === 200) getRouteDates(await resReturn.json(), 'return');
    return datesConfig;
  }

  const dataStr = JSON.stringify(await getDatesConfig());

  return new Response(dataStr, {
    headers: { 'content-type': 'application/json' }
  })

}

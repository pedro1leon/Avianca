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

  const fetchOneWay = async url => {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw `{"status":"${response.status}", "statusText":"${response.statusText}"}`;
    }
    return response.json();
  }  

  const fetchDates = async () => {
    const response = await Promise.all([
      fetchOneWay(urlAPI + origin+'-'+destination),
      fetchOneWay(urlAPI + destination+'-'+origin)
    ]).catch(error => {
      return error;
    });
    return response;
  }

  const datesConfig = {
    departure: {
      minDate: 0,
      maxDate: 365,
      validDaysOfWeek: [],
      includedDates: [],
      excludedDates: [],
      excludedDateRanges: [],
    },
    return: {
      minDate: 14,
      maxDate: 372,
      validDaysOfWeek: [],
      includedDates: [],
      excludedDates: [],
      excludedDateRanges: [],
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
    // datesConfig[route].includedDates = validDates;
    const allDates = fullRangeDates(dateFrom, validDates[validDates.length-1]);
    datesConfig[route].excludedDates = allDates.filter(d=>!validDates.includes(d));
    datesConfig[route].minDate = dateFrom; 
    datesConfig[route].maxDate = validDates[validDates.length-1];
  }

  const resOpt = {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' }
  }

  const getDatesConfig = async () => {
    try {
      const response = await fetchDates();
      if (typeof response === 'string') {
        const error = JSON.parse(response); 
        resOpt.status = error.status;
        resOpt.statusText = error.statusText;
        return '';
      }
      const [resDeparture, resReturn] = response;
      getRouteDates(resDeparture, 'departure');
      getRouteDates(resReturn, 'return');
      return JSON.stringify(datesConfig);
    } catch (error) {
      console.log("paso: ", error);
    }
  }

  const dataStr = await getDatesConfig();

  return new Response(dataStr, resOpt)

}
